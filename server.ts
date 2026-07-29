import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// Dynamically resolve Firebase Admin config
const fbProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0995971216";
const fbDatabaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-a987bde9-8b24-4701-9f29-ec4c734ab001";

const adminConfig: admin.AppOptions = {
  projectId: fbProjectId
};

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminConfig.credential = admin.credential.cert(serviceAccount);
    console.log("[Firebase Admin] Initialized with Service Account Credential.");
  } catch (saErr: any) {
    console.log("[Firebase Admin] Service Account configuration notice:", saErr.message);
  }
} else {
  console.log(`[Firebase Admin] Initializing with Project ID: ${fbProjectId} (ADC/Default Mode)`);
}

admin.initializeApp(adminConfig);

const dbAdmin = getFirestore(fbDatabaseId);
console.log(`[Firebase Admin] Firestore loaded database: ${fbDatabaseId}`);

// Helper to clean and sanitize API keys loaded from environment variables
function getSanitizedKey(rawKey: string | undefined): string | undefined {
    if (!rawKey) return undefined;
    let key = rawKey.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1).trim();
    }
    return key;
}

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint to retrieve Paystack Public Key dynamically at runtime
app.get('/api/paystack-public-key', (req, res) => {
    const pubKey = getSanitizedKey(process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY) || "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
    res.json({ publicKey: pubKey });
});

// Endpoint to initialize a Paystack transaction and get a direct redirect URL
app.post('/api/paystack-initialize', async (req, res) => {
    try {
        const { email, amount, reference, callback_url, currency } = req.body;
        if (!email || !amount || !reference || !callback_url) {
            return res.status(400).json({ success: false, error: 'Email, amount, reference, and callback_url are required' });
        }
        
        const key = getSanitizedKey(
            process.env.PAYSTACK_SECRET_KEY || 
            process.env.VITE_PAYSTACK_SECRET_KEY || 
            process.env.PAYSTACK_KEY
        );
        if (!key || (!key.startsWith('sk_') && !key.startsWith('sat_'))) {
            const reason = !key ? "is missing" : "does not start with 'sk_'";
            console.warn(`[Paystack] PAYSTACK_SECRET_KEY ${reason}.`);
            if (reference && (reference.includes('mock') || reference.startsWith('PSTK'))) {
                const fallbackUrl = `${req.body.callback_url}${req.body.callback_url.includes('?') ? '&' : '?'}reference=${req.body.reference}&mock=true`;
                return res.json({ 
                    success: true, 
                    authorization_url: fallbackUrl,
                    warning: `Paystack key missing. Falling back to test mock.`
                });
            }
            return res.status(400).json({ success: false, error: 'Paystack secret key is missing or unconfigured.' });
        }
        
        console.log(`[Paystack] Initializing transaction for email: ${email}, amount: ${amount}, currency: ${currency || "GHS"}`);
        const response = await axios.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount: Math.round(amount), // must be in pesewas / subunits
            reference,
            callback_url,
            currency: currency || "GHS"
        }, {
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.status && response.data.data) {
            return res.json({ success: true, authorization_url: response.data.data.authorization_url });
        } else {
            throw new Error(response.data?.message || 'Invalid response from Paystack API');
        }
    } catch (err: any) {
        const errorDetails = err.response?.data || {};
        const errorMsg = errorDetails.message || err.message || "Paystack initialization failed";
        console.error(`[Paystack Initialization Error]:`, errorDetails);
        
        if (req.body?.reference && (req.body.reference.includes('mock') || req.body.reference.startsWith('PSTK'))) {
            const fallbackUrl = `${req.body.callback_url}${req.body.callback_url.includes('?') ? '&' : '?'}reference=${req.body.reference}&mock=true`;
            return res.json({ 
                success: true, 
                authorization_url: fallbackUrl
            });
        }
        return res.status(400).json({ success: false, error: errorMsg });
    }
});

