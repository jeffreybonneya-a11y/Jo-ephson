import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import axios from "axios";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config safely
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf-8"));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
}
const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "King J Deals API is running" });
  });

  app.get("/api/config-status", (req, res) => {
    const status = {
      emailService: !!process.env.VITE_EMAILJS_SERVICE_ID,
      emailTemplate: !!process.env.VITE_EMAILJS_TEMPLATE_ID
    };
    console.log("Config Status Check:", status);
    res.json(status);
  });

  // Paystack Verify Endpoint
  app.post("/api/paystack/verify", async (req, res) => {
    const { reference, orderId } = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({ success: false, message: "Paystack secret key not configured" });
    }

    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      });

      const data = response.data.data;

      if (data.status === "success") {
        // Update order status in Firestore
        if (orderId) {
          await db.collection("orders").doc(orderId).update({
            paymentStatus: "success",
            status: "pending", // Now it's pending admin delivery
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        res.json({ success: true, message: "Payment verified successfully", data });
      } else {
        if (orderId) {
          await db.collection("orders").doc(orderId).update({
            paymentStatus: "failed",
            status: "cancelled",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        res.json({ success: false, message: `Payment failed: ${data.gateway_response}` });
      }
    } catch (error: any) {
      console.error("Paystack verification error:", error.response?.data || error.message);
      res.status(500).json({ success: false, message: "Failed to verify transaction" });
    }
  });

  // Paystack Webhook Endpoint
  app.post("/api/paystack/webhook", async (req, res) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).send("Secret key not configured");
    }

    // Validate event
    const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;
    
    try {
      if (event.event === 'charge.success') {
        const reference = event.data.reference;
        const metadata = event.data.metadata;
        const orderId = metadata?.orderId;

        if (orderId) {
          await db.collection("orders").doc(orderId).update({
            paymentStatus: "success",
            status: "pending",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Webhook: Order ${orderId} marked as paid successfully.`);
        }
      }
      res.sendStatus(200);
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.sendStatus(500);
    }
  });

  app.post("/api/send-sms", async (req, res) => {
    const { message } = req.body;
    
    // Notifications are currently handled via EmailJS on the client side
    // and this endpoint is kept for future server-side notification expansions.
    console.log("Notification request received:", message);
    res.json({ success: true, message: "Notification logged on server" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
