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

// GigsHub API Config
const GIGSHUB_API_KEY = (process.env.GIGSHUB_API_KEY || process.env.VTU_API_KEY || "dk_e87pONcP0e0NxTfZg-gvEwwpVf025Czu").trim();
const GIGSHUB_BASE_URL = process.env.VTU_API_URL || "https://www.gigshub.cloud/api/v1";

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
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const targetProjectId = process.env.FIREBASE_PROJECT_ID || firebaseConfigData.projectId;
  
  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: targetProjectId,
        databaseURL: `https://${targetProjectId}.firebaseio.com`
      });
      console.log(`Firebase Admin initialized with Service Account for project: ${targetProjectId}`);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back to PROJECT_ID:", e);
      admin.initializeApp({ projectId: targetProjectId });
    }
  } else {
    admin.initializeApp({ projectId: targetProjectId });
    console.log(`Firebase Admin initialized with Project ID: ${targetProjectId}`);
  }
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId || '(default)');

/**
 * purchaseData() FUNCTION
 * Automatically fulfills data orders via GigsHub API
 */
async function purchaseData(phone: string, network: string, volume: string, offerSlug: string, orderId: string) {
  // Map network name to GigsHub format
  const networkMap: { [key: string]: string } = {
    'MTN': 'mtn',
    'Vodafone': 'vodafone',
    'Telecel': 'telecel', 
    'AirtelTigo': 'airteltigo',
    'AT': 'airteltigo'
  };

  const gigshubNetwork = networkMap[network] || network.toLowerCase();
  
  // Auto-convert standard local 10-digit number (e.g. 024xxxxxxx or 054xxxxxxx) to 233 format
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
    formattedPhone = '233' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('+233')) {
    formattedPhone = formattedPhone.substring(1);
  }

  // Validate phone: must match /^233\d{9}$/
  if (!/^233\d{9}$/.test(formattedPhone)) {
    throw new Error(`Invalid phone format: ${formattedPhone}. Must be 233 + 9 digits.`);
  }

  // Prevent duplicate double deducts on GigsHub by locking the idempotency to the exact order ID
  const idempotencyKey = `kjd_order_${orderId}`;

  const requestBody = {
    type: "single",
    volume: volume,
    phone: formattedPhone,
    offerSlug: offerSlug,
    webhookUrl: `https://${process.env.APP_URL || 'king-j-deals.onrender.com'}/api/webhook/gigshub`,
    metadata: { idempotencyKey, orderId }
  };

  console.log(`[GigsHub] Sending request to ${GIGSHUB_BASE_URL}/order/${gigshubNetwork}`);
  console.log(`[GigsHub] Request Body:`, JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post(`${GIGSHUB_BASE_URL}/order/${gigshubNetwork}`, requestBody, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': GIGSHUB_API_KEY
      }
    });

    console.log(`[GigsHub] Response Received:`, JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log(`[GigsHub] Purchase Successful for Order ${orderId}:`, response.data.message);
      // Update order with GigsHub details
      await db.collection("orders").doc(orderId).update({
        externalOrderId: response.data.orderId || (response.data.data?.orderId || response.data.data?.id),
        externalReference: response.data.reference || (response.data.data?.reference || response.data.data?.id),
        status: (response.data.status === 'success' || response.data.data?.status === 'success' || response.data.status === 'delivered') ? 'delivered' : 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return response.data;
    } else {
      const errorMsg = response.data.message || response.data.error || "GigsHub rejected the request";
      console.error(`[GigsHub] Purchase Rejected for Order ${orderId}: ${errorMsg}`);
      await db.collection("orders").doc(orderId).update({
        status: 'failed',
        failureReason: errorMsg,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error(`[GigsHub] Error:`, error.response?.data || error.message);
    // Only mark failed if we actually reached GigsHub and it wasn't a connection timeout
    if (error.response?.data || error.message.includes("failed")) {
       await db.collection("orders").doc(orderId).update({
          status: 'failed',
          failureReason: error.response?.data?.message || error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
       }).catch(() => {});
    }
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ================================================
  // ⚠️ PAYSTACK WEBHOOK MUST BE REGISTERED FIRST
  // BEFORE ANY GLOBAL BODY PARSER MIDDLEWARE
  // ================================================
  const paystackWebhookHandler = async (req: any, res: any) => {
    // CRITICAL: .trim() and remove quotes to absolutely prevent any accidental invisible characters or quotes from breaking the HMAC signature.
    const secretKey = process.env.PAYSTACK_SECRET_KEY?.replace(/['"]/g, '').trim();
    if (!secretKey) {
      console.error("[Paystack Webhook] Missing PAYSTACK_SECRET_KEY");
      return res.status(500).send("No secret key");
    }

    const signature = req.headers['x-paystack-signature'];
    
    if (!req.body || !Buffer.isBuffer(req.body)) {
      console.error("[Paystack Webhook] req.body is not a raw buffer. Ensure express.raw() is working.");
      return res.status(400).send("Invalid body parser");
    }

    // req.body MUST be a raw Buffer here because of express.raw()
    const hash = crypto.createHmac('sha512', secretKey).update(req.body).digest('hex');

    if (hash !== signature) {
      console.warn("[Paystack Webhook] Signature mismatch - verification failed");
      return res.status(401).json({ message: 'Verification failed. Please contact admin if you were charged.' });
    }

    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      return res.status(400).send("Invalid JSON payload");
    }

    console.log(`[Paystack Webhook] Received event: ${event.event}`);

    if (event.event !== 'charge.success') {
      return res.sendStatus(200);
    }

    try {
      const { reference } = event.data;
      let metadata = event.data.metadata || {};
      
      if (typeof metadata === 'string' && metadata.length > 0) {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {}
      }

      console.log(`[Paystack Webhook] Processing reference: ${reference}`);

      // Check for duplicate processing (reference is stored as paystackReference or referenceCode)
      const existingRef = await db.collection("orders").where("paystackReference", "==", reference).get();
      if (!existingRef.empty) {
        console.log(`[Paystack Webhook] Duplicate reference detected: ${reference}`);
        return res.sendStatus(200);
      }

      if (metadata?.type === 'topup') {
        const amount = Number(Math.max(0, (event.data.amount / 100) - 0.20).toFixed(2));
        const userId = metadata.userId;
        if (userId) {
          const userRef = db.collection("users").doc(userId);
          await userRef.update({ walletBalance: admin.firestore.FieldValue.increment(amount) });
          await db.collection("wallet_transactions").add({
            userId, amount, type: 'topup', status: 'success', reference,
            description: `Wallet Top-up via Paystack Webhook`, createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`[Paystack Webhook] Topup success for user ${userId}`);
        }
        return res.sendStatus(200);
      }

      // 1. Check GigsHub balance before fulfillment
      try {
        const balanceRes = await axios.get(`${GIGSHUB_BASE_URL}/balance`, {
          headers: { 'Accept': 'application/json', 'x-api-key': GIGSHUB_API_KEY },
          timeout: 15000
        });
        const currentBalance = balanceRes.data.balance || 0;
        console.log(`[Paystack Webhook] GigsHub Balance: ${currentBalance}`);

        if (currentBalance < 1) {
          console.warn(`[Paystack Webhook] Balance below GHS 1. Refunding customer...`);
          await axios.post(`https://api.paystack.co/refund`, 
            { transaction: reference },
            { headers: { Authorization: `Bearer ${secretKey}` } }
          ).catch(e => console.error("[Refund Error] ", e.message));
          return res.sendStatus(200);
        }
      } catch (e: any) {
        console.error("[Balance Check Error] ", e.message);
      }

      // 2. Find or Create Order
      let finalOrderId = metadata.orderId;
      let orderDoc: any = null;

      if (finalOrderId) {
        const docRef = await db.collection("orders").doc(finalOrderId).get();
        if (docRef.exists) orderDoc = docRef;
      }

      if (!orderDoc) {
        const existingByRefCode = await db.collection("orders").where("referenceCode", "==", reference).get();
        if (!existingByRefCode.empty) orderDoc = existingByRefCode.docs[0];
      }

      if (orderDoc) {
        finalOrderId = orderDoc.id;
        const orderData = orderDoc.data();
        
        if (orderData.paymentStatus !== 'success') {
          await db.collection("orders").doc(finalOrderId).update({
             paymentStatus: 'success',
             paystackReference: reference,
             updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        const phone = metadata.recipientPhone || (metadata.phone || orderData.recipientPhone);
        const network = metadata.recipientNetwork || (metadata.network || orderData.recipientNetwork);
        const volume = metadata.volume || orderData.volume;
        const offerSlug = metadata.offerSlug || orderData.offerSlug;

        if (orderData.status === 'pending' && phone && network && volume && offerSlug) {
          try {
            console.log(`[Paystack Webhook] Attempting automated fulfillment for order: ${finalOrderId}`);
            // Atomic check to prevent double-processing if the verify API hits simultaneously
            await db.runTransaction(async (transaction) => {
              const docSnap = await transaction.get(db.collection("orders").doc(finalOrderId));
              if (docSnap.data()?.status === 'pending') {
                transaction.update(db.collection("orders").doc(finalOrderId), { status: 'processing' });
              } else {
                throw new Error("Already processing or delivered");
              }
            });

            await purchaseData(phone, network, volume, offerSlug, finalOrderId);
          } catch (err: any) {
            console.error("[Paystack Webhook] Automation skipped or failed:", err.message);
          }
        }
      } else {
        // Backup: create new order if none was found
        const phone = metadata.recipientPhone || metadata.phone;
        const network = metadata.recipientNetwork || metadata.network;
        const { volume, offerSlug } = metadata;

        const orderRef = await db.collection("orders").add({
          userId: metadata.userId || 'anonymous',
          customerName: metadata.customerName || 'Customer',
          userEmail: metadata.userEmail || '',
          recipientPhone: phone,
          recipientNetwork: network,
          bundleId: metadata.bundleId || 'N/A',
          bundleName: metadata.bundleName || 'Data Bundle',
          dataAmount: metadata.dataAmount || volume || 'N/A',
          amountSent: metadata.amountSent || (event.data.amount / 100),
          paystackReference: reference,
          referenceCode: reference,
          status: 'pending',
          paymentStatus: 'success',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (phone && network && volume && offerSlug) {
          try {
            await db.collection("orders").doc(orderRef.id).update({ status: 'processing' });
            await purchaseData(phone, network, volume, offerSlug, orderRef.id);
          } catch (err) {}
        }
      }
      res.sendStatus(200);
    } catch (error: any) {
      console.error("[Paystack Webhook] Global Error:", error.message);
      res.sendStatus(200); 
    }
  };

  app.post("/api/paystack/webhook", express.raw({ type: '*/*', limit: '10mb' }), paystackWebhookHandler);
  app.post("/api/webhook/paystack", express.raw({ type: '*/*', limit: '10mb' }), paystackWebhookHandler);
  app.post("/api/webhook", express.raw({ type: '*/*', limit: '10mb' }), paystackWebhookHandler);

  // ================================================
  // ✅ REGISTER BODY PARSERS AFTER WEBHOOK ROUTE
  // ================================================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "King J Deals API is running" });
  });

  // API Site Status
  app.get("/api/site-status", async (req, res) => {
    try {
      const response = await axios.get(`${GIGSHUB_BASE_URL}/balance`, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': GIGSHUB_API_KEY
        },
        timeout: 15000
      });

      const balance = response.data?.balance || 0;
      
      if (balance < 1) {
        return res.json({ status: "low", message: "Service temporarily unavailable. Please try again later." });
      } else {
        return res.json({ status: "ok" });
      }
    } catch (error: any) {
      console.error("GigsHub Balance Check Failed for Site Status:", error.message);
      // If we can't fetch balance, don't block the site aggressively, just return ok for resilience
      return res.json({ status: "ok" });
    }
  });

  // GET Orders Endpoint (for polling)
  app.get("/api/orders", async (req, res) => {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ error: "Reference required" });
    
    try {
      // Find order by paystack reference or reference code
      let snapshot = await db.collection("orders")
        .where("paystackReference", "==", reference)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        snapshot = await db.collection("orders")
          .where("referenceCode", "==", reference)
          .limit(1)
          .get();
      }

      if (snapshot.empty) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderData = snapshot.docs[0].data();
      res.json({
        id: snapshot.docs[0].id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : orderData.createdAt
      });
    } catch (err: any) {
      console.error("[API Orders] Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Proxy to GigsHub: Get Offers (with Firestore fallback)
  app.get("/api/offers", async (req, res) => {
    try {
      const response = await axios.get(`${GIGSHUB_BASE_URL}/offers`, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': GIGSHUB_API_KEY
        },
        timeout: 15000 // 15 second timeout
      });

      // If GigsHub returns an error object (like revoked key) even with 200 OK
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }

      console.log(`[GigsHub] Successfully fetched ${response.data?.length} offers`);
      res.json(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error("GigsHub Offers Error (Falling back to Firestore):", errorMsg);
      
      try {
        // Fallback: Fetch bundles from Firestore
        const bundlesSnapshot = await db.collection("bundles").where("active", "==", true).get();
        const bundles = bundlesSnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert network to GigsHub format (lowercase)
          // Telecel -> vodafone, the rest just lowercase
          let net = data.network?.toLowerCase() || 'mtn';
          if (net === 'telecel') net = 'vodafone';
          
          return {
            id: doc.id,
            name: data.name,
            volume: data.dataAmount || "0",
            price: data.price,
            network: net,
            offerSlug: data.offerSlug || "",
            isLocal: true
          };
        });
        
        console.log(`[Fallback] Loaded ${bundles.length} bundles from Firestore`);
        res.json(bundles);
      } catch (dbError: any) {
        console.error("Firestore Fallback Error:", dbError.message);
        res.status(500).json({ success: false, message: "Service temporarily unavailable" });
      }
    }
  });

  // Proxy to GigsHub: Get Balance
  app.get("/api/balance", async (req, res) => {
    try {
      const response = await axios.get(`${GIGSHUB_BASE_URL}/balance`, {
        headers: { 'Accept': 'application/json', 'x-api-key': GIGSHUB_API_KEY },
        timeout: 15000
      });
      
      if (response.data && response.data.error) {
        return res.json({ balance: 0, status: "error", message: response.data.error });
      }
      
      res.json(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error("GigsHub Balance Error:", errorMsg);
      res.json({ balance: 0, status: "error", message: errorMsg });
    }
  });

  // Manual Buy Data (for testing)
  app.post("/api/buy-data", async (req, res) => {
    const { network, phone, volume, offerSlug, orderId } = req.body;
    try {
      const result = await purchaseData(phone, network, volume, offerSlug, orderId || 'TEST-' + Date.now());
      res.json(result);
    } catch (error: any) {
      // Include the actual response from GigsHub if it crashed with 400
      const detail = error.response?.data || error.message;
      res.status(500).json({ success: false, message: "Purchase failed", detail });
    }
  });

  app.get("/api/config-status", (req, res) => {
    const status = {
      emailService: !!process.env.VITE_EMAILJS_SERVICE_ID,
      emailTemplate: !!process.env.VITE_EMAILJS_TEMPLATE_ID,
      paystackPublic: !!process.env.VITE_PAYSTACK_PUBLIC_KEY,
      paystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
      gigshubKey: !!GIGSHUB_API_KEY,
    };
    res.json(status);
  });

  // Wallet Order Endpoint
  app.post("/api/orders/wallet", async (req, res) => {
    const { userId, bundleId, recipientPhone, recipientNetwork, amountSent, volume, offerSlug } = req.body;

    try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const userData = userDoc.data();
      const currentBalance = userData?.walletBalance || 0;

      if (currentBalance < amountSent) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }

      // Check GigsHub balance before proceeding
      try {
        const ghBalanceRes = await axios.get(`${GIGSHUB_BASE_URL}/balance`, {
          headers: { 'Accept': 'application/json', 'x-api-key': GIGSHUB_API_KEY }
        });
        if (ghBalanceRes.data.balance < 1) { // Generic check
           console.warn("Low GigsHub Balance detected");
        }
      } catch (e) {}

      // 1. Deduct balance
      await userRef.update({
        walletBalance: admin.firestore.FieldValue.increment(-amountSent)
      });

      // 2. Create order
      const orderRef = await db.collection("orders").add({
        userId,
        customerName: userData?.fullName || 'Customer',
        userEmail: userData?.email || '',
        recipientPhone,
        recipientNetwork,
        bundleId,
        bundleName: (await db.collection("bundles").doc(bundleId).get()).data()?.name || 'Bundle',
        amountSent,
        referenceCode: 'WALLET-' + Math.random().toString(36).substring(7).toUpperCase(),
        status: 'pending',
        paymentStatus: 'success',
        paymentMethod: 'wallet',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Record transaction
      await db.collection("wallet_transactions").add({
        userId, amount: amountSent, type: 'purchase', status: 'success', reference: orderRef.id,
        description: `Wallet Payment for Order #${orderRef.id.slice(-6).toUpperCase()}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. AUTOMATED FULFILLMENT
      if (offerSlug && volume) {
        try {
          await purchaseData(recipientPhone, recipientNetwork, volume, offerSlug, orderRef.id);
        } catch (fulfillmentError) {
          console.error("Automated fulfillment failed for wallet order:", fulfillmentError);
        }
      }

      res.json({ success: true, orderId: orderRef.id });
    } catch (error: any) {
      console.error("Wallet Order Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Paystack Verify Endpoint
  app.post("/api/paystack/verify", async (req, res) => {
    const { reference, orderId, type } = req.body;
    
    // CRITICAL: .trim() and replace quotes to absolutely prevent any accidental characters from environment variables
    const secretKey = process.env.PAYSTACK_SECRET_KEY?.replace(/['"]/g, '').trim();

    if (!secretKey) {
      console.error("[Paystack Verify] Missing PAYSTACK_SECRET_KEY");
      return res.status(500).json({ success: false, message: "Paystack secret not configured" });
    }

    if (!reference) {
      console.error("[Paystack Verify] Missing transaction reference");
      return res.status(400).json({ success: false, message: "Missing reference" });
    }

    try {
      console.log(`[Paystack Verify] Verifying reference: ${reference}`);
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
      });

      const data = response.data.data;
      if (!data) throw new Error("No data returned from Paystack");

      let metadata = data.metadata || {};
      // Handle metadata being a string (common in some Paystack scenarios)
      if (typeof metadata === 'string' && metadata.length > 0) {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("[Paystack Verify] Failed to parse metadata string:", metadata);
        }
      }

      console.log(`[Paystack Verify] Status: ${data.status}, Metadata:`, JSON.stringify(metadata));

      if (data.status === "success") {
        const amount = Number(Math.max(0, (data.amount / 100) - 0.20).toFixed(2)); 

        if (type === 'topup' || metadata.type === 'topup' || data.type === 'topup') {
          const userId = orderId || metadata.userId;
          if (!userId) {
            console.error("[Paystack Verify] Missing userId for topup");
            return res.status(400).json({ success: false, message: "Missing userId for topup" });
          }
          
          const userRef = db.collection("users").doc(userId);
          const existingTopup = await db.collection("wallet_transactions").where("reference", "==", reference).get();
          if (existingTopup.empty) {
            await userRef.update({ walletBalance: admin.firestore.FieldValue.increment(amount) });
            await db.collection("wallet_transactions").add({
              userId, amount, type: 'topup', status: 'success', reference,
              description: `Wallet Top-up via Paystack`, createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[Paystack Verify] Topup success for user ${userId}: ${amount}`);
          }
          return res.json({ success: true, message: "Wallet topped up" });
        }

        // Standard Order Fulfillment
        let finalOrderId = orderId || metadata.orderId;
        console.log(`[Paystack Verify] Finding order: ID=${finalOrderId}, Ref=${reference}`);

        let orderDoc: any = null;
        if (finalOrderId) {
          const docRef = await db.collection("orders").doc(finalOrderId).get();
          if (docRef.exists) orderDoc = docRef;
        }

        if (!orderDoc) {
          const existingByRef = await db.collection("orders").where("referenceCode", "==", reference).get();
          if (!existingByRef.empty) orderDoc = existingByRef.docs[0];
        }
        
        // Final fallback: check by paystackReference field just in case
        if (!orderDoc) {
          const existingByPaystackRef = await db.collection("orders").where("paystackReference", "==", reference).get();
          if (!existingByPaystackRef.empty) orderDoc = existingByPaystackRef.docs[0];
        }

        if (orderDoc) {
          finalOrderId = orderDoc.id;
          const orderData = orderDoc.data();
          console.log(`[Paystack Verify] Found existing order: ${finalOrderId}. Status: ${orderData.status}`);
          
          if (orderData.paymentStatus !== 'success') {
            await db.collection("orders").doc(finalOrderId).update({
              paymentStatus: 'success',
              paystackReference: reference,
              referenceCode: reference, 
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            orderData.paymentStatus = 'success';
          }

          // Trigger automated fulfillment if pending
          const recipientPhone = metadata.recipientPhone || orderData.recipientPhone;
          const recipientNetwork = metadata.recipientNetwork || orderData.recipientNetwork;
          const volume = metadata.volume || orderData.volume;
          const offerSlug = metadata.offerSlug || orderData.offerSlug;

          if (orderData.status === 'pending' && recipientPhone && recipientNetwork && volume && offerSlug) {
            try {
              console.log(`[Paystack Verify] Attempting automated fulfillment for order: ${finalOrderId}`);
              // Atomic status check before calling purchaseData
              await db.runTransaction(async (transaction) => {
                const docSnap = await transaction.get(db.collection("orders").doc(finalOrderId));
                if (docSnap.data()?.status === 'pending') {
                  transaction.update(db.collection("orders").doc(finalOrderId), { status: 'processing' });
                } else {
                  throw new Error("Already processing or delivered");
                }
              });

              await purchaseData(recipientPhone, recipientNetwork, volume, offerSlug, finalOrderId);
            } catch (err: any) {
              console.error("[Paystack Verify] Automation skipped or failed:", err.message);
            }
          }
        } else {
          console.log("[Paystack Verify] No existing order found. Creating new order.");
          const newOrderRef = await db.collection("orders").add({
            userId: metadata.userId || 'anonymous',
            customerName: metadata.customerName || 'Customer',
            userEmail: metadata.userEmail || '',
            recipientPhone: metadata.recipientPhone,
            recipientNetwork: metadata.recipientNetwork,
            bundleId: metadata.bundleId,
            bundleName: metadata.bundleName,
            dataAmount: metadata.dataAmount,
            amountSent: metadata.amountSent || (data.amount / 100),
            paystackReference: reference,
            referenceCode: reference,
            status: 'pending',
            paymentStatus: 'success',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          finalOrderId = newOrderRef.id;

          if (metadata.recipientPhone && metadata.recipientNetwork && metadata.volume && metadata.offerSlug) {
            try {
              await purchaseData(metadata.recipientPhone, metadata.recipientNetwork, metadata.volume, metadata.offerSlug, finalOrderId);
            } catch (err) {}
          }
        }
        res.json({ success: true, orderId: finalOrderId });
      } else {
        console.warn(`[Paystack Verify] Payment failed for reference ${reference}: ${data.status}`);
        res.json({ success: false, message: `Payment failed: ${data.status}` });
      }
    } catch (error: any) {
      console.error("[Paystack Verify] Exception:", error.response?.data || error.message);
      res.status(500).json({ success: false, message: "Failed to verify transaction" });
    }
  });

  // GIGSHUB WEBHOOK
  app.post("/api/webhook/gigshub", async (req: any, res) => {
    console.log("[GigsHub Webhook] Event Received:", JSON.stringify(req.body, null, 2));
    
    // GigsHub sends status often in 'status' field, but might be in 'data.status' depending on event
    const { status, message, orderId: ghOrderId, metadata } = req.body;
    const dbOrderId = metadata?.orderId || ghOrderId;

    if (dbOrderId) {
      try {
        // Map GigsHub status to internal status
        let finalStatus = 'processing';
        if (status === 'success' || status === 'delivered' || status === 'completed') {
          finalStatus = 'delivered';
        } else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
          finalStatus = 'failed';
        }

        await db.collection("orders").doc(dbOrderId).update({
          status: finalStatus,
          externalStatus: status,
          externalMessage: message || '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[GigsHub Webhook] Order ${dbOrderId} updated to ${finalStatus} (${status})`);
      } catch (err: any) {
        console.error("[GigsHub Webhook] DB Update Error:", err.message);
      }
    }
    res.sendStatus(200);
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

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
