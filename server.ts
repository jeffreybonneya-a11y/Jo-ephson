import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config safely
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
let firebaseConfigData: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfigData = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
}

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  const targetProjectId = firebaseConfig.projectId;
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: targetProjectId,
      });
      console.log(`[Firebase] Initialized with Service Account for: ${targetProjectId}`);
    } catch (e) {
      console.error("[Firebase] Service Account Parse Error, falling back:", e);
      admin.initializeApp({ projectId: targetProjectId });
    }
  } else {
    admin.initializeApp({ projectId: targetProjectId });
    console.log(`[Firebase] Initialized with Project ID: ${targetProjectId}`);
  }
}

const dbId = process.env.FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || '(default)';
const db = getFirestore(dbId);

const app = express();
const MARKUP_PERCENT = 20;

const GIGSHUB_BASE_URL = 'https://www.gigshub.cloud/api/v1';
const GIGSHUB_API_KEY = process.env.GIGSHUB_API_KEY || 'dk_e87pONcP0e0NxTfZg-gvEwwpVf025Czu';

const api = axios.create({
  baseURL: GIGSHUB_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': GIGSHUB_API_KEY
  }
});

// Helper Functions
function mapNetwork(network: string) {
  const normalized = network.trim().toLowerCase();
  const map: Record<string, string> = {
    mtn: 'mtn',
    vodafone: 'vodafone',
    telecel: 'vodafone',
    airteltigo: 'airteltigo'
  };
  return map[normalized] || null;
}

function validatePhone(phone: string) {
  return /^233\d{9}$/.test(phone);
}

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

async function purchaseData(phone: string, network: string, volume: string, offerSlug: string, orderId: string) {
  if (!validatePhone(phone)) throw new Error('Invalid phone: ' + phone);
  const mappedNetwork = mapNetwork(network);
  if (!mappedNetwork) throw new Error('Invalid network: ' + network);
  
  const idempotencyKey = generateKey();
  console.log(`[GigsHub] Placing order for ${orderId}:`, { phone, mappedNetwork, volume, offerSlug });
  
  const response = await api.post(`/order/${mappedNetwork}`, {
    type: 'single',
    volume,
    phone,
    offerSlug,
    webhookUrl: `https://${process.env.APP_URL?.replace('https://', '')}/api/webhook/gigshub`,
    metadata: { idempotencyKey, internalOrderId: orderId }
  });
  
  console.log('[GigsHub] Response:', response.data);
  return response.data;
}

