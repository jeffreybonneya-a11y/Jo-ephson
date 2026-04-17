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

// Firebase Setup
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
let firebaseConfigData: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfigData = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
}

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId
};

if (!admin.apps.length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: firebaseConfig.projectId });
    } catch (e) {
      admin.initializeApp({ projectId: firebaseConfig.projectId });
    }
  } else {
    admin.initializeApp({ projectId: firebaseConfig.projectId });
  }
}

const db = getFirestore(process.env.FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || '(default)');
const app = express();
const GIGSHUB_BASE_URL = 'https://www.gigshub.cloud/api/v1';
const GIGSHUB_API_KEY = process.env.GIGSHUB_API_KEY || 'dk_e87pONcP0e0NxTfZg-gvEwwpVf025Czu';

const api = axios.create({
  baseURL: GIGSHUB_BASE_URL,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'x-api-key': GIGSHUB_API_KEY }
});

// Paystack Webhook (Must be first)
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
      if (event.event !== 'charge.success') return res.sendStatus(200);

      const { reference, metadata, amount } = event.data;
      const paidAmount = amount / 100;
      const phone = metadata.phone;

      if (!phone) return res.sendStatus(200);

      const userRef = db.collection("users").where("phoneNumber", "==", phone);
      const userSnap = await userRef.get();
      
      let userDoc;
      if (userSnap.empty) {
        userDoc = await db.collection("users").add({ phoneNumber: phone, walletBalance: 0, transactions: [] });
      } else {
        userDoc = userSnap.docs[0];
      }

      if (metadata.type === 'topup') {
        await db.runTransaction(async (t) => {
          const u = await t.get(userDoc.ref);
          const balance = u.data()?.walletBalance || 0;
          t.update(userDoc.ref, { 
            walletBalance: balance + paidAmount,
            transactions: admin.firestore.FieldValue.arrayUnion({
              type: 'topup', amount: paidAmount, reference, status: 'success', date: new Date().toISOString()
            })
          });
        });
        console.log(`TOP UP SUCCESS: ${phone} + GHS ${paidAmount}`);
      } else if (metadata.type === 'purchase') {
        const orderId = `man_${Date.now()}`;
        await db.runTransaction(async (t) => {
          const u = await t.get(userDoc.ref);
          const balance = u.data()?.walletBalance || 0;
          if (balance < metadata.amount) return;
          t.update(userDoc.ref, {
            walletBalance: balance - metadata.amount,
            transactions: admin.firestore.FieldValue.arrayUnion({
              type: 'purchase', amount: metadata.amount, bundle: `${metadata.network} ${metadata.volume}GB`, status: 'pending', date: new Date().toISOString()
            })
          });
        });
        // Fulfillment logic omitted for brevity, integrate purchaseData here
        console.log(`PURCHASE SUCCESS: ${phone} - GHS ${metadata.amount}`);
      }
      res.sendStatus(200);
    } catch (err) { res.sendStatus(500); }
  }
);

app.use(cors());
app.use(express.json());

// Endpoints
app.post('/wallet/initiate-topup', async (req, res) => {
  const { phone, amount, email } = req.body;
  if (!/^233\d{9}$/.test(phone) || amount < 1) res.status(400).send('Invalid');
  const reference = `TOPUP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  res.json({ success: true, reference, amount, email });
});

app.get('/wallet/balance/:phone', async (req, res) => {
  const snap = await db.collection("users").where("phoneNumber", "==", req.params.phone).get();
  res.json({ 
    success: true, 
    phone: req.params.phone, 
    balance: snap.empty ? 0 : snap.docs[0].data().walletBalance || 0 
  });
});

app.get('/wallet/transactions/:phone', async (req, res) => {
  const snap = await db.collection("users").where("phoneNumber", "==", req.params.phone).get();
  res.json({ 
    success: true, 
    transactions: snap.empty ? [] : snap.docs[0].data().transactions || [] 
  });
});

app.get('/api/offers', async (req, res) => {
  try {
    const snap = await db.collection("bundles").where("active", "==", true).get();
    res.json({ success: true, offers: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// React App Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  }
  app.listen(3000, "0.0.0.0", () => console.log('Server running on 3000'));
}
startServer();
