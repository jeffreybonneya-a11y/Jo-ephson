import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
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
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: firebaseConfig.projectId,
        });
    } catch (e) {
        console.warn('Failed to initialize with applicationDefault, falling back to default initializeApp:', e);
        admin.initializeApp();
    }
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const app = express();

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
      const meta = metadata || data.metadata || {};
      const isStream = meta.type === 'stream';
      let streamStatus = null;
      if (isStream) {
          streamStatus = meta.streamType === 'live' ? 'approved' : 'pending_approval';
      }

      const orderUpdate = {
          reference: reference,
          email: data.customer.email,
          userId: meta.userId || null,
          customerName: meta.customerName || null,
          phone: meta.phone || null,
          network: meta.network || null,
          bundle: meta.bundle || null,
          amount: meta.originalAmount || (data.amount / 100),
          paymentStatus: "success",
          type: isStream ? 'stream' : 'data',
          streamType: meta.streamType || null,
          streamStatus: streamStatus,
          status: isStream ? 'delivered' : 'pending',
          recipientUsername: meta.recipientUsername || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: meta
      };

      // 3. Update existing pre-order if it exists, otherwise create new with reference as ID
      const internalOrderId = metadata?.internalOrderId || data.metadata?.orderId;
      if (internalOrderId) {
          const preOrderRef = db.collection('orders').doc(internalOrderId);
          const preOrderSnap = await preOrderRef.get();
          if (preOrderSnap.exists) {
              await preOrderRef.update(orderUpdate);
              console.log(`[Firestore] Pre-order updated: ${internalOrderId}`);
              
              // Update agent_orders if it exists
              const agentOrderRef = db.collection('agent_orders').doc(internalOrderId);
              const agentOrderSnap = await agentOrderRef.get();
              if (agentOrderSnap.exists) {
                  await agentOrderRef.update({
                      status: "pending",
                      paymentReference: reference,
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
              }
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

// REST Endpoint: Seed Silver & FC
app.get('/api/seed-fc', async (req, res) => {
    try {
        const bundles = [
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '40 FC Points', price: 7.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '100 FC Points', price: 15.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '140 FC Points', price: 22.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '180 FC Points', price: 29.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '220 FC Points', price: 36.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '260 FC Points', price: 43.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '340 FC Points', price: 50.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '380 FC Points', price: 57.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '380 FC Points (Premium)', price: 74.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '420 FC Points', price: 81.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '460 FC Points', price: 88.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '500 FC Points', price: 95.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '540 FC Points', price: 102.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '1070 FC Points', price: 142.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '2200 FC Points', price: 280.00, active: true },
          { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '9999 FC Points', price: 1500.00, active: true },
        ];
        
        for (const b of bundles) {
            await db.collection('bundles').add({
              ...b,
              name: b.dataAmount,
              createdAt: new Date()
            });
        }

        const newSilverPackages = [
          { dataAmount: '39 FC Silver', price: 8.00 },
          { dataAmount: '99 FC Silver', price: 17.00 },
          { dataAmount: '499 FC Silver', price: 80.00 },
          { dataAmount: '999 FC Silver', price: 155.00 },
          { dataAmount: '1999 FC Silver', price: 310.00 },
          { dataAmount: '4999 FC Silver', price: 770.00 },
          { dataAmount: '9999 FC Silver', price: 1530.00 }
        ];
        
        for (const b of newSilverPackages) {
            await db.collection('bundles').add({
              network: 'FC Mobile Silver',
              category: 'FC Mobile Silver',
              dataAmount: b.dataAmount,
              name: b.dataAmount,
              price: b.price,
              active: true,
              createdAt: new Date()
            });
        }
        res.json({ success: true, message: 'FC seeded' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// REST Endpoint: Stream Player (Secure Viewer)
app.get('/api/stream/player/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const uid = req.query.uid;
    
    if (!uid || !orderId) return res.status(403).send('Forbidden: Missing parameters');

    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) return res.status(404).send('Not Found');
        
        const data = orderDoc.data();
        if (data?.userId !== uid || data?.type !== 'stream' || data?.streamStatus !== 'approved') {
            const errorHtml = `<html><body style="background:#0c0c0e;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h1>Access Denied 👑</h1><p style="color:#888;">Stream pending approval or invalid request.</p></body></html>`;
            return res.status(403).send(errorHtml);
        }

        const streamUrl = data.streamType === 'live' 
            ? 'https://cricfy.net/tv-63/' 
            : 'https://www.soccertvhd.com/hesgoal-hes-goal-live-streaming/';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0c0c0e; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
                <script>
                    document.addEventListener('contextmenu', event => event.preventDefault());
                    document.onkeydown = function(e) {
                        if(e.keyCode == 123) return false;
                        if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
                        if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false;
                        if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
                        if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
                    }
                </script>
            </head>
            <body>
                <iframe src="${streamUrl}" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
            </body>
            </html>
        `;
        res.send(html);
    } catch (err: any) {
        res.status(500).send('Server Error');
    }
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