// Webhook for Paystack
app.post(
  '/api/webhook/paystack',
  express.raw({ type: '*/*' }),
  async (req: any, res: any) => {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const signature = req.headers['x-paystack-signature'];
      const rawBody = req.body;

      const hash = crypto.createHmac('sha512', secret || "").update(rawBody).digest('hex');
      if (hash !== signature) return res.status(401).send('Mismatch');

      const event = JSON.parse(rawBody.toString());
      if (event.event === 'charge.success') {
        const { reference, metadata, amount } = event.data;
        const actualAmount = amount / 100;

        if (metadata.mode === 'topup') {
          // Wallet Top-up Logic
          const userId = metadata.userId;
          if (userId) {
            console.log(`[Paystack Webhook] Top-up success for ${userId}: ${actualAmount}`);
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
              walletBalance: admin.firestore.FieldValue.increment(actualAmount)
            });
            await db.collection("walletTransactions").add({
              userId: userId,
              amount: actualAmount,
              type: 'topup',
              status: 'success',
              reference: reference,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } else {
          // Original Purchase Logic
          const phone = metadata.phone || metadata.recipientPhone;
          const network = metadata.network || metadata.recipientNetwork;
          const volume = metadata.volume;
          const offerSlug = metadata.offerSlug;
          const orderId = metadata.orderId || `pay_${reference}`;

          console.log(`[Paystack Webhook] Purchase success for Order ${orderId}`);

          // Update or Create Order in Firestore
          const orderRef = db.collection("orders").doc(orderId);
          const orderDoc = await orderRef.get();

          const updateData: any = {
            paymentStatus: 'success',
            referenceCode: reference,
            status: 'processing',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          if (orderDoc.exists) {
            await orderRef.update(updateData);
          } else {
            await orderRef.set({
              ...updateData,
              customerName: 'Customer',
              userEmail: event.data.customer.email,
              recipientPhone: phone,
              recipientNetwork: network,
              bundleName: `${volume} Package`,
              volume: volume,
              offerSlug: offerSlug,
              amount: actualAmount,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          // Auto Fulfillment
          try {
            const fulfillment = await purchaseData(phone, network, volume, offerSlug, orderId);
            await orderRef.update({
              externalOrderId: fulfillment.orderId,
              externalReference: fulfillment.reference
            });
          } catch (fErr: any) {
            console.error(`[Fulfillment Failed] ${orderId}:`, fErr.message);
            await orderRef.update({ status: 'failed', failureReason: fErr.message });
          }
        }
      }
      res.sendStatus(200);
    } catch (err: any) {
      console.error('[Paystack Error]', err.message);
      res.sendStatus(500);
    }
  }
);

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/offers', async (req, res) => {
  try {
    const response = await api.get('/offers', { timeout: 15000 });
    const offers = response.data.offers || [];
    const pricedOffers = offers.map((offer: any) => ({
      ...offer,
      volumes: (offer.volumes || []).map((v: any) => ({
        ...v,
        costPrice: v.price,
        sellingPrice: Math.ceil(v.price + (v.price * MARKUP_PERCENT / 100))
      }))
    }));
    res.json({ success: true, offers: pricedOffers });
  } catch (err: any) {
    console.error('[Offers Error]', err.message);
    // Fallback to Firestore
    try {
      const snap = await db.collection("bundles").where("active", "==", true).get();
      res.json({ success: true, offers: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
    } catch {
      res.status(500).json({ message: 'Failed' });
    }
  }
});

app.get('/api/balance', async (req, res) => {
  try {
    const response = await api.get('/balance');
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/site-status', async (req, res) => {
  try {
    const response = await api.get('/balance');
    const balance = response.data.balance;
    // Notify if balance is less than 10 GHS
    res.json({ status: balance <= 10 ? 'low' : 'ok', balance });
  } catch {
    res.json({ status: 'ok' });
  }
});

app.post('/api/wallet/pay', async (req, res) => {
  try {
    const { userId, bundleId, bundleName, dataAmount, recipientPhone, recipientNetwork, amount, volume, offerSlug } = req.body;
    
    // 1. Transactional check and deduct
    const userRef = db.collection("users").doc(userId);
    const orderId = `man_${Date.now()}`;
    
    await db.runTransaction(async (t) => {
      const user = await t.get(userRef);
      if (!user.exists) throw new Error("User not found");
      const balance = user.data()!.walletBalance || 0;
      if (balance < amount) throw new Error("Insufficient funds");
      
      t.update(userRef, { walletBalance: balance - amount });
      
      // 2. Create Order
      const orderRef = db.collection("orders").doc(orderId);
      t.set(orderRef, {
        userId,
        recipientPhone,
        recipientNetwork,
        bundleId,
        bundleName,
        dataAmount,
        amountSent: amount,
        status: 'processing',
        paymentStatus: 'success',
        paymentMethod: 'wallet',
        volume,
        offerSlug,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // 3. Trigger GigsHub
    purchaseData(recipientPhone, recipientNetwork, volume, offerSlug, orderId);
    
    res.json({ success: true, orderId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/webhook/gigshub', async (req, res) => {
  const { internalOrderId, orderId, status } = req.body;
  console.log(`[GigsHub Webhook] Update for ${internalOrderId || orderId}: ${status}`);
  try {
    const id = internalOrderId || orderId;
    const orderRef = db.collection("orders").doc(id);
    const newStatus = status === 'completed' ? 'delivered' : status === 'failed' ? 'failed' : 'processing';
    await orderRef.update({ status: newStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  } catch (e) {}
  res.sendStatus(200);
});

// React App Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
