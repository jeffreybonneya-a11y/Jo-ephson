import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import axios from "axios";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const GIGSHUB_BASE_URL = process.env.GIGSHUB_BASE_URL || "https://www.gigshub.cloud/api/v1";
const GIGSHUB_API_KEY = process.env.GIGSHUB_API_KEY || "dk_e87pONcP0e0NxTfZg-gvEwwpVf025Czu";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
  const targetProjectId = firebaseConfig.projectId || firebaseConfigData.projectId;
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

// Get Firestore instance with aggressive database ID handling
const dbId = process.env.FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || '(default)';
console.log(`[Firebase] Target Database ID: ${dbId}`);
const db = getFirestore(dbId);

/**
 * purchaseData() - Automated fulfillment function
 */
async function purchaseData(phone: string, network: string, volume: string, offerSlug: string, orderId: string) {
  const mappedNetwork = network.toLowerCase().replace('telecel', 'vodafone').replace('airteltigo', 'airteltigo').replace('mtn', 'mtn');
  
  const phoneRegex = /^233\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error(`Invalid phone format: ${phone}. Must be 233 + 9 digits.`);
  }

  const idempotencyKey = crypto.randomBytes(16).toString('hex');
  const endpoint = `${GIGSHUB_BASE_URL}/order/${mappedNetwork}`;

  console.log(`[GigsHub] Sending purchase request to: ${endpoint}`);
  console.log(`[GigsHub] Payload:`, { phone, network: mappedNetwork, volume, offerSlug, idempotencyKey });

  try {
    const response = await axios.post(endpoint, {
      type: "single",
      volume,
      phone,
      offerSlug,
      webhookUrl: `https://${process.env.APP_URL?.replace('https://', '')}/api/webhook/gigshub`,
      metadata: { 
        idempotencyKey,
        internalOrderId: orderId
      }
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': GIGSHUB_API_KEY
      }
    });

    console.log(`[GigsHub] Response Received:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[GigsHub] Purchase Error:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "King J Deals API is running" });
  });

  // Proxy Balance
  app.get("/api/balance", async (req, res) => {
    try {
      const response = await axios.get(`${GIGSHUB_BASE_URL}/balance`, {
        headers: { 'Accept': 'application/json', 'x-api-key': GIGSHUB_API_KEY }
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy Offers
  app.get("/api/offers", async (req, res) => {
    let responded = false;
    try {
      if (!GIGSHUB_API_KEY) throw new Error("GIGSHUB_API_KEY missing");
      
      const response = await axios.get(`${GIGSHUB_BASE_URL}/offers`, {
        headers: { 'Accept': 'application/json', 'x-api-key': GIGSHUB_API_KEY },
        timeout: 25000 // Very generous timeout for GigsHub
      });
      
      if (!responded) {
        res.json(response.data);
        responded = true;
      }
    } catch (error: any) {
      console.error("[GigsHub Offers Error]", error.message);
      if (responded) return;

      // Fallback 1: Local Firestore bundles
      try {
        const bundlesSnapshot = await db.collection("bundles").where("active", "==", true).get();
        if (bundlesSnapshot.empty) throw new Error("No bundles in DB");
        
        const bundles = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(bundles);
        responded = true;
      } catch (dbErr: any) {
        console.error("[Local Bundles Fallback Error]", dbErr.message);
        if (responded) return;

        // Fallback 2: Hardcoded "Royal Emergency" deals
        console.log("[Fallback] Using emergency hardcoded deals");
        const emergencyBundles = [
          { id: 'mtn-1', name: 'MTN Royal 1GB', dataAmount: '1 GB', price: 10, network: 'MTN', active: true, offerSlug: 'mtn_1gb' },
          { id: 'mtn-2', name: 'MTN Royal 5GB', dataAmount: '5 GB', price: 35, network: 'MTN', active: true, offerSlug: 'mtn_5gb' },
          { id: 'tel-1', name: 'Telecel Royal 1GB', dataAmount: '1 GB', price: 9, network: 'Telecel', active: true, offerSlug: 'telecel_1gb' },
          { id: 'at-1', name: 'AirtelTigo Royal 1GB', dataAmount: '1 GB', price: 8, network: 'AirtelTigo', active: true, offerSlug: 'airteltigo_1gb' },
        ];
        res.json(emergencyBundles);
        responded = true;
      }
    }
  });

  // Manual Buy Data (for testing)
  app.post("/api/buy-data", async (req, res) => {
    try {
      const { network, phone, volume, offerSlug, orderId } = req.body;
      const result = await purchaseData(phone, network, volume, offerSlug, orderId || "manual_test");
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Paystack Webhook
  app.post("/api/webhook/paystack", async (req, res) => {
    const signature = req.headers['x-paystack-signature'] as string;
    
    // Verify signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY || "").update(JSON.stringify(req.body)).digest('hex');
    if (hash !== signature) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const { orderId, phone, network, volume, offerSlug } = metadata;

      console.log(`[Paystack Webhook] Payment Successful! Ref: ${reference}, Order: ${orderId}`);

      try {
        // Prevent duplicate processing
        const orderDoc = await db.collection("orders").doc(orderId).get();
        if (orderDoc.exists && orderDoc.data()?.paymentStatus === 'success') {
          console.log(`[Paystack Webhook] Order ${orderId} already processed.`);
          return res.status(200).send('Already processed');
        }

        // Update Order local status
        await db.collection("orders").doc(orderId).update({
          paymentStatus: 'success',
          referenceCode: reference,
          status: 'processing',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // AUTOMATIC FULFILLMENT
        console.log(`[Auto-Fulfillment] Initiating GigsHub purchase for Order ${orderId}...`);
        const fulfillmentRes = await purchaseData(phone, network, volume, offerSlug, orderId);
        
        // Update order with GigsHub ref
        await db.collection("orders").doc(orderId).update({
          externalOrderId: fulfillmentRes.orderId,
          externalReference: fulfillmentRes.reference,
          status: 'processing'
        });

      } catch (err: any) {
        console.error(`[Auto-Fulfillment] FAILED for Order ${orderId}:`, err.message);
        await db.collection("orders").doc(orderId).update({
          paymentStatus: 'success', // Payment was still successful
          status: 'failed',
          failureReason: err.message
        });
      }
    }

    res.status(200).send('OK');
  });

  // GigsHub Webhook
  app.post("/api/webhook/gigshub", async (req, res) => {
    const { orderId, status, reference } = req.body;
    console.log(`[GigsHub Webhook] Status update for ${orderId}: ${status}`);

    try {
      // Find order by GigsHub orderId or internal metadata if provided
      // Assuming GigsHub returns our metadata or we can find it by their orderId
      const ordersSnapshot = await db.collection("orders").where("externalOrderId", "==", orderId).limit(1).get();
      
      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0];
        const newStatus = status === "completed" ? "delivered" : status === "failed" ? "failed" : "processing";
        
        await orderDoc.ref.update({
          status: newStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[GigsHub Webhook] Updated internal order ${orderDoc.id} to ${newStatus}`);
      }
    } catch (err: any) {
      console.error(`[GigsHub Webhook] Error updating order:`, err.message);
    }

    res.status(200).send('OK');
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    try {
      const snapshot = await db.collection("orders").orderBy("createdAt", "desc").limit(50).get();
      res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve Static Files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);
    // Startup check
    try {
      const testRef = db.collection('settings').doc('announcement');
      const doc = await testRef.get();
      console.log(`[Firestore Status] Connection Successful. Announcement exists: ${doc.exists}`);
    } catch (err: any) {
      console.error(`[Firestore Status] CONNECTION FAILED: ${err.message}`);
    }
  });
}

startServer();