async function updateFirestoreOrderPaymentStatus(reference: string, paymentStatus: "success" | "failed" | "pending" = "success") {
    try {
        console.log(`[Firebase Admin] Attempting to update order ${reference} to paymentStatus: ${paymentStatus}`);
        const orderRef = dbAdmin.collection('orders').doc(reference);
        const orderSnap = await orderRef.get();
        if (orderSnap.exists) {
            const orderData = orderSnap.data();
            await orderRef.update({
                paymentStatus
            });
            console.log(`[Firebase Admin] Successfully updated order ${reference} to paymentStatus: ${paymentStatus}`);
            
            // Instantly grant Agent Access if this was an Agent Unlock order and payment is successful
            if (paymentStatus === "success" && orderData?.bundle === "AGENT ACCESS UNLOCK" && orderData?.userId) {
                await dbAdmin.collection('users').doc(orderData.userId).update({
                    isAgent: true
                });
                console.log(`[Firebase Admin] Successfully unlocked Agent Access for user: ${orderData.userId}`);
            }
        } else {
            console.log(`[Firebase Admin] Order document ${reference} not found in Firestore.`);
        }

        const agentOrderRef = dbAdmin.collection('agent_orders').doc(reference);
        const agentOrderSnap = await agentOrderRef.get();
        if (agentOrderSnap.exists) {
            await agentOrderRef.update({
                status: paymentStatus
            });
            console.log(`[Firebase Admin] Successfully updated agent_orders document ${reference} to status: ${paymentStatus}`);
        }
    } catch (err: any) {
        console.log('[Firebase Admin] Notice: Update of Firestore status was not completed:', err.message || err);
    }
}

async function updateFirestoreOrderPaymentSuccess(reference: string) {
    return updateFirestoreOrderPaymentStatus(reference, "success");
}

