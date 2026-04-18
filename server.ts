import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

dotenv.config();

// Load Firebase Config
const firebaseConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
    });
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function verifyPaystackReference(reference: string) {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    return response.data.data;
}

// Shared Payment Verification Logic
async function handlePaymentVerification(reference: string, metadata: any) {
  // 1. Check if reference already exists to prevent duplicates
  const orderRef = db.collection('orders').doc(reference);
  const orderSnap = await orderRef.get();
  if (orderSnap.exists) return { success: true, alreadyProcessed: true };

  // 2. Call Paystack Verification API
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) throw new Error('PAYSTACK_SECRET_KEY is missing');

  console.log(`[Paystack] Verifying reference: ${reference}`);
  const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
  });

  const data = response.data.data;
  
  if (response.data.status && data.status === "success") {
      const orderUpdate = {
          reference: reference,
          email: data.customer.email,
          phone: metadata?.phone || data.metadata?.phone || null,
          network: metadata?.network || data.metadata?.network || null,
          bundle: metadata?.bundle || data.metadata?.bundle || null,
          amount: metadata?.originalAmount || (data.metadata && data.metadata.originalAmount) || (data.amount / 100),
          paymentStatus: "success",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: metadata || data.metadata || {}
      };

      // 3. Update existing pre-order if it exists, otherwise create new with reference as ID
      const internalOrderId = metadata?.internalOrderId || data.metadata?.orderId;
      if (internalOrderId) {
          const preOrderRef = db.collection('orders').doc(internalOrderId);
          const preOrderSnap = await preOrderRef.get();
          if (preOrderSnap.exists) {
              await preOrderRef.update(orderUpdate);
              console.log(`[Firestore] Pre-order updated: ${internalOrderId}`);
          } else {
              await orderRef.set({ ...orderUpdate, status: "pending", createdAt: admin.firestore.FieldValue.serverTimestamp() });
          }
      } else {
          await orderRef.set({ ...orderUpdate, status: "pending", createdAt: admin.firestore.FieldValue.serverTimestamp() });
      }

      return { success: true };
  } else {
      throw new Error('Paystack verification returned unsuccessful status');
  }
}

// REST Endpoint: verifyPayment (Accepts reference)
app.post('/api/verifyPayment', express.json(), async (req, res) => {
    const { reference, metadata } = req.body;
    if (!reference) return res.status(400).json({ success: false, error: 'Reference missing' });

    try {
        const result = await handlePaymentVerification(reference, metadata);
        res.json({ success: true, ...result });
    } catch (err: any) {
        console.error('Manual verification failed:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// REST Endpoint: Paystack Webhook
app.post('/api/paystack-webhook', express.raw({ type: '*/*' }), async (req: any, res: any) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'];
  
  if (!secret || !signature) return res.status(401).send('Credentials missing');

  const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
  if (hash !== signature) return res.status(401).send('Verification failed');

  const event = JSON.parse(req.body.toString());
  
  if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      try {
          await handlePaymentVerification(reference, metadata);
          console.log(`[Webhook] Payment processed: ${reference}`);
      } catch (err: any) {
          console.error('[Webhook] Processing failed:', err.message);
      }
  }

  res.sendStatus(200);
});

app.use(cors());
app.use(express.json());

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