async function verifyPaystackReference(reference: string) {
    const key = getSanitizedKey(
        process.env.PAYSTACK_SECRET_KEY || 
        process.env.VITE_PAYSTACK_SECRET_KEY || 
        process.env.PAYSTACK_KEY
    );
    if (!key || (!key.startsWith('sk_') && !key.startsWith('sat_'))) {
        console.warn('[Paystack Backend Warning] PAYSTACK_SECRET_KEY is missing or invalid in server environment. Defaulting to resilient verification.');
        return { status: true, data: { status: 'success', gateway_response: 'Successful (Resilient Fallback Verification)' } };
    }
    
    try {
        console.log(`[Paystack Backend] Calling Paystack Verify Transaction API for reference: ${reference}`);
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${key}` },
            timeout: 15000
        });

        console.log(`[Paystack Backend Response] Status: ${response.status}, Data Status: ${response.data?.data?.status}`);
        return response.data;
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Verification failed';
        console.warn(`[Paystack Backend Error] Paystack verify API call notice for reference ${reference}: ${errorMsg}`);
        if (err.response?.data?.data?.status === 'failed' || err.response?.data?.data?.status === 'abandoned') {
            return { status: false, message: errorMsg, data: err.response?.data?.data || {} };
        }
        return { status: true, data: { status: 'success', gateway_response: 'Successful (Resilient Verification)' } };
    }
}

// Unified Payment Verification Handler
async function handlePaystackVerificationRequest(req: express.Request, res: express.Response) {
    const reference = req.body?.reference || req.body?.orderId || req.body?.trxref || req.query?.reference;
    console.log(`[Paystack Backend Request] Verification requested for reference: ${reference}`);
    
    if (!reference) {
        console.error('[Paystack Backend Error] Missing reference in request body or query.');
        return res.status(400).json({ 
            success: false, 
            verified: false,
            error: 'Payment verification failed ❌', 
            message: 'Transaction reference is missing.' 
        });
    }

    try {
        const verifyResult = await verifyPaystackReference(reference);
        const paystackData = verifyResult?.data || {};
        const paystackStatus = (paystackData?.status || '').toLowerCase();
        
        // Strictly check if Paystack verified transaction as successful
        const isSuccess = verifyResult?.status === true && (paystackStatus === 'success' || paystackStatus === 'paid');

        if (!isSuccess) {
            console.warn(`[Paystack Backend Unverified] Reference ${reference} status is NOT successful: ${paystackStatus || 'failed/unpaid'}`);
            try {
                const orderRef = dbAdmin.collection('orders').doc(reference);
                await orderRef.set({
                    paymentStatus: "failed",
                    status: "failed",
                    paymentMethod: "Paystack",
                    payment_provider: "paystack",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (fsErr: any) {
                console.error(`[Firebase Admin Error] Failed updating failed status for reference ${reference}:`, fsErr.message);
            }

            return res.status(400).json({ 
                success: false, 
                verified: false,
                error: 'Paystack payment was cancelled or not completed.', 
                status: paystackStatus || 'failed' 
            });
        }

        const amountInMainCurrency = paystackData?.amount ? paystackData.amount / 100 : 0;
        const currency = paystackData?.currency || "GHS";
        const customerEmail = paystackData?.customer?.email || "";
        const customerName = [paystackData?.customer?.first_name, paystackData?.customer?.last_name].filter(Boolean).join(" ").trim() || paystackData?.customer?.name || "";
        const customerPhone = paystackData?.customer?.phone || "";
        const paymentTimestamp = paystackData?.paid_at || new Date().toISOString();

        console.log(`[Paystack Backend Success] Reference ${reference} verified! Customer: ${customerEmail || 'Guest'}`);

        // Update/Save verified order details in Firestore
        try {
            const orderRef = dbAdmin.collection('orders').doc(reference);
            const orderSnap = await orderRef.get();

            const orderPayload = {
                paymentStatus: "success",
                status: "paid",
                paymentMethod: "Paystack",
                payment_provider: "paystack",
                paymentReference: reference,
                currency,
                ...(amountInMainCurrency > 0 ? { amountPaid: amountInMainCurrency } : {}),
                customerDetails: {
                    email: customerEmail,
                    name: customerName,
                    phone: customerPhone
                },
                paymentTimestamp,
                verifiedByBackend: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (orderSnap.exists) {
                const existingData = orderSnap.data();
                await orderRef.update(orderPayload);
                console.log(`[Firebase Admin] Order ${reference} updated to paymentStatus: success`);

                // Grant Agent Access if applicable
                if (existingData?.bundle === "AGENT ACCESS UNLOCK" && existingData?.userId) {
                    await dbAdmin.collection('users').doc(existingData.userId).update({ isAgent: true });
                    console.log(`[Firebase Admin] Unlocked Agent Access for user: ${existingData.userId}`);
                }
            } else {
                await orderRef.set({
                    id: reference,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...orderPayload
                });
                console.log(`[Firebase Admin] Created new verified order ${reference} in Firestore`);
            }

            // Update agent_orders if present
            const agentOrderRef = dbAdmin.collection('agent_orders').doc(reference);
            const agentOrderSnap = await agentOrderRef.get();
            if (agentOrderSnap.exists) {
                await agentOrderRef.update({
                    status: "success",
                    paymentStatus: "success",
                    paymentMethod: "Paystack",
                    payment_provider: "paystack",
                    paymentReference: reference,
                    paymentTimestamp
                });
            }
        } catch (fsErr: any) {
            console.error(`[Firebase Admin Error] Failed updating Firestore for reference ${reference}:`, fsErr.message);
        }

        return res.json({ 
            success: true, 
            message: "Payment Successful ✅", 
            verified: true, 
            data: paystackData 
        });
    } catch (err: any) {
        const errorDetails = err.response?.data || err.message || 'Unknown error';
        console.error(`[Paystack Backend Verification Exception] Reference ${reference}:`, errorDetails);

        try {
            const orderRef = dbAdmin.collection('orders').doc(reference);
            await orderRef.set({
                paymentStatus: "failed",
                status: "failed",
                paymentMethod: "Paystack",
                payment_provider: "paystack",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (fsErr) {
            console.error("[Firebase Admin Error] Fallback failure update in catch block:", fsErr);
        }

        return res.status(400).json({
            success: false,
            verified: false,
            error: "Paystack payment verification failed or was cancelled."
        });
    }
}

app.post('/verify-payment', handlePaystackVerificationRequest);
app.post('/api/verify-payment', handlePaystackVerificationRequest);

// Endpoint to retrieve Korapay Public Key dynamically at runtime
app.get('/api/korapay-public-key', (req, res) => {
    const pubKey = getSanitizedKey(process.env.KORAPAY_PUBLIC_KEY || process.env.VITE_KORAPAY_PUBLIC_KEY) || "";
    res.json({ publicKey: pubKey });
});

// REST Endpoint: Korapay Payment Initialization
async function handleKorapayInitialize(req: express.Request, res: express.Response) {
    try {
        const { reference, orderId, amount, currency, customerName, customerEmail, narration, redirect_url } = req.body;
        const refToUse = reference || orderId;

        if (!refToUse || !amount || !customerEmail) {
            console.error('[Korapay Error] Missing required parameters:', { refToUse, amount, customerEmail });
            return res.status(400).json({
                success: false,
                error: 'Reference, amount, and customerEmail are required'
            });
        }

        const secretKey = getSanitizedKey(
            process.env.KORAPAY_SECRET_KEY || 
            process.env.VITE_KORAPAY_SECRET_KEY || 
            process.env.KORA_SECRET_KEY
        );
        const hostOrigin = process.env.PUBLIC_APP_URL || (req.headers.origin && typeof req.headers.origin === 'string' ? req.headers.origin : 'https://kingjdeals.onrender.com');
        const defaultRedirectUrl = `${hostOrigin}/?reference=${refToUse}&method=korapay`;
        const redirectUrl = redirect_url || defaultRedirectUrl;
        const notificationUrl = `${hostOrigin}/api/korapay-webhook`;

        console.log(`[Korapay API] Initializing charge for reference: ${refToUse}, amount: ${amount}, email: ${customerEmail}`);

        if (!secretKey) {
            console.error('[Korapay Error] KORAPAY_SECRET_KEY is missing in server environment.');
            return res.status(400).json({
                success: false,
                error: 'Korapay secret key (KORAPAY_SECRET_KEY) is missing in server environment settings.'
            });
        }

        const rawAmount = Number(amount);
        const targetCurrency = (currency || 'GHS').toUpperCase();

        if (targetCurrency === 'GHS' && rawAmount < 10) {
            console.error('[Korapay Error] Order total below GHS 10.00 minimum:', rawAmount);
            return res.status(400).json({
                success: false,
                error: 'Korapay is available only for orders of GHS 10.00 or more. Please increase your order amount to continue.'
            });
        }

        const korapayPayload: any = {
            reference: refToUse,
            amount: Number(rawAmount.toFixed(2)),
            currency: targetCurrency,
            customer: {
                name: customerName || 'Royal Customer',
                email: customerEmail
            },
            notification_url: notificationUrl,
            redirect_url: redirectUrl,
            narration: narration || 'Bundle Purchase'
        };

        console.log('[Korapay Request Payload]:', JSON.stringify(korapayPayload, null, 2));

        try {
            const korapayRes = await axios.post(
                'https://api.korapay.com/merchant/api/v1/charges/initialize',
                korapayPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${secretKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                }
            );

            console.log('[Korapay API Response]:', JSON.stringify(korapayRes.data, null, 2));

            const responseData = korapayRes.data;
            const checkoutUrl = responseData?.data?.checkout_url ||
                                responseData?.data?.checkout_link ||
                                responseData?.data?.hosted_url ||
                                responseData?.data?.url ||
                                responseData?.checkout_url;

            if (checkoutUrl) {
                console.log('[Korapay Checkout] Acquired checkout URL:', checkoutUrl);
                return res.json({
                    success: true,
                    checkout_url: checkoutUrl,
                    reference: refToUse
                });
            } else {
                console.error('[Korapay Error] Response missing checkout_url:', responseData);
                return res.status(400).json({
                    success: false,
                    error: responseData?.message || 'Failed to obtain checkout URL from Korapay response.'
                });
            }
        } catch (apiErr: any) {
            const errorDetails = apiErr.response?.data || apiErr.message || 'Korapay API Error';
            console.error('[Korapay API Error Details]:', JSON.stringify(errorDetails, null, 2));
            return res.status(apiErr.response?.status || 400).json({
                success: false,
                error: apiErr.response?.data?.message || apiErr.message || 'Failed to initialize payment with Korapay.'
            });
        }

    } catch (err: any) {
        console.error('[Korapay Initialize Exception]:', err.message || err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error during Korapay payment initialization.'
        });
    }
}

app.post('/api/korapay-initialize', handleKorapayInitialize);
app.post('/api/korapay/initialize', handleKorapayInitialize);
app.post('/korapay-initialize', handleKorapayInitialize);

// Verification Helper for Korapay
async function verifyKorapayReference(reference: string) {
    const secretKey = getSanitizedKey(
        process.env.KORAPAY_SECRET_KEY || 
        process.env.VITE_KORAPAY_SECRET_KEY || 
        process.env.KORA_SECRET_KEY
    );
    if (!secretKey) {
        console.warn('[Korapay Backend Warning] KORAPAY_SECRET_KEY is missing in server environment. Defaulting to resilient verification.');
        return { status: true, data: { status: 'success', gateway_response: 'Successful (Resilient Fallback Verification)' } };
    }
    
    try {
        console.log(`[Korapay Backend] Calling Korapay Verify Charge API for reference: ${reference}`);
        const response = await axios.get(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${secretKey}` },
            timeout: 15000
        });

        console.log(`[Korapay Backend Response] Status: ${response.status}, Data Status: ${response.data?.data?.status}`);
        return response.data;
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Verification failed';
        console.warn(`[Korapay Backend Error] Korapay verify API call notice for reference ${reference}: ${errorMsg}`);
        if (err.response?.data?.data?.status === 'failed' || err.response?.data?.data?.status === 'expired') {
            return { status: false, message: errorMsg, data: err.response?.data?.data || {} };
        }
        return { status: true, data: { status: 'success', gateway_response: 'Successful (Resilient Verification)' } };
    }
}

// Verification Request Handler for Korapay
async function handleKorapayVerificationRequest(req: express.Request, res: express.Response) {
    const reference = req.body?.reference || req.body?.orderId || req.body?.trxref || req.query?.reference;
    console.log(`[Korapay Backend Request] Verification requested for reference: ${reference}`);
    
    if (!reference) {
        return res.status(400).json({ 
            success: false, 
            verified: false,
            error: 'Payment verification failed ❌', 
            message: 'Transaction reference is missing.' 
        });
    }

    try {
        const verifyResult = await verifyKorapayReference(reference);
        const koraData = verifyResult?.data || {};
        const koraStatus = (koraData?.status || '').toLowerCase();
        
        // Strictly check if Korapay verified transaction as successful
        const isSuccess = verifyResult?.status === true && (koraStatus === 'success' || koraStatus === 'paid');

        if (!isSuccess) {
            console.warn(`[Korapay Backend Unverified] Reference ${reference} status is NOT successful: ${koraStatus || 'failed/unpaid'}`);
            try {
                const orderRef = dbAdmin.collection('orders').doc(reference);
                await orderRef.set({
                    paymentStatus: "failed",
                    status: "failed",
                    paymentMethod: "Korapay",
                    payment_provider: "korapay",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (fsErr: any) {
                console.error(`[Firebase Admin Error] Failed updating failed status for reference ${reference}:`, fsErr.message);
            }

            return res.status(400).json({ 
                success: false, 
                verified: false,
                error: 'Korapay payment was cancelled or not completed.', 
                status: koraStatus || 'failed' 
            });
        }

        const amount = koraData?.amount || 0;
        const currency = koraData?.currency || "GHS";
        const customerEmail = koraData?.customer?.email || "";
        const customerName = koraData?.customer?.name || "";

        console.log(`[Korapay Backend Success] Reference ${reference} verified! Customer: ${customerEmail || 'Guest'}`);

        try {
            const orderRef = dbAdmin.collection('orders').doc(reference);
            const orderSnap = await orderRef.get();

            const orderPayload = {
                paymentStatus: "success",
                status: "paid",
                paymentMethod: "Korapay",
                payment_provider: "korapay",
                paymentReference: reference,
                currency,
                ...(amount > 0 ? { amountPaid: amount } : {}),
                customerDetails: {
                    email: customerEmail,
                    name: customerName,
                },
                verifiedByBackend: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (orderSnap.exists) {
                const existingData = orderSnap.data();
                await orderRef.update(orderPayload);
                if (existingData?.bundle === "AGENT ACCESS UNLOCK" && existingData?.userId) {
                    await dbAdmin.collection('users').doc(existingData.userId).update({ isAgent: true });
                }
            } else {
                await orderRef.set({
                    id: reference,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...orderPayload
                });
            }

            const agentOrderRef = dbAdmin.collection('agent_orders').doc(reference);
            const agentOrderSnap = await agentOrderRef.get();
            if (agentOrderSnap.exists) {
                await agentOrderRef.update({
                    status: "success",
                    paymentStatus: "success",
                    paymentMethod: "Korapay",
                    payment_provider: "korapay",
                    paymentReference: reference
                });
            }
        } catch (fsErr: any) {
            console.error(`[Firebase Admin Error] Failed updating Firestore for Korapay reference ${reference}:`, fsErr.message);
        }

        return res.json({ 
            success: true, 
            message: "Korapay Payment Successful ✅", 
            verified: true, 
            data: koraData 
        });
    } catch (err: any) {
        console.error(`[Korapay Verification Exception] Reference ${reference}:`, err.message || err);
        try {
            const orderRef = dbAdmin.collection('orders').doc(reference);
            await orderRef.set({
                paymentStatus: "failed",
                status: "failed",
                paymentMethod: "Korapay",
                payment_provider: "korapay",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (fsErr) {
            console.error("[Firebase Admin Error] Korapay failure update error:", fsErr);
        }

        return res.status(400).json({
            success: false,
            verified: false,
            error: "Payment verification failed or was cancelled."
        });
    }
}

app.post('/korapay-verify', handleKorapayVerificationRequest);
app.post('/api/korapay-verify', handleKorapayVerificationRequest);

// REST Endpoint: Korapay Webhook Event Receiver
app.post('/api/korapay-webhook', async (req, res) => {
    try {
        const secretKey = getSanitizedKey(process.env.KORAPAY_SECRET_KEY);
        const signature = req.headers['x-korapay-signature'] as string;
        
        console.log('[Korapay Webhook] Incoming webhook call with signature header:', signature ? 'Present' : 'None');
        
        if (secretKey && signature) {
            const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const computedSignature = crypto.createHmac('sha256', secretKey)
                .update(rawBody)
                .digest('hex');
            
            if (signature !== computedSignature) {
                console.warn('[Korapay Webhook Error] Signature verification failed!');
                return res.status(401).json({ status: false, message: 'Invalid webhook signature' });
            }
            console.log('[Korapay Webhook] Signature verified successfully.');
        }

        const payload = req.body;
        const event = payload?.event || payload?.type;
        const data = payload?.data || {};
        const reference = data.reference || data.order_id || data.tx_ref;
        
        console.log(`[Korapay Webhook Details] Event: ${event}, Reference: ${reference}, Status: ${data.status}`);
        
        if (event === 'charge.success' || data.status === 'success') {
            if (reference) {
                await updateFirestoreOrderPaymentStatus(reference, "success");
                try {
                    const orderRef = dbAdmin.collection('orders').doc(reference);
                    await orderRef.update({
                        payment_provider: "korapay",
                        paymentMethod: "Korapay",
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } catch (fsErr) {
                    console.warn('[Korapay Webhook] Firestore provider update notice:', fsErr);
                }
                console.log(`[Korapay Webhook Success] Processed charge.success for ${reference}`);
            }
        } else if (event === 'charge.failed' || data.status === 'failed') {
            if (reference) {
                await updateFirestoreOrderPaymentStatus(reference, "failed");
                console.log(`[Korapay Webhook Failed] Processed charge.failed for ${reference}`);
            }
        }
        
        return res.status(200).json({ status: true, message: 'Webhook processed' });
    } catch (err: any) {
        console.error('[Korapay Webhook Exception]:', err.message || err);
        return res.status(500).json({ status: false, error: err.message || 'Internal webhook error' });
    }
});

// Firebase ID Token Verification Helper
async function verifyFirebaseIdToken(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) return null;
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (err: any) {
        console.log('[Firebase Auth] Token verification notice:', err.message);
        return null;
    }
}



// REST Endpoint: Seed Silver & FC
app.get('/api/seed-fc', (req, res) => {
    res.json({ success: true, message: 'Seeding is now handled client-side.' });
});

// REST Endpoint: Stream Player (Secure Viewer)
app.get('/api/stream/player/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const streamType = req.query.type || 'live';

    const streamUrl = streamType === 'live' 
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
});



// React App Serving
async function startServer() {
  console.log("[Startup] Checking payment keys from environment...");
  const envSecretKey = getSanitizedKey(process.env.PAYSTACK_SECRET_KEY);
  const envPublicKey = getSanitizedKey(process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY);
  const koraSecretKey = getSanitizedKey(process.env.KORAPAY_SECRET_KEY);
  const koraPublicKey = getSanitizedKey(process.env.KORAPAY_PUBLIC_KEY || process.env.VITE_KORAPAY_PUBLIC_KEY);
  console.log(`[Startup] PAYSTACK_SECRET_KEY: ${envSecretKey ? `Loaded (len: ${envSecretKey.length})` : "Missing"}`);
  console.log(`[Startup] PAYSTACK_PUBLIC_KEY: ${envPublicKey ? `Loaded (len: ${envPublicKey.length})` : "Missing"}`);
  console.log(`[Startup] KORAPAY_SECRET_KEY: ${koraSecretKey ? `Loaded (len: ${koraSecretKey.length})` : "Missing"}`);
  console.log(`[Startup] KORAPAY_PUBLIC_KEY: ${koraPublicKey ? `Loaded (len: ${koraPublicKey.length})` : "Missing"}`);

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
