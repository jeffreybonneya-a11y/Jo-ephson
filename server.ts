import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getSeoPageData } from './src/data/seoPages';
import { renderSeoHtml } from './src/lib/serverSeoHtml';
import { processUssdRequest } from './src/server/ussd';
import { normalizeGhanaPhone, getGhanaPhoneVariants, phonesMatch } from './src/lib/phoneUtils';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue, Timestamp as AdminTimestamp, Firestore as AdminFirestore } from 'firebase-admin/firestore';

dotenv.config();

export class FirebaseAdminUnavailableError extends Error {
    public statusCode = 503;
    constructor(message = 'Firebase Admin Firestore is not configured on the server.') {
        super(message);
        this.name = 'FirebaseAdminUnavailableError';
    }
}

// Resolve target Firebase Project ID & named Firestore Database ID
let fbProjectConfig: { projectId: string; firestoreDatabaseId: string } = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0995971216',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-a987bde9-8b24-4701-9f29-ec4c734ab001',
};

try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
        const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        fbProjectConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || fileContent.projectId || fbProjectConfig.projectId,
            firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || fileContent.firestoreDatabaseId || fbProjectConfig.firestoreDatabaseId,
        };
    }
} catch {
    console.warn('[Firebase Admin] Using environment/fallback project configuration');
}

function parseServiceAccountFromEnv(): admin.ServiceAccount | null {
    const rawJson = getSanitizedKey(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (rawJson) {
        try {
            let decoded = rawJson;
            if (!decoded.startsWith('{')) {
                decoded = Buffer.from(decoded, 'base64').toString('utf8').trim();
            }
            const parsed = JSON.parse(decoded);
            if (!parsed || typeof parsed !== 'object' || !parsed.client_email || !parsed.private_key) {
                throw new Error('Service account JSON missing required client_email or private_key');
            }
            if (typeof parsed.private_key === 'string') {
                parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            }
            if (parsed.project_id && fbProjectConfig.projectId && parsed.project_id !== fbProjectConfig.projectId) {
                console.warn(`[Firebase Admin] Warning: Service account project_id (${parsed.project_id}) differs from configured projectId (${fbProjectConfig.projectId}).`);
            }
            return parsed as admin.ServiceAccount;
        } catch (err: any) {
            console.error('[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT configuration:', err?.message || 'parse error');
            return null;
        }
    }

    const clientEmail = getSanitizedKey(process.env.FIREBASE_CLIENT_EMAIL);
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (clientEmail && rawPrivateKey) {
        const privateKey = rawPrivateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
        return {
            projectId: fbProjectConfig.projectId,
            clientEmail,
            privateKey,
        } as admin.ServiceAccount;
    }

    return null;
}

let adminDb: AdminFirestore | null = null;
let firebaseCredentialSource: 'service_account_env' | 'adc' | 'missing_credentials' = 'missing_credentials';

function initializeFirebaseAdminServices() {
    if (!fbProjectConfig.projectId) {
        console.error('[Firebase Admin] Missing FIREBASE_PROJECT_ID.');
        return;
    }

    const serviceAccount = parseServiceAccountFromEnv();
    const gacPath = getSanitizedKey(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const hasGacFile = Boolean(gacPath && fs.existsSync(gacPath));
    const useAdc = hasGacFile || String(process.env.FIREBASE_USE_ADC || '').toLowerCase() === 'true';

    try {
        if (admin.apps.length === 0) {
            const adminOptions: admin.AppOptions = {
                projectId: fbProjectConfig.projectId,
            };

            if (serviceAccount) {
                adminOptions.credential = admin.credential.cert(serviceAccount);
                firebaseCredentialSource = 'service_account_env';
            } else if (useAdc) {
                adminOptions.credential = admin.credential.applicationDefault();
                firebaseCredentialSource = 'adc';
            } else {
                firebaseCredentialSource = 'missing_credentials';
            }

            admin.initializeApp(adminOptions);
        }

        if (firebaseCredentialSource !== 'missing_credentials') {
            const appInstance = admin.app();
            adminDb = fbProjectConfig.firestoreDatabaseId && fbProjectConfig.firestoreDatabaseId !== '(default)'
                ? getAdminFirestore(appInstance, fbProjectConfig.firestoreDatabaseId)
                : getAdminFirestore(appInstance);
            adminDb.settings({ ignoreUndefinedProperties: true });
            console.log(
                `[Firebase Admin] Initialized Admin Firestore (project=${fbProjectConfig.projectId}, database=${fbProjectConfig.firestoreDatabaseId || '(default)'}, source=${firebaseCredentialSource})`
            );
        } else {
            console.warn(
                `[Firebase Admin] Service-account credentials not configured (FIREBASE_SERVICE_ACCOUNT). Protected server Firestore routes will fail safely with HTTP 503 until configured.`
            );
        }
    } catch (err: any) {
        adminDb = null;
        firebaseCredentialSource = 'missing_credentials';
        console.error('[Firebase Admin] Initialization failed:', err?.message || err);
    }
}

initializeFirebaseAdminServices();

function requireAdminDb(): AdminFirestore {
    if (!adminDb) {
        throw new FirebaseAdminUnavailableError();
    }
    return adminDb;
}

function normalizeServerDataForAdmin(data: Record<string, any>): Record<string, any> {
    const cleanData: Record<string, any> = { ...data };
    Object.keys(cleanData).forEach((key) => {
        const val = cleanData[key];
        if (val === undefined) {
            delete cleanData[key];
        } else if (val && typeof val === 'object' && val.__fieldValue === 'serverTimestamp') {
            cleanData[key] = AdminFieldValue.serverTimestamp();
        }
    });
    return cleanData;
}

function isFirebaseCredentialError(err: any): boolean {
    if (!err) return false;
    if (err instanceof FirebaseAdminUnavailableError) return true;
    const msg = String(err?.message || '').toLowerCase();
    return (
        msg.includes('could not load the default credentials') ||
        msg.includes('permission_denied') ||
        msg.includes('unauthenticated') ||
        err?.code === 7 ||
        err?.code === 16
    );
}

function respondWithServerError(res: express.Response, err: any, fallbackMessage: string) {
    if (isFirebaseCredentialError(err)) {
        return res.status(503).json({
            success: false,
            error: 'Server database service is temporarily unavailable. Please try again shortly.'
        });
    }
    return res.status(500).json({
        success: false,
        error: fallbackMessage
    });
}

// Test/runtime extensible Firestore adapter backed exclusively by Firebase Admin SDK
const serverFirestoreOps = {
    getDoc: async (collectionName: string, docId: string): Promise<{ exists: boolean; data: () => any; id: string; ref?: any } | null> => {
        const db = requireAdminDb();
        try {
            const dRef = db.collection(collectionName).doc(docId);
            const snap = await dRef.get();
            return {
                exists: snap.exists,
                data: () => snap.data() || {},
                id: snap.id,
                ref: dRef
            };
        } catch (err: any) {
            console.error(`[Admin Firestore] getDoc error (${collectionName}/${docId}):`, err?.message || err);
            throw err;
        }
    },
    setDoc: async (collectionName: string, docId: string, data: any, merge = true): Promise<boolean> => {
        const db = requireAdminDb();
        try {
            const cleanData = normalizeServerDataForAdmin(data);
            await db.collection(collectionName).doc(docId).set(cleanData, { merge });
            return true;
        } catch (err: any) {
            console.error(`[Admin Firestore] setDoc error (${collectionName}/${docId}):`, err?.message || err);
            throw err;
        }
    },
    updateDoc: async (collectionName: string, docId: string, data: any): Promise<boolean> => {
        const db = requireAdminDb();
        try {
            const cleanData = normalizeServerDataForAdmin(data);
            await db.collection(collectionName).doc(docId).update(cleanData);
            return true;
        } catch (err: any) {
            console.error(`[Admin Firestore] updateDoc error (${collectionName}/${docId}):`, err?.message || err);
            throw err;
        }
    },
    queryByField: async (collectionName: string, fieldName: string, value: string): Promise<{ exists: boolean; data: () => any; id: string } | null> => {
        const db = requireAdminDb();
        try {
            const snap = await db.collection(collectionName).where(fieldName, '==', value).limit(1).get();
            if (!snap.empty) {
                const d = snap.docs[0];
                return { exists: true, data: () => d.data() || {}, id: d.id };
            }
            return null;
        } catch (err: any) {
            console.error(`[Admin Firestore] queryByField error (${collectionName}.${fieldName}):`, err?.message || err);
            throw err;
        }
    },
    queryAllByField: async (collectionName: string, fieldName: string, value: string, maxResults = 150): Promise<Array<{ exists: boolean; data: () => any; id: string }>> => {
        const db = requireAdminDb();
        try {
            const snap = await db.collection(collectionName).where(fieldName, '==', value).limit(maxResults).get();
            return snap.docs.map(d => ({ exists: true, data: () => d.data() || {}, id: d.id }));
        } catch (err: any) {
            console.error(`[Admin Firestore] queryAllByField error (${collectionName}.${fieldName}):`, err?.message || err);
            throw err;
        }
    },
    listCollection: async (collectionName: string, maxResults = 300): Promise<Array<{ exists: boolean; data: () => any; id: string }>> => {
        const db = requireAdminDb();
        try {
            const snap = await db.collection(collectionName).limit(maxResults).get();
            return snap.docs.map(d => ({ exists: true, data: () => d.data() || {}, id: d.id }));
        } catch (err: any) {
            console.error(`[Admin Firestore] listCollection error (${collectionName}):`, err?.message || err);
            throw err;
        }
    },
    generateDocId: (collectionName: string): string => {
        if (adminDb) {
            return adminDb.collection(collectionName).doc().id;
        }
        return `${collectionName.slice(0, 3)}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    },
    incrementField: async (collectionName: string, docId: string, fieldName: string, amount = 1): Promise<void> => {
        const db = requireAdminDb();
        try {
            await db.collection(collectionName).doc(docId).update({
                [fieldName]: AdminFieldValue.increment(amount),
                updatedAt: AdminFieldValue.serverTimestamp()
            });
        } catch (err: any) {
            console.error(`[Admin Firestore] incrementField error (${collectionName}/${docId}.${fieldName}):`, err?.message || err);
            throw err;
        }
    }
};

async function getFirestoreDoc(collectionName: string, docId: string): Promise<{ exists: boolean; data: () => any; id: string; ref?: any } | null> {
    return serverFirestoreOps.getDoc(collectionName, docId);
}

async function setFirestoreDoc(collectionName: string, docId: string, data: any, merge = true): Promise<boolean> {
    return serverFirestoreOps.setDoc(collectionName, docId, data, merge);
}

async function updateFirestoreDoc(collectionName: string, docId: string, data: any): Promise<boolean> {
    return serverFirestoreOps.updateDoc(collectionName, docId, data);
}

const PROTECTED_ORDER_STATUSES = new Set([
    'paid', 'success', 'successful', 'processing', 'accepted', 'delivered', 'completed'
]);
const PROTECTED_PAYMENT_STATUSES = new Set(['success', 'paid']);
const ACTIVE_FULFILLMENT_STATUSES = new Set(['processing', 'accepted', 'delivered', 'completed']);
const PAYSTACK_PENDING_STATUSES = new Set([
    'pending', 'ongoing', 'processing', 'queued', 'pay_offline',
    'send_otp', 'otp', 'send_pin', 'send_phone', 'send_birthday', 'send_address'
]);

function isProtectedPaidOrFulfilledState(orderData: any): boolean {
    if (!orderData) return false;
    const status = String(orderData.status || '').toLowerCase().trim();
    const paymentStatus = String(orderData.paymentStatus || '').toLowerCase().trim();
    const fulfillmentStatus = String(orderData.fulfillmentStatus || '').toLowerCase().trim();
    return (
        PROTECTED_ORDER_STATUSES.has(status) ||
        PROTECTED_PAYMENT_STATUSES.has(paymentStatus) ||
        fulfillmentStatus === 'delivered'
    );
}

async function resolveOrderDocByReference(reference: string): Promise<{ docId: string; snap: any; data: any }> {
    const cleanRef = String(reference || '').trim();
    if (!cleanRef) return { docId: '', snap: null, data: null };

    const directSnap = await getFirestoreDoc('orders', cleanRef);
    if (directSnap && directSnap.exists) {
        return { docId: cleanRef, snap: directSnap, data: directSnap.data() };
    }

    const searchFields = ['paymentReference', 'paystackReference', 'reference', 'orderId'];
    for (const field of searchFields) {
        const match = await serverFirestoreOps.queryByField('orders', field, cleanRef);
        if (match && match.exists) {
            return { docId: match.id, snap: match, data: match.data() };
        }
    }

    return { docId: cleanRef, snap: null, data: null };
}

async function creditReferralIfEligible(orderId: string, orderData: any): Promise<void> {
    try {
        const referralCode = orderData?.referredBy;
        const purchaserUid = orderData?.userId;
        if (!referralCode || !purchaserUid) return;

        const cleanRefCode = String(referralCode).trim().toUpperCase();
        const referrerMatch = await serverFirestoreOps.queryByField('users', 'referralCode', cleanRefCode);
        if (!referrerMatch || !referrerMatch.exists) return;

        const referrerUid = referrerMatch.id;
        if (!referrerUid || referrerUid === purchaserUid) return;

        const referralRecordId = `ref_${referrerUid}_${purchaserUid}`;
        const existingRefRecord = await getFirestoreDoc('referrals', referralRecordId);
        if (existingRefRecord && existingRefRecord.exists) return;

        await setFirestoreDoc('referrals', referralRecordId, {
            id: referralRecordId,
            referrerUid,
            referrerCode: cleanRefCode,
            purchaserUid,
            purchaserEmail: orderData.email || 'Customer',
            purchaserName: orderData.customerName || 'Customer',
            orderId,
            orderAmount: orderData.amount || 0,
            bundle: orderData.bundle || 'Data Bundle',
            status: 'successful',
            rewardEarned: true,
            rewardDelivered: false,
            rewardStatus: 'pending_delivery',
            createdAt: AdminFieldValue.serverTimestamp(),
        }, false);

        await serverFirestoreOps.incrementField('users', referrerUid, 'referralCount', 1);
        console.log(`[Server Referral] Credited referrer ${referrerUid} for ${purchaserUid} on order ${orderId}`);
    } catch (err: any) {
        console.warn(`[Server Referral] Credit check notice for ${orderId}:`, err?.message || err);
    }
}

function timingSafeCompareStrings(a: string, b: string): boolean {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    if (bufA.length === 0 || bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

async function queryActiveBookingCodes(limitCount = 5): Promise<any[]> {
    const db = requireAdminDb();
    try {
        const snap = await db.collection('booking_codes').where('active', '==', true).limit(limitCount).get();
        return snap.docs.map(d => ({ id: d.id, data: () => d.data() || {}, exists: true }));
    } catch (err: any) {
        console.warn('[Admin Firestore] queryActiveBookingCodes notice:', err.message || err);
        const snap = await db.collection('booking_codes').limit(limitCount).get();
        return snap.docs.map(d => ({ id: d.id, data: () => d.data() || {}, exists: true }));
    }
}

async function incrementBookingCodePurchases(docId: string): Promise<void> {
    await serverFirestoreOps.incrementField('booking_codes', docId, 'totalPurchases', 1);
}

// Helper to clean and sanitize API keys loaded from environment variables
function getSanitizedKey(rawKey: string | undefined): string | undefined {
    if (!rawKey) return undefined;
    let key = rawKey.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1).trim();
    }
    return key;
}

// Centralized Helper to retrieve and sanitize Paystack Secret Key safely from server environment variables
function getPaystackSecretKey(): string {
    const key = getSanitizedKey(
        process.env.PAYSTACK_SECRET_KEY || 
        process.env.PAYSTACK_SECRET || 
        process.env.PAYSTACK_SECRET_KEY_LIVE || 
        process.env.PAYSTACK_SECRET_KEY_TEST || 
        process.env.PAYSTACK_KEY ||
        process.env.VITE_PAYSTACK_SECRET_KEY
    ) || "";
    return key;
}

// Centralized Helper to retrieve Paystack Public Key
function getPaystackPublicKey(): string {
    const pubKey = getSanitizedKey(
        process.env.PAYSTACK_PUBLIC_KEY || 
        process.env.VITE_PAYSTACK_PUBLIC_KEY || 
        process.env.PAYSTACK_PUBLIC_KEY_LIVE || 
        process.env.PAYSTACK_PUBLIC_KEY_TEST || 
        process.env.PAYSTACK_PK
    ) || "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
    return pubKey;
}

const ALLOWED_ORIGINS = [
    'https://kingjdeals.site',
    'https://www.kingjdeals.site',
    'https://kingjdeals.onrender.com',
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
];

const app = express();

// Early Express middleware: Permanent 301 WWW to Non-WWW redirect for kingjdeals.site
app.use((req, res, next) => {
    // Only redirect safe idempotent read requests (GET/HEAD) to protect POST/PUT/DELETE webhooks and APIs
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }

    const hostHeader = (req.headers.host || '').trim();
    const forwardedHost = (req.headers['x-forwarded-host'] as string || '').split(',')[0].trim();
    const rawHost = (hostHeader || forwardedHost).split(':')[0].toLowerCase();

    if (rawHost === 'www.kingjdeals.site') {
        // Serve authoritative robots.txt directly with HTTP 200 on www hostname so crawlers avoid multi-hop redirect chains
        if (req.path === '/robots.txt') {
            return next();
        }

        const redirectUrl = `https://kingjdeals.site${req.originalUrl || req.url}`;
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.redirect(301, redirectUrl);
    }
    next();
});

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile app background requests, curl, server-to-server webhooks)
        if (!origin) return callback(null, true);
        
        if (
            ALLOWED_ORIGINS.includes(origin) || 
            origin.endsWith('.run.app') || 
            origin.endsWith('.site') || 
            origin.endsWith('.onrender.com')
        ) {
            return callback(null, true);
        }
        
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature', 'x-order-token', 'Accept']
}));

app.use(express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true }));

// NALO Solutions USSD Status and Diagnostic Endpoint
app.get('/api/ussd', (req, res) => {
    res.json({
        status: "online",
        service: "King J Deals NALO Solutions USSD Gateway",
        endpoint: "/api/ussd",
        method: "POST",
        description: "Live USSD endpoint ready to receive NALO Solutions gateway webhooks",
        format: {
            request: {
                USERID: "string (NALO client user ID or kingjdeals)",
                MSISDN: "string (subscriber mobile number, e.g. 233241234567)",
                USERDATA: "string (input entered or dialed code)",
                MSGTYPE: "boolean (true for initial session, false for continuation)",
                SESSIONID: "string (unique session ID)"
            },
            response: {
                USERID: "string",
                MSISDN: "string",
                MSG: "string (USSD menu text)",
                MSGTYPE: "boolean (true = Continue session [CON], false = End session [END])"
            }
        },
        timestamp: new Date().toISOString()
    });
});

// NALO Solutions USSD Webhook Handler
app.post('/api/ussd', async (req, res) => {
    try {
        // Optional secret verification if NALO_APP_SECRET is set
        const expectedSecret = process.env.NALO_APP_SECRET;
        if (expectedSecret) {
            const tokenHeader = req.headers['x-nalo-token'] || req.headers['authorization'];
            const tokenQuery = req.query.secret || req.query.token;
            const bearerToken = typeof tokenHeader === 'string' && tokenHeader.startsWith('Bearer ')
                ? tokenHeader.slice(7).trim()
                : tokenHeader;

            if (tokenQuery !== expectedSecret && bearerToken !== expectedSecret) {
                console.warn('[NALO USSD] Unauthorized request attempted.');
                return res.status(401).json({ error: 'Unauthorized USSD request' });
            }
        }

        const payload = { ...req.query, ...req.body };
        const response = await processUssdRequest(payload, adminDb, getPaystackSecretKey());

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(response);
    } catch (error: any) {
        console.error('[NALO USSD] Unexpected Error:', error);
        return res.status(200).json({
            USERID: req.body?.USERID || req.body?.userId || process.env.NALO_USER_ID || 'kingjdeals',
            MSISDN: req.body?.MSISDN || req.body?.msisdn || '',
            MSG: 'Service temporarily unavailable. Please try again shortly or contact support on WhatsApp at 0535884851 / 0541557530.',
            MSGTYPE: false
        });
    }
});

// Safe Health and Diagnostic Endpoint
app.get('/api/health', (req, res) => {
    const hasPaystackSecret = Boolean(getPaystackSecretKey());
    const hasPaystackPublic = Boolean(getPaystackPublicKey());
    res.json({ 
        status: "ok", 
        service: "King J Deals Gateway", 
        FIREBASE_ADMIN_CONFIGURED: adminDb ? "YES" : "NO",
        FIREBASE_PROJECT_ID: fbProjectConfig.projectId,
        FIREBASE_DATABASE_ID: fbProjectConfig.firestoreDatabaseId || "(default)",
        PAYSTACK_SECRET_KEY_CONFIGURED: hasPaystackSecret ? "YES" : "NO",
        PAYSTACK_PUBLIC_KEY_CONFIGURED: hasPaystackPublic ? "YES" : "NO",
        timestamp: new Date().toISOString()
    });
});

// Endpoint to retrieve Paystack Public Key dynamically at runtime
app.get('/api/paystack-public-key', (req, res) => {
    const pubKey = getPaystackPublicKey();
    res.json({ publicKey: pubKey });
});

interface VerifiedFastDeliveryResult {
    isFastDelivery: boolean;
    fastDeliveryType: "customer" | "agent";
    fastDeliveryFee: number;
    basePrice: number;
    finalPrice: number;
}

async function verifyFastDeliverySettings(params: {
    requestedFastDelivery: boolean;
    network?: string;
    isAgent: boolean;
    basePrice: number;
}): Promise<VerifiedFastDeliveryResult> {
    const rawNetwork = (params.network || "").trim().toUpperCase();
    const isMTN = rawNetwork === "MTN" || rawNetwork.startsWith("MTN");
    const userType: "customer" | "agent" = params.isAgent ? "agent" : "customer";

    // Strict Non-MTN restriction: only MTN orders can have Fast Delivery
    if (!isMTN || !params.requestedFastDelivery) {
        return {
            isFastDelivery: false,
            fastDeliveryType: userType,
            fastDeliveryFee: 0,
            basePrice: params.basePrice,
            finalPrice: params.basePrice,
        };
    }

    // Fetch database settings from settings/fast_delivery
    let customerEnabled = true;
    let customerFee = 1.50;
    let agentEnabled = true;
    let agentFee = 1.00;

    try {
        const fdSettingSnap = await getFirestoreDoc('settings', 'fast_delivery');
        if (fdSettingSnap && fdSettingSnap.exists) {
            const fdData = fdSettingSnap.data();
            // Customer
            if (fdData?.customerEnabled !== undefined) {
                customerEnabled = Boolean(fdData.customerEnabled);
            }
            if (fdData?.customerFee != null) {
                const parsed = Number(fdData.customerFee);
                if (!isNaN(parsed) && parsed >= 0) customerFee = parsed;
            } else if (fdData?.fee != null) {
                const parsed = Number(fdData.fee);
                if (!isNaN(parsed) && parsed >= 0) customerFee = parsed;
            }

            // Agent
            if (fdData?.agentEnabled !== undefined) {
                agentEnabled = Boolean(fdData.agentEnabled);
            }
            if (fdData?.agentFee != null) {
                const parsed = Number(fdData.agentFee);
                if (!isNaN(parsed) && parsed >= 0) agentFee = parsed;
            }
        }
    } catch (err: any) {
        if (isFirebaseCredentialError(err)) throw err;
        console.warn("[Fast Delivery Verification] settings check warning:", err.message);
    }

    const isEnabledForUser = params.isAgent ? agentEnabled : customerEnabled;
    const configuredFee = params.isAgent ? agentFee : customerFee;

    // If Fast Delivery is disabled for that specific user type, fee must NOT be applied
    if (!isEnabledForUser) {
        return {
            isFastDelivery: false,
            fastDeliveryType: userType,
            fastDeliveryFee: 0,
            basePrice: params.basePrice,
            finalPrice: params.basePrice,
        };
    }

    return {
        isFastDelivery: true,
        fastDeliveryType: userType,
        fastDeliveryFee: configuredFee,
        basePrice: params.basePrice,
        finalPrice: params.basePrice + configuredFee,
    };
}

const ADMIN_EMAILS_LIST = ['kingjdeals@gmail.com', 'jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];

const serverAuthOps = {
    verifyIdToken: async (token: string): Promise<any> => {
        if (admin.apps.length > 0) {
            return admin.auth().verifyIdToken(token);
        }
        return null;
    }
};

async function verifyRequestUser(req: express.Request): Promise<{ uid: string; email: string; emailVerified: boolean; phoneNumber: string } | null> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    try {
        const decoded = await serverAuthOps.verifyIdToken(token);
        if (!decoded || !decoded.uid) return null;
        return {
            uid: String(decoded.uid),
            email: String(decoded.email || '').trim(),
            emailVerified: decoded.email_verified === true,
            phoneNumber: String(decoded.phone_number || '').trim()
        };
    } catch {
        return null;
    }
}

async function verifyAdminAuth(req: express.Request): Promise<boolean> {
    const user = await verifyRequestUser(req);
    if (!user || !user.emailVerified) return false;
    return ADMIN_EMAILS_LIST.includes(user.email.toLowerCase().trim());
}

async function calculateAuthoritativePrice(params: {
    bundleId?: string;
    recipientNetwork: string;
    isFastDelivery: boolean;
    agentId?: string;
}) {
    let basePrice = 0;
    let wholesalePrice = 0;
    let bundleName = "";
    let dataAmount = "";
    let category = "";
    let agentProfit = 0;
    let agentPrice = 0;

    let bundleDoc: any = null;
    if (params.bundleId) {
        const snap = await getFirestoreDoc('bundles', params.bundleId);
        if (snap && snap.exists) {
            bundleDoc = snap.data();
        }
    }

    if (!bundleDoc) {
        const networkBundles = await serverFirestoreOps.queryAllByField('bundles', 'network', params.recipientNetwork, 50);
        const found = networkBundles.find(d => d.id === params.bundleId || (d.data().name && params.bundleId && d.data().name.includes(params.bundleId)));
        if (found) {
            bundleDoc = found.data();
        }
    }

    if (bundleDoc) {
        basePrice = Number(bundleDoc.price) || 0;
        wholesalePrice = Number(bundleDoc.wholesalePrice || bundleDoc.price) || basePrice;
        bundleName = bundleDoc.name || bundleDoc.dataAmount || "";
        dataAmount = bundleDoc.dataAmount || "";
        category = bundleDoc.category || params.recipientNetwork;
    } else {
        bundleName = params.bundleId || params.recipientNetwork;
        basePrice = 0;
    }

    // Check hidden charges from settings/hidden_charges
    let hiddenFee = 0;
    try {
        const hcSnap = await getFirestoreDoc('settings', 'hidden_charges');
        if (hcSnap && hcSnap.exists) {
            const hc = hcSnap.data();
            const net = params.recipientNetwork.toUpperCase();
            if (params.agentId) {
                if (bundleDoc?.wholesaleHiddenFee != null) {
                    hiddenFee = Number(bundleDoc.wholesaleHiddenFee);
                } else if (net === 'MTN') hiddenFee = Number(hc.wholesaleMTNCharge) || 0;
                else if (net === 'TELECEL') hiddenFee = Number(hc.wholesaleTelecelCharge) || 0;
                else if (net === 'AIRTELTIGO' || net === 'AT') hiddenFee = Number(hc.wholesaleAirtelTigoCharge) || 0;
                else if (net.includes('GAME')) hiddenFee = Number(hc.wholesaleGameCharge) || 0;
            } else {
                if (bundleDoc?.retailHiddenFee != null) {
                    hiddenFee = Number(bundleDoc.retailHiddenFee);
                } else if (net === 'MTN') hiddenFee = Number(hc.retailMTNCharge || hc.mtnCharge || hc.mainStoreMTNCharge) || 0;
                else if (net === 'TELECEL') hiddenFee = Number(hc.retailTelecelCharge || hc.telecelCharge || hc.mainStoreTelecelCharge) || 0;
                else if (net === 'AIRTELTIGO' || net === 'AT') hiddenFee = Number(hc.retailAirtelTigoCharge || hc.airteltigoCharge) || 0;
                else if (net.includes('GAME')) hiddenFee = Number(hc.retailGameCharge || hc.gameCharge || hc.mainStoreGameCharge) || 0;
            }
            if (params.agentId && hc.agentStoreCharge) {
                hiddenFee += Number(hc.agentStoreCharge) || 0;
            }
        }
    } catch (e: any) {
        if (isFirebaseCredentialError(e)) throw e;
    }

    // Agent Custom Price check if applicable
    let agentDetails: any = null;
    if (params.agentId) {
        try {
            const agentSnap = await getFirestoreDoc('agents', params.agentId);
            if (agentSnap && agentSnap.exists) {
                agentDetails = agentSnap.data();
                if (agentDetails.prices && params.bundleId && agentDetails.prices[params.bundleId]) {
                    const customP = Number(agentDetails.prices[params.bundleId]);
                    if (!isNaN(customP) && customP >= wholesalePrice) {
                        basePrice = customP;
                    }
                }
            }
        } catch (e: any) {
            if (isFirebaseCredentialError(e)) throw e;
        }
        agentPrice = basePrice;
        agentProfit = Math.max(0, agentPrice - wholesalePrice);
    }

    // Fast Delivery calculation
    const isAgent = Boolean(params.agentId);
    const fdResult = await verifyFastDeliverySettings({
        requestedFastDelivery: params.isFastDelivery,
        network: params.recipientNetwork,
        isAgent: isAgent,
        basePrice: basePrice
    });

    const finalAmount = Math.round((fdResult.finalPrice + hiddenFee) * 100) / 100;

    return {
        bundleDoc,
        basePrice: fdResult.basePrice,
        fastDelivery: fdResult.isFastDelivery,
        fastDeliveryFee: fdResult.fastDeliveryFee,
        fastDeliveryType: fdResult.fastDeliveryType,
        hiddenFee,
        finalAmount,
        wholesalePrice,
        agentPrice,
        agentProfit,
        agentDetails,
        bundleName,
        dataAmount,
        category
    };
}

// REST Endpoint: Secure Backend Order Creation with Authoritative Pricing
app.post('/api/orders/create', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        const {
            bundleId,
            recipientPhone,
            recipientNetwork,
            paymentMethod = 'paystack',
            fastDelivery = false,
            fcUserId,
            fcUsername,
            referredBy,
            agentId,
            customerEmail: providedEmail,
            customerName: providedName
        } = req.body;

        if (!recipientNetwork) {
            return res.status(400).json({ success: false, error: 'recipientNetwork is required' });
        }

        const cleanPhone = (recipientPhone || '').replace(/[^0-9]/g, '').trim();
        const isGame = recipientNetwork.includes('FC Mobile') || recipientNetwork.includes('PUBG') || recipientNetwork === 'PC Games';
        
        if (!isGame && (!cleanPhone || !/^0[0-9]{9}$/.test(cleanPhone))) {
            return res.status(400).json({
                success: false,
                error: 'Phone must start with 0 and be 10 digits total (e.g., 05XXXXXXXX)'
            });
        }

        const pricing = await calculateAuthoritativePrice({
            bundleId,
            recipientNetwork,
            isFastDelivery: Boolean(fastDelivery),
            agentId
        });

        const generatedRef = 'DGN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const orderAccessToken = crypto.randomBytes(32).toString('hex');
        const orderId = serverFirestoreOps.generateDocId('orders');

        const customerEmail = (providedEmail && providedEmail.includes('@')) 
            ? providedEmail 
            : (authUser?.email || (cleanPhone ? `${cleanPhone}@gmail.com` : "customer@gmail.com"));
        const customerName = providedName || (cleanPhone ? `Customer (${cleanPhone})` : "Customer");
        const customerUid = authUser
            ? authUser.uid
            : (cleanPhone ? `guest_${cleanPhone}` : `guest_${Date.now()}`);

        const normalizedPaymentMethod = String(paymentMethod || 'paystack').trim();
        const initialStatus = normalizedPaymentMethod === 'momo_direct' ? 'pending_verification' : 'pending';

        const orderData: any = {
            id: orderId,
            reference: orderId,
            paymentReference: generatedRef,
            orderAccessToken: orderAccessToken,
            email: customerEmail,
            phone: cleanPhone || "",
            network: recipientNetwork,
            bundle: pricing.bundleName ? `${recipientNetwork} ${pricing.bundleName}` : `${recipientNetwork} Bundle`,
            bundleId: bundleId || "",
            amount: pricing.finalAmount,
            basePrice: pricing.basePrice,
            hiddenFee: pricing.hiddenFee,
            finalPrice: pricing.finalAmount,
            fastDelivery: pricing.fastDelivery,
            fastDeliveryFee: pricing.fastDeliveryFee,
            ...(pricing.fastDelivery ? { fastDeliveryType: pricing.fastDeliveryType } : {}),
            status: initialStatus,
            paymentStatus: initialStatus,
            paymentMethod: normalizedPaymentMethod,
            userId: customerUid,
            customerName: customerName,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
            ...(referredBy ? { referredBy: String(referredBy).trim().toUpperCase() } : {}),
            ...(fcUserId ? { fcUserId } : {}),
            ...(fcUsername ? { fcUsername } : {}),
        };

        if (pricing.agentDetails) {
            orderData.isAgentOrder = true;
            orderData.agentId = pricing.agentDetails.id || agentId;
            orderData.agent_id = pricing.agentDetails.id || agentId;
            orderData.agentName = pricing.agentDetails.agent_name || "Agent";
            orderData.agent_name = pricing.agentDetails.agent_name || "Agent";
            orderData.wholesalePrice = pricing.wholesalePrice;
            orderData.wholesale_price = pricing.wholesalePrice;
            orderData.agentPrice = pricing.agentPrice;
            orderData.agent_price = pricing.agentPrice;
            orderData.profit = pricing.agentProfit;
            orderData.agent_profit = pricing.agentProfit;
            orderData.profitAwarded = false;
            orderData.profit_credited = false;
        }

        await setFirestoreDoc('orders', orderId, orderData, false);

        if (pricing.agentDetails) {
            const agentOrderData = {
                id: orderId,
                agent_id: pricing.agentDetails.id || agentId,
                customer_details: {
                    name: customerName,
                    email: customerEmail,
                    phone: cleanPhone,
                    network: recipientNetwork
                },
                wholesale_price: pricing.wholesalePrice,
                agent_price: pricing.agentPrice,
                profit: pricing.agentProfit,
                fastDelivery: pricing.fastDelivery,
                fastDeliveryFee: pricing.fastDeliveryFee,
                ...(pricing.fastDelivery ? { fastDeliveryType: pricing.fastDeliveryType } : {}),
                basePrice: pricing.basePrice,
                finalPrice: pricing.finalAmount,
                status: initialStatus,
                paymentStatus: initialStatus,
                created_at: AdminFieldValue.serverTimestamp(),
                paymentReference: orderId
            };
            await setFirestoreDoc('agent_orders', orderId, agentOrderData, false);
        }

        return res.status(200).json({
            success: true,
            orderId,
            orderAccessToken,
            reference: orderId,
            paymentReference: generatedRef,
            amount: pricing.finalAmount,
            customerEmail,
            customerPhone: cleanPhone,
            network: recipientNetwork,
            bundle: orderData.bundle
        });
    } catch (err: any) {
        console.error('[Create Order Error]:', err.message || err);
        if (isFirebaseCredentialError(err)) {
            return respondWithServerError(res, err, 'Failed to create order');
        }
        return res.status(400).json({ success: false, error: err.message || 'Failed to create order' });
    }
});

// REST Endpoint: Token-Protected Order Status Retrieval
app.get('/api/orders/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const token = (req.query.token as string) || (req.headers['x-order-token'] as string);
        
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'orderId is required' });
        }

        const orderSnap = await getFirestoreDoc('orders', orderId);
        if (!orderSnap || !orderSnap.exists) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const data = orderSnap.data();

        // Validate token, authenticated owner, or verified admin
        const isAuthorizedByToken = Boolean(token && data.orderAccessToken && token === data.orderAccessToken);
        const authUser = !isAuthorizedByToken ? await verifyRequestUser(req) : null;
        const isAuthorizedOwner = Boolean(
            authUser && (
                data.userId === authUser.uid ||
                (authUser.email && data.email && String(data.email).toLowerCase().trim() === authUser.email.toLowerCase().trim())
            )
        );
        const isAuthorizedAdmin = Boolean(
            authUser && authUser.emailVerified && ADMIN_EMAILS_LIST.includes(authUser.email.toLowerCase().trim())
        );

        if (!isAuthorizedByToken && !isAuthorizedOwner && !isAuthorizedAdmin) {
            return res.status(403).json({ success: false, error: 'Unauthorized to view this order status' });
        }

        return res.json({
            success: true,
            orderId,
            status: data.status,
            paymentStatus: data.paymentStatus,
            amount: data.amount,
            network: data.network,
            bundle: data.bundle,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    } catch (err: any) {
        console.error('[Order Status Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to retrieve order status');
    }
});

// ============================================================================
// HISTORY & SUPPORT INFRASTRUCTURE (Rate Limiting, Sanitization, Validation)
// ============================================================================

const rateLimitBuckets = new Map<string, number[]>();

function checkRateLimit(bucketKey: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const existing = rateLimitBuckets.get(bucketKey) || [];
    const recent = existing.filter((ts) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
        const oldest = recent[0] || now;
        const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        rateLimitBuckets.set(bucketKey, recent);
        return { allowed: false, retryAfterSec };
    }
    recent.push(now);
    rateLimitBuckets.set(bucketKey, recent);
    // Keep map bounded
    if (rateLimitBuckets.size > 5000) {
        for (const [k, list] of rateLimitBuckets.entries()) {
            const active = list.filter((ts) => now - ts < windowMs);
            if (active.length === 0) rateLimitBuckets.delete(k);
        }
    }
    return { allowed: true, retryAfterSec: 0 };
}

function resetRateLimits() {
    rateLimitBuckets.clear();
}

function getClientIpKey(req: express.Request): string {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
        return xff.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

function extractTimestampMs(ts: any): number {
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts?.toMillis === 'function') return ts.toMillis();
    if (typeof ts?.seconds === 'number') return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
    if (typeof ts === 'string') {
        const parsed = Date.parse(ts);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function deriveSeparatedOrderStatuses(data: any): {
    paymentStatus: string;
    paymentStatusLabel: string;
    fulfillmentStatus: string;
    fulfillmentStatusLabel: string;
} {
    const rawPay = String(data.paymentStatus || '').toLowerCase().trim();
    const rawStatus = String(data.status || '').toLowerCase().trim();
    const rawFulfill = String(data.fulfillmentStatus || data.adminStatus || '').toLowerCase().trim();

    // 1. Payment Status (never conflates paid with delivered)
    let paymentStatus = 'pending';
    let paymentStatusLabel = 'Pending';

    if (rawPay === 'success' || rawPay === 'paid' || rawPay === 'successful' || rawStatus === 'paid' || rawStatus === 'success') {
        paymentStatus = 'success';
        paymentStatusLabel = 'Paid / Successful';
    } else if (rawPay === 'failed' || rawPay === 'abandoned' || (rawStatus === 'failed' && !rawPay)) {
        paymentStatus = 'failed';
        paymentStatusLabel = 'Failed';
    } else if (rawPay === 'declined' || (rawStatus === 'declined' && !rawPay)) {
        paymentStatus = 'declined';
        paymentStatusLabel = 'Declined';
    } else if (rawPay === 'cancelled' || (rawStatus === 'cancelled' && (!rawPay || rawPay === 'payment_pending' || rawPay === 'pending'))) {
        paymentStatus = 'cancelled';
        paymentStatusLabel = 'Cancelled';
    } else if (rawStatus === 'pending_verification' || rawPay === 'pending_verification') {
        paymentStatus = 'pending_verification';
        paymentStatusLabel = 'Pending Verification';
    } else if (rawStatus === 'unpaid' || rawPay === 'unpaid') {
        paymentStatus = 'unpaid';
        paymentStatusLabel = 'Unpaid';
    }

    // 2. Fulfillment Status (separate from payment; paid alone stays Pending until processed/delivered)
    let fulfillmentStatus = 'pending';
    let fulfillmentStatusLabel = 'Pending';

    if (rawFulfill === 'delivered' || rawFulfill === 'completed' || rawStatus === 'delivered' || rawStatus === 'completed') {
        fulfillmentStatus = 'delivered';
        fulfillmentStatusLabel = 'Delivered';
    } else if (rawFulfill === 'processing' || rawFulfill === 'accepted' || rawStatus === 'processing' || rawStatus === 'accepted') {
        fulfillmentStatus = 'processing';
        fulfillmentStatusLabel = 'Processing';
    } else if (rawFulfill === 'declined' || rawStatus === 'declined') {
        fulfillmentStatus = 'declined';
        fulfillmentStatusLabel = 'Declined';
    } else if (rawFulfill === 'cancelled' || rawFulfill === 'refunded' || rawStatus === 'cancelled') {
        fulfillmentStatus = 'cancelled';
        fulfillmentStatusLabel = rawFulfill === 'refunded' ? 'Refunded' : 'Cancelled';
    } else if (rawFulfill === 'failed' || rawStatus === 'failed') {
        fulfillmentStatus = 'failed';
        fulfillmentStatusLabel = 'Failed';
    } else {
        fulfillmentStatus = 'pending';
        fulfillmentStatusLabel = 'Pending';
    }

    return {
        paymentStatus,
        paymentStatusLabel,
        fulfillmentStatus,
        fulfillmentStatusLabel,
    };
}

function sanitizeOrderForCustomerHistory(id: string, data: any) {
    const createdAtMs = extractTimestampMs(data.createdAt);
    const updatedAtMs = extractTimestampMs(data.updatedAt) || createdAtMs;
    const statuses = deriveSeparatedOrderStatuses(data);
    const phone = String(data.phone || data.recipientPhone || data.customerPhone || '').trim();
    const paymentMethodRaw = String(data.paymentMethod || data.payment_provider || '').trim();

    return {
        id,
        reference: String(data.referenceCode || data.orderId || data.reference || id),
        paymentReference: String(data.paymentReference || data.paystackReference || data.momoRefCode || ''),
        productName: String(data.bundle || data.bundleName || data.productName || data.title || data.network || 'Order'),
        network: String(data.network || data.recipientNetwork || data.category || ''),
        serviceType: String(data.serviceType || data.category || data.type || ''),
        amount: Number(data.amount ?? data.finalPrice ?? data.amountSent ?? data.price ?? 0),
        basePrice: data.basePrice != null ? Number(data.basePrice) : undefined,
        fastDelivery: Boolean(data.fastDelivery),
        fastDeliveryFee: data.fastDeliveryFee != null ? Number(data.fastDeliveryFee) : undefined,
        fastDeliveryType: data.fastDeliveryType || undefined,
        phone,
        status: String(data.status || 'pending'),
        paymentStatus: statuses.paymentStatus,
        paymentStatusLabel: statuses.paymentStatusLabel,
        fulfillmentStatus: statuses.fulfillmentStatus,
        fulfillmentStatusLabel: statuses.fulfillmentStatusLabel,
        paymentMethod: paymentMethodRaw,
        ...(data.fcUserId ? { fcUserId: String(data.fcUserId) } : {}),
        ...(data.fcUsername ? { fcUsername: String(data.fcUsername) } : {}),
        ...(data.accountIdentifier ? { accountIdentifier: String(data.accountIdentifier) } : {}),
        ...(data.accountIdentifierType ? { accountIdentifierType: String(data.accountIdentifierType) } : {}),
        ...(data.konamiId ? { konamiId: String(data.konamiId) } : {}),
        ...(data.platform ? { platform: String(data.platform) } : {}),
        ...(data.coinAmount != null ? { coinAmount: Number(data.coinAmount) } : {}),
        ...(data.voucherCode ? { voucherCode: String(data.voucherCode) } : {}),
        ...(data.pin ? { pin: String(data.pin) } : {}),
        ...(data.serialNumber || data.serial ? { serialNumber: String(data.serialNumber || data.serial) } : {}),
        ...(data.deliveryNote || data.deliveryNotes ? { deliveryNote: String(data.deliveryNote || data.deliveryNotes) } : {}),
        ...(data.cancellationReason ? { cancellationReason: String(data.cancellationReason) } : {}),
        createdAtMs,
        createdAtIso: createdAtMs > 0 ? new Date(createdAtMs).toISOString() : null,
        updatedAtIso: updatedAtMs > 0 ? new Date(updatedAtMs).toISOString() : null,
    };
}

function rankSanitizedOrder(o: any): number {
    let score = 0;
    if (o.fulfillmentStatus === 'delivered') score += 1000;
    else if (o.fulfillmentStatus === 'processing') score += 700;
    else if (o.paymentStatus === 'success') score += 500;
    else if (o.fulfillmentStatus === 'declined' || o.fulfillmentStatus === 'cancelled' || o.fulfillmentStatus === 'failed') score += 200;
    else score += 100;
    if (o.deliveryNote) score += 20;
    if (o.voucherCode || o.pin) score += 20;
    return score;
}

function dedupeAndSortHistoryOrders(items: any[]) {
    const byId = new Map<string, any>();
    for (const item of items) {
        if (!item?.id) continue;
        const existing = byId.get(item.id);
        if (!existing || rankSanitizedOrder(item) > rankSanitizedOrder(existing)) {
            byId.set(item.id, item);
        }
    }

    const byPaymentRef = new Map<string, any>();
    const results: any[] = [];
    for (const item of byId.values()) {
        const payRef = String(item.paymentReference || '').trim();
        const isUniqueRef = payRef.length >= 12 && !/^\d{9,13}$/.test(payRef);
        if (isUniqueRef) {
            const existing = byPaymentRef.get(payRef);
            if (!existing) {
                byPaymentRef.set(payRef, item);
                results.push(item);
            } else if (rankSanitizedOrder(item) > rankSanitizedOrder(existing)) {
                const idx = results.indexOf(existing);
                if (idx !== -1) results[idx] = item;
                byPaymentRef.set(payRef, item);
            }
        } else {
            results.push(item);
        }
    }

    results.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return results;
}

async function queryOrdersByPhoneVariants(canonicalPhone: string): Promise<Array<{ id: string; data: any }>> {
    const variants = getGhanaPhoneVariants(canonicalPhone);
    const collections = ['orders', 'efootballOrders'];
    const phoneFields = ['phone', 'customerPhone', 'recipientPhone'];
    const docs: Array<{ id: string; data: any }> = [];

    for (const col of collections) {
        for (const variant of variants) {
            for (const field of phoneFields) {
                const matched = await serverFirestoreOps.queryAllByField(col, field, variant, 150);
                for (const d of matched) {
                    docs.push({ id: d.id, data: d.data() });
                }
            }
        }
        const guestMatched = await serverFirestoreOps.queryAllByField(col, 'userId', `guest_${canonicalPhone}`, 150);
        for (const d of guestMatched) {
            docs.push({ id: d.id, data: d.data() });
        }
    }

    // Strict ownership verification: only keep docs whose phone strictly matches canonicalPhone
    return docs.filter(({ data }) => {
        const candidatePhones = [data.phone, data.customerPhone, data.recipientPhone];
        return candidatePhones.some((p) => phonesMatch(p, canonicalPhone));
    });
}

// REST Endpoint: Guest Order Tracking by Validated Ghanaian Phone Number
app.post('/api/orders/track-guest', async (req, res) => {
    try {
        const clientIp = getClientIpKey(req);
        const ipLimit = checkRateLimit(`track_guest_ip:${clientIp}`, 25, 5 * 60 * 1000);
        if (!ipLimit.allowed) {
            res.setHeader('Retry-After', String(ipLimit.retryAfterSec));
            return res.status(429).json({
                success: false,
                error: 'Too many order lookup requests. Please wait a few minutes and try again.'
            });
        }

        const rawPhone = req.body?.phone;
        const canonicalPhone = normalizeGhanaPhone(rawPhone);
        if (!canonicalPhone) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid Ghanaian phone number (e.g. 0241234567 or +233241234567).'
            });
        }

        const phoneLimit = checkRateLimit(`track_guest_phone:${canonicalPhone}`, 15, 5 * 60 * 1000);
        if (!phoneLimit.allowed) {
            res.setHeader('Retry-After', String(phoneLimit.retryAfterSec));
            return res.status(429).json({
                success: false,
                error: 'Too many lookups for this phone number. Please wait a few minutes before trying again.'
            });
        }

        const matchedDocs = await queryOrdersByPhoneVariants(canonicalPhone);
        const sanitized = matchedDocs.map(({ id, data }) => sanitizeOrderForCustomerHistory(id, data));
        const orders = dedupeAndSortHistoryOrders(sanitized);

        return res.status(200).json({
            success: true,
            phone: canonicalPhone,
            orders
        });
    } catch (err: any) {
        console.error('[Track Guest Orders Error]:', err.message || err);
        return respondWithServerError(res, err, 'Unable to retrieve order history right now. Please try again shortly.');
    }
});

// REST Endpoint: Authenticated Customer Synchronized Order History
app.get('/api/orders/my-history', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required to synchronize account orders.'
            });
        }

        const { uid, email: rawEmail, phoneNumber: tokenPhoneRaw } = authUser;
        const verifiedEmailLower = rawEmail.toLowerCase().trim();

        const userSnap = await serverFirestoreOps.getDoc('users', uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const verifiedAccountPhone =
            normalizeGhanaPhone(tokenPhoneRaw) ||
            normalizeGhanaPhone(userData?.phoneNumber) ||
            normalizeGhanaPhone(userData?.phone);

        const rawDocs: Array<{ id: string; data: any }> = [];

        // 1. Query by authenticated uid across orders & efootballOrders
        for (const col of ['orders', 'efootballOrders']) {
            const byUid = await serverFirestoreOps.queryAllByField(col, 'userId', uid, 200);
            byUid.forEach((d) => rawDocs.push({ id: d.id, data: d.data() }));
            if (col === 'efootballOrders') {
                const byCustId = await serverFirestoreOps.queryAllByField(col, 'customerId', uid, 200);
                byCustId.forEach((d) => rawDocs.push({ id: d.id, data: d.data() }));
            }
        }

        // 2. Query by verified email across email / customerEmail / userEmail (covering guest orders placed with same email)
        if (verifiedEmailLower) {
            const emailVariants = Array.from(new Set([rawEmail.trim(), verifiedEmailLower].filter(Boolean)));
            for (const col of ['orders', 'efootballOrders']) {
                for (const emailVal of emailVariants) {
                    for (const field of ['email', 'customerEmail', 'userEmail']) {
                        const matched = await serverFirestoreOps.queryAllByField(col, field, emailVal, 150);
                        matched.forEach((d) => rawDocs.push({ id: d.id, data: d.data() }));
                    }
                }
            }
        }

        // 3. Query by verified phone linked to this user's own account (syncs pre-login guest orders for same phone)
        if (verifiedAccountPhone) {
            const phoneMatched = await queryOrdersByPhoneVariants(verifiedAccountPhone);
            rawDocs.push(...phoneMatched);
        }

        // Strict ownership check on every returned document
        const authorizedDocs = rawDocs.filter(({ data }) => {
            if (data.userId === uid || data.customerId === uid) return true;
            if (verifiedEmailLower) {
                const docEmails = [data.email, data.customerEmail, data.userEmail, data.customerDetails?.email]
                    .map((v) => String(v || '').toLowerCase().trim())
                    .filter(Boolean);
                if (docEmails.includes(verifiedEmailLower)) return true;
            }
            if (verifiedAccountPhone) {
                const docPhones = [data.phone, data.customerPhone, data.recipientPhone];
                if (docPhones.some((p) => phonesMatch(p, verifiedAccountPhone))) return true;
            }
            return false;
        });

        const sanitized = authorizedDocs.map(({ id, data }) => sanitizeOrderForCustomerHistory(id, data));
        const orders = dedupeAndSortHistoryOrders(sanitized);

        return res.status(200).json({
            success: true,
            orders,
            profilePhone: verifiedAccountPhone || ''
        });
    } catch (err: any) {
        console.error('[My History Sync Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to synchronize account order history.');
    }
});

const SUPPORT_CATEGORY_MAP = new Map<string, string>([
    ['payment problem', 'Payment problem'],
    ['order not received', 'Order not received'],
    ['delayed delivery', 'Delayed delivery'],
    ['wrong data bundle or service', 'Wrong data bundle or service'],
    ['incorrect order', 'Incorrect order'],
    ['account problem', 'Account problem'],
    ['other enquiry', 'Other enquiry'],
]);

// REST Endpoint: Submit Support Ticket (Guest & Authenticated Customers)
app.post('/api/support/tickets', async (req, res) => {
    try {
        const clientIp = getClientIpKey(req);
        const ipLimit = checkRateLimit(`support_ticket_ip:${clientIp}`, 12, 10 * 60 * 1000);
        if (!ipLimit.allowed) {
            res.setHeader('Retry-After', String(ipLimit.retryAfterSec));
            return res.status(429).json({
                success: false,
                error: 'Too many support requests submitted recently. Please wait a few minutes and try again.'
            });
        }

        const authUser = await verifyRequestUser(req);
        let profileData: any = {};
        if (authUser) {
            const userSnap = await serverFirestoreOps.getDoc('users', authUser.uid);
            if (userSnap && userSnap.exists) {
                profileData = userSnap.data() || {};
            }
        }

        const rawCategory = String(req.body?.category || '').trim().toLowerCase();
        const canonicalCategory = SUPPORT_CATEGORY_MAP.get(rawCategory);
        if (!canonicalCategory) {
            return res.status(400).json({
                success: false,
                field: 'category',
                error: 'Please select a valid complaint category.'
            });
        }

        // Compulsory Ghanaian Phone Number (from submission or verified account phone)
        const submittedPhone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
        const accountPhone = authUser
            ? (normalizeGhanaPhone(authUser.phoneNumber) || normalizeGhanaPhone(profileData.phoneNumber) || normalizeGhanaPhone(profileData.phone) || '')
            : '';
        const candidatePhone = submittedPhone || accountPhone;
        const canonicalPhone = normalizeGhanaPhone(candidatePhone);

        if (!canonicalPhone) {
            return res.status(400).json({
                success: false,
                field: 'phone',
                error: 'A valid Ghanaian phone number (matching your purchase number) is required.'
            });
        }

        // Email stored separately in its own field (NEVER merged or defaulted with phone)
        const submittedEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
        const cleanEmail = submittedEmail || (authUser?.email ? authUser.email.trim() : '');
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                field: 'email',
                error: 'Please enter a valid email address or leave it blank.'
            });
        }

        const cleanMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        if (cleanMessage.length < 10) {
            return res.status(400).json({
                success: false,
                field: 'message',
                error: 'Please describe your issue in at least 10 characters.'
            });
        }
        if (cleanMessage.length > 2000) {
            return res.status(400).json({
                success: false,
                field: 'message',
                error: 'Message is too long (maximum 2000 characters).'
            });
        }

        const cleanOrderRef = typeof req.body?.orderRef === 'string' ? req.body.orderRef.trim().slice(0, 80) : '';
        const cleanCustomerName = typeof req.body?.customerName === 'string'
            ? req.body.customerName.trim().slice(0, 80)
            : (profileData.fullName || profileData.displayName || (authUser ? 'Registered Customer' : `Guest (${canonicalPhone})`));

        const rawIdempKey = typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey.trim().slice(0, 100) : '';
        const deterministicId = rawIdempKey
            ? `tkt_${crypto.createHash('sha256').update(rawIdempKey).digest('hex').slice(0, 20)}`
            : serverFirestoreOps.generateDocId('complaints');

        if (rawIdempKey) {
            const existingById = await serverFirestoreOps.getDoc('complaints', deterministicId);
            const existingByField = existingById && existingById.exists
                ? existingById
                : await serverFirestoreOps.queryByField('complaints', 'idempotencyKey', rawIdempKey);
            if (existingByField && existingByField.exists) {
                const exData = existingByField.data();
                return res.status(200).json({
                    success: true,
                    deduplicated: true,
                    ticketId: existingByField.id,
                    ticketRef: exData.ticketRef || existingByField.id,
                    ticket: {
                        id: existingByField.id,
                        ticketRef: exData.ticketRef || existingByField.id,
                        category: exData.category,
                        phone: exData.phone,
                        email: exData.email || '',
                        orderRef: exData.orderRef || '',
                        status: exData.status || 'open',
                    }
                });
            }
        }

        const ticketRef = rawIdempKey
            ? `TKT-${crypto.createHash('sha256').update(rawIdempKey).digest('hex').slice(0, 6).toUpperCase()}`
            : `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const subjectLine = `[${canonicalCategory}]${cleanOrderRef ? ` (${cleanOrderRef})` : ''}`;

        const complaintDoc: any = {
            id: deterministicId,
            ticketRef,
            userId: authUser ? authUser.uid : `guest_${canonicalPhone}`,
            isGuest: !authUser,
            userName: cleanCustomerName,
            phone: canonicalPhone,
            userPhone: canonicalPhone,
            email: cleanEmail,
            userEmail: cleanEmail,
            category: canonicalCategory,
            subject: subjectLine,
            orderRef: cleanOrderRef,
            orderId: cleanOrderRef,
            message: cleanMessage,
            status: 'open',
            ...(rawIdempKey ? { idempotencyKey: rawIdempKey } : {}),
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        const saved = await serverFirestoreOps.setDoc('complaints', deterministicId, complaintDoc, false);
        if (!saved) {
            return res.status(500).json({
                success: false,
                error: 'Could not save your support ticket right now. Please try again.'
            });
        }

        return res.status(201).json({
            success: true,
            ticketId: deterministicId,
            ticketRef,
            ticket: {
                id: deterministicId,
                ticketRef,
                category: canonicalCategory,
                phone: canonicalPhone,
                email: cleanEmail,
                orderRef: cleanOrderRef,
                message: cleanMessage,
                status: 'open',
                isGuest: !authUser,
                createdAtIso: new Date().toISOString()
            }
        });
    } catch (err: any) {
        console.error('[Support Ticket Error]:', err.message || err);
        return respondWithServerError(res, err, 'An unexpected error occurred while submitting your support ticket.');
    }
});

// REST Endpoint: Admin Support Tickets List (Strict Admin Authorization)
app.get('/api/admin/support/tickets', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        if (!authUser.emailVerified || !ADMIN_EMAILS_LIST.includes(authUser.email.toLowerCase().trim())) {
            return res.status(403).json({ success: false, error: 'Admin authorization required' });
        }

        const docs = await serverFirestoreOps.listCollection('complaints', 300);
        const tickets = docs
            .map((d) => {
                const data = d.data();
                const createdAtMs = extractTimestampMs(data.createdAt);
                return {
                    id: d.id,
                    ticketRef: data.ticketRef || `TKT-${d.id.slice(-6).toUpperCase()}`,
                    phone: data.phone || data.userPhone || '',
                    email: data.email || data.userEmail || '',
                    userName: data.userName || 'Customer',
                    userId: data.userId || '',
                    isGuest: Boolean(data.isGuest),
                    category: data.category || 'General Support',
                    subject: data.subject || '',
                    orderRef: data.orderRef || data.orderId || '',
                    message: data.message || '',
                    status: data.status || 'open',
                    adminReply: data.adminReply || '',
                    createdAtMs,
                    createdAtIso: createdAtMs > 0 ? new Date(createdAtMs).toISOString() : null
                };
            })
            .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

        return res.status(200).json({ success: true, tickets });
    } catch (err: any) {
        console.error('[Admin Support List Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to retrieve support tickets');
    }
});

// REST Endpoint: Admin Update Support Ticket Status (Strict Admin Authorization)
app.patch('/api/admin/support/tickets/:ticketId', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        if (!authUser.emailVerified || !ADMIN_EMAILS_LIST.includes(authUser.email.toLowerCase().trim())) {
            return res.status(403).json({ success: false, error: 'Admin authorization required' });
        }

        const { ticketId } = req.params;
        const status = String(req.body?.status || '').toLowerCase().trim();
        if (!['open', 'in_progress', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid ticket status' });
        }

        const existing = await serverFirestoreOps.getDoc('complaints', ticketId);
        if (!existing || !existing.exists) {
            return res.status(404).json({ success: false, error: 'Support ticket not found' });
        }

        const updates: any = {
            status,
            updatedAt: AdminFieldValue.serverTimestamp(),
            ...(status === 'resolved' ? { resolvedAt: AdminFieldValue.serverTimestamp(), resolvedBy: authUser.email } : {})
        };
        if (typeof req.body?.adminReply === 'string') {
            updates.adminReply = req.body.adminReply.trim().slice(0, 1000);
        }

        const ok = await serverFirestoreOps.updateDoc('complaints', ticketId, updates);
        if (!ok) {
            return res.status(500).json({ success: false, error: 'Failed to update support ticket' });
        }

        return res.status(200).json({
            success: true,
            id: ticketId,
            status
        });
    } catch (err: any) {
        console.error('[Admin Support Update Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to update support ticket');
    }
});

// REST Endpoint: Sanitized Public Agent Storefront Lookup
app.get('/api/agent-store/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ success: false, error: 'slug is required' });
        }

        let matched = await serverFirestoreOps.queryByField('agents', 'agent_slug', slug.toLowerCase().trim());
        if (!matched || !matched.exists) {
            matched = await serverFirestoreOps.queryByField('agents', 'agent_slug', slug.trim());
        }

        if (!matched || !matched.exists) {
            return res.status(404).json({ success: false, error: 'Agent storefront not found' });
        }

        const docData = matched.data();
        // Strict data sanitization: strictly NO momo_number, momo_name, or profit_balance returned
        return res.json({
            success: true,
            agent: {
                id: matched.id,
                agent_name: docData.agent_name,
                agent_slug: docData.agent_slug,
                prices: docData.prices || {}
            }
        });
    } catch (err: any) {
        console.error('[Agent Store Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to fetch agent store');
    }
});

// Endpoint to initialize a Paystack transaction and get a direct redirect URL
async function handlePaystackInitialize(req: express.Request, res: express.Response) {
    try {
        const { email, amount, reference, callback_url, currency, bookingCodeId, userId, customerName, customerPhone, metadata } = req.body;
        if (!email || !reference || !callback_url) {
            return res.status(400).json({ success: false, error: 'Email, reference, and callback_url are required' });
        }

        let finalAmountPesewas = amount ? Math.round(Number(amount)) : 0;
        let bookingCodeDoc: any = null;

        const authUser = await verifyRequestUser(req);
        const effectiveUserId = authUser?.uid || userId || "";

        // If this is a booking code purchase, verify booking code from Firestore securely
        if (bookingCodeId) {
            try {
                let bcSnap = await getFirestoreDoc('booking_codes', bookingCodeId);
                if (!bcSnap || !bcSnap.exists) {
                    const activeCodes = await queryActiveBookingCodes(10);
                    if (activeCodes.length > 0) {
                        bcSnap = activeCodes.find((c: any) => c.id === bookingCodeId) || activeCodes[0];
                    }
                }
                
                if (bcSnap && bcSnap.exists) {
                    bookingCodeDoc = bcSnap.data();
                    if (bookingCodeDoc?.active !== false) {
                        const authoritativePriceGHS = Number(bookingCodeDoc.price) || (amount ? Number(amount) / 100 : 20);
                        finalAmountPesewas = Math.round(authoritativePriceGHS * 100);
                    }
                } else if (amount) {
                    finalAmountPesewas = Math.round(Number(amount));
                }

                const bookingTitle = bookingCodeDoc?.title || "VIP Booking Code";
                const bookingBookmaker = bookingCodeDoc?.bookmaker || "SportyBet";
                const bookingOdds = Number(bookingCodeDoc?.odds) || 1.0;
                const orderAmount = finalAmountPesewas / 100;

                // Pre-save pending order in Firestore (without exposing the secret code)
                await setFirestoreDoc('orders', reference, {
                    id: reference,
                    reference,
                    ...(effectiveUserId ? { userId: effectiveUserId } : {}),
                    customerName: customerName || "Royal Customer",
                    email: email,
                    phone: customerPhone || "",
                    bundle: `BOOKING CODE: ${bookingTitle} (${bookingBookmaker})`,
                    bundleName: bookingTitle,
                    amount: orderAmount,
                    network: "Booking Codes",
                    serviceType: "booking_code",
                    bookingCodeId: bcSnap?.id || bookingCodeId,
                    bookmaker: bookingBookmaker,
                    odds: bookingOdds,
                    status: "pending",
                    paymentStatus: "pending",
                    paymentMethod: "Paystack",
                    createdAt: AdminFieldValue.serverTimestamp(),
                    updatedAt: AdminFieldValue.serverTimestamp(),
                }, true);
            } catch (fsErr: any) {
                if (isFirebaseCredentialError(fsErr)) {
                    return respondWithServerError(res, fsErr, 'Payment initialization temporarily unavailable');
                }
                console.warn("[Paystack Init] Firestore booking code check notice:", fsErr.message);
            }
        }

        // If this is an eFootball Coins purchase, verify price from Firestore authoritative catalog
        const efootballProductId = req.body.efootballProductId || metadata?.efootballProductId;
        let efootballProductDoc: any = null;
        if (efootballProductId || metadata?.service === 'efootball') {
            try {
                if (efootballProductId) {
                    const efSnap = await getFirestoreDoc('efootballProducts', efootballProductId);
                    if (efSnap && efSnap.exists) {
                        efootballProductDoc = efSnap.data();
                        if (efootballProductDoc?.price) {
                            // Authoritative price configured by Admin
                            finalAmountPesewas = Math.round(Number(efootballProductDoc.price) * 100);
                        }
                    }
                }

                const orderAmount = finalAmountPesewas / 100;
                const accountIdentifier = req.body.accountIdentifier || metadata?.accountIdentifier || req.body.konamiId || metadata?.konamiId || "";
                const accountIdentifierType = req.body.accountIdentifierType || metadata?.accountIdentifierType || (accountIdentifier.includes('@') ? 'email' : 'konami_id');
                const konamiId = accountIdentifier;
                const efOrderId = req.body.efootballOrderId || metadata?.orderId || metadata?.efootballOrderId || reference;
                
                const rawPlatform = metadata?.platform || req.body.platform || efootballProductDoc?.platformLabel || efootballProductDoc?.platform || 'Android';
                const efPlatform = (rawPlatform === 'ios' || rawPlatform === 'iOS') ? 'iOS' :
                                   (rawPlatform === 'steam' || rawPlatform === 'Steam') ? 'Steam' :
                                   (rawPlatform === 'android' || rawPlatform === 'Android') ? 'Android' : rawPlatform;

                const efCoinAmount = efootballProductDoc?.coinAmount || metadata?.coinAmount || 0;
                const efProductName = efootballProductDoc?.name || metadata?.productName || "eFootball Coins";

                const efPayload: any = {
                    id: reference,
                    orderId: efOrderId,
                    reference: reference,
                    paystackReference: reference,
                    ...(effectiveUserId ? { userId: effectiveUserId, customerId: effectiveUserId } : {}),
                    customerName: customerName || metadata?.customerName || "Customer",
                    customerEmail: email,
                    email: email,
                    customerPhone: customerPhone || metadata?.customerPhone || "",
                    phone: customerPhone || metadata?.customerPhone || "",
                    productId: efootballProductId || "",
                    productName: efProductName,
                    bundle: `${efProductName} (${efPlatform})`,
                    bundleName: efProductName,
                    coinAmount: efCoinAmount,
                    platform: efPlatform,
                    accountIdentifier: accountIdentifier,
                    accountIdentifierType: accountIdentifierType,
                    konamiId: konamiId,
                    amount: orderAmount,
                    currency: currency || "GHS",
                    network: "Game Coins",
                    category: "eFootball Coins",
                    serviceType: "efootball",
                    status: "pending",
                    paymentStatus: "PAYMENT_PENDING",
                    fulfillmentStatus: "AWAITING_FULFILLMENT",
                    adminStatus: "AWAITING_FULFILLMENT",
                    paymentMethod: "Paystack",
                    payment_provider: "paystack",
                    createdAt: AdminFieldValue.serverTimestamp(),
                    updatedAt: AdminFieldValue.serverTimestamp(),
                };

                await setFirestoreDoc('efootballOrders', reference, efPayload, true);
                await setFirestoreDoc('orders', reference, efPayload, true);
                console.log(`[Paystack Init] Registered eFootball Order ${efOrderId} (${reference}) for ${email}, amount: GH¢${orderAmount}`);
            } catch (efFsErr: any) {
                if (isFirebaseCredentialError(efFsErr)) {
                    return respondWithServerError(res, efFsErr, 'Payment initialization temporarily unavailable');
                }
                console.warn("[Paystack Init] Firestore efootball order check notice:", efFsErr.message);
            }
        }

        // If this is an Airtime purchase, calculate total authoritatively from Firestore settings
        const isAirtimeRequest = req.body.serviceType === 'airtime' || metadata?.service === 'airtime';
        if (isAirtimeRequest) {
            try {
                let airtimeSettings: any = { enabled: true, serviceCharge: 1.00 };
                const airtimeSettingsSnap = await getFirestoreDoc('settings', 'airtime');
                if (airtimeSettingsSnap && airtimeSettingsSnap.exists) {
                    airtimeSettings = { ...airtimeSettings, ...airtimeSettingsSnap.data() };
                }

                if (airtimeSettings.enabled === false) {
                    return res.status(400).json({
                        success: false,
                        error: "Airtime service is currently unavailable. Please check back shortly."
                    });
                }

                const rawAirtimeAmount = Number(req.body.airtimeAmount || metadata?.airtimeAmount || 0);
                if (!rawAirtimeAmount || rawAirtimeAmount < 1) {
                    return res.status(400).json({
                        success: false,
                        error: "Please enter a valid airtime amount of at least GH₵1.00"
                    });
                }

                const serviceCharge = typeof airtimeSettings.serviceCharge === 'number' && airtimeSettings.serviceCharge >= 0
                    ? Number(airtimeSettings.serviceCharge)
                    : 1.00;

                const authoritativeTotalGHS = Number((rawAirtimeAmount + serviceCharge).toFixed(2));
                finalAmountPesewas = Math.round(authoritativeTotalGHS * 100);

                const recipientPhone = req.body.recipientPhone || metadata?.recipientPhone || customerPhone || "";
                const airtimeNetwork = "MTN";

                const airtimePayload: any = {
                    id: reference,
                    orderId: reference,
                    reference: reference,
                    referenceCode: reference,
                    paystackReference: reference,
                    ...(effectiveUserId ? { userId: effectiveUserId, customerId: effectiveUserId } : {}),
                    customerName: customerName || metadata?.customerName || "Customer",
                    customerEmail: email,
                    email: email,
                    customerPhone: recipientPhone,
                    phone: recipientPhone,
                    recipientPhone: recipientPhone,
                    network: airtimeNetwork,
                    recipientNetwork: airtimeNetwork,
                    bundle: `MTN Airtime - GH₵${rawAirtimeAmount.toFixed(2)}`,
                    bundleName: `MTN Airtime - GH₵${rawAirtimeAmount.toFixed(2)}`,
                    category: "Airtime",
                    serviceType: "airtime",
                    airtimeAmount: rawAirtimeAmount,
                    serviceFee: serviceCharge,
                    amount: authoritativeTotalGHS,
                    amountSent: authoritativeTotalGHS,
                    currency: currency || "GHS",
                    status: "pending",
                    paymentStatus: "pending",
                    paymentMethod: "Paystack",
                    payment_provider: "paystack",
                    createdAt: AdminFieldValue.serverTimestamp(),
                    updatedAt: AdminFieldValue.serverTimestamp(),
                };

                await setFirestoreDoc('orders', reference, airtimePayload, true);
                console.log(`[Paystack Init] Registered Airtime Order ${reference} for ${recipientPhone}, airtime: GH¢${rawAirtimeAmount}, fee: GH¢${serviceCharge}, total: GH¢${authoritativeTotalGHS}`);
            } catch (airtimeFsErr: any) {
                if (isFirebaseCredentialError(airtimeFsErr)) {
                    return respondWithServerError(res, airtimeFsErr, 'Payment initialization temporarily unavailable');
                }
                console.warn("[Paystack Init] Firestore airtime check notice:", airtimeFsErr.message);
            }
        }

        // Fast Delivery ⚡ verification & metadata persistence (Separated Customer vs Agent)
        const requestedFastDelivery = req.body.fastDelivery === true || metadata?.fastDelivery === true;
        const requestedNetwork = req.body.network || metadata?.network || "";
        const requestedType = req.body.fastDeliveryType || metadata?.fastDeliveryType;

        let isAgentOrder = Boolean(
            req.body.isAgentOrder ||
            metadata?.isAgentOrder ||
            requestedType === "agent" ||
            req.body.agentId ||
            req.body.agent_id ||
            metadata?.agentId ||
            metadata?.agent_id
        );

        let verifiedResult: VerifiedFastDeliveryResult = {
            isFastDelivery: false,
            fastDeliveryType: isAgentOrder ? "agent" : "customer",
            fastDeliveryFee: 0,
            basePrice: Number(req.body.basePrice || metadata?.basePrice || 0),
            finalPrice: Number(req.body.basePrice || metadata?.basePrice || 0),
        };

        try {
            let existingOrder: any = null;
            let existingAgentOrder: any = null;

            if (reference) {
                const existingOrderSnap = await getFirestoreDoc('orders', reference);
                const existingAgentOrderSnap = await getFirestoreDoc('agent_orders', reference);
                if (existingOrderSnap && existingOrderSnap.exists) {
                    existingOrder = existingOrderSnap.data();
                }
                if (existingAgentOrderSnap && existingAgentOrderSnap.exists) {
                    existingAgentOrder = existingAgentOrderSnap.data();
                }
            }

            if (existingAgentOrder || existingOrder?.isAgentOrder || existingOrder?.agent_id || existingOrder?.agentId) {
                isAgentOrder = true;
            }

            const effectiveNetwork = requestedNetwork || existingOrder?.network || existingAgentOrder?.customer_details?.network || "";
            const rawBasePrice = Number(
                existingOrder?.basePrice ||
                existingAgentOrder?.basePrice ||
                existingAgentOrder?.agent_price ||
                req.body.basePrice ||
                metadata?.basePrice ||
                (existingOrder?.amount ? Math.max(0, existingOrder.amount - (existingOrder.fastDeliveryFee || 0)) : 0)
            );

            const existingHiddenFee = existingOrder
                ? (existingOrder.hiddenFee != null
                    ? Number(existingOrder.hiddenFee) || 0
                    : Math.max(0, Number(existingOrder.amount || 0) - Number(existingOrder.basePrice || existingOrder.amount || 0) - Number(existingOrder.fastDeliveryFee || 0)))
                : 0;

            verifiedResult = await verifyFastDeliverySettings({
                requestedFastDelivery,
                network: effectiveNetwork,
                isAgent: isAgentOrder,
                basePrice: rawBasePrice,
            });

            if (reference) {
                if (existingOrder && !isProtectedPaidOrFulfilledState(existingOrder)) {
                    if (verifiedResult.isFastDelivery && rawBasePrice > 0) {
                        const updatedFinalAmount = Math.round((verifiedResult.finalPrice + existingHiddenFee) * 100) / 100;
                        await updateFirestoreDoc('orders', reference, {
                            fastDelivery: true,
                            fastDeliveryType: verifiedResult.fastDeliveryType,
                            fastDeliveryFee: verifiedResult.fastDeliveryFee,
                            basePrice: verifiedResult.basePrice,
                            hiddenFee: existingHiddenFee,
                            finalPrice: updatedFinalAmount,
                            amount: updatedFinalAmount,
                            updatedAt: AdminFieldValue.serverTimestamp(),
                        });
                        console.log(`[Paystack Init] Verified Fast Delivery ⚡ (${verifiedResult.fastDeliveryType}) for order ${reference}, fee: GH¢${verifiedResult.fastDeliveryFee}`);
                    } else if (existingOrder.fastDelivery && rawBasePrice > 0) {
                        const updatedFinalAmount = Math.round((verifiedResult.basePrice + existingHiddenFee) * 100) / 100;
                        await updateFirestoreDoc('orders', reference, {
                            fastDelivery: false,
                            fastDeliveryType: verifiedResult.fastDeliveryType,
                            fastDeliveryFee: 0,
                            basePrice: verifiedResult.basePrice,
                            hiddenFee: existingHiddenFee,
                            finalPrice: updatedFinalAmount,
                            amount: updatedFinalAmount,
                            updatedAt: AdminFieldValue.serverTimestamp(),
                        });
                    }
                }

                if (existingAgentOrder) {
                    const agentBase = Number(existingAgentOrder.basePrice || existingAgentOrder.agent_price || rawBasePrice);
                    const verifiedAgentResult = await verifyFastDeliverySettings({
                        requestedFastDelivery,
                        network: effectiveNetwork,
                        isAgent: true,
                        basePrice: agentBase,
                    });

                    if (verifiedAgentResult.isFastDelivery) {
                        await updateFirestoreDoc('agent_orders', reference, {
                            fastDelivery: true,
                            fastDeliveryType: "agent",
                            fastDeliveryFee: verifiedAgentResult.fastDeliveryFee,
                            basePrice: verifiedAgentResult.basePrice,
                            finalPrice: verifiedAgentResult.finalPrice,
                            updatedAt: AdminFieldValue.serverTimestamp(),
                        });
                        console.log(`[Paystack Init] Verified Fast Delivery ⚡ (agent) for agent_order ${reference}, fee: GH¢${verifiedAgentResult.fastDeliveryFee}`);
                    } else if (existingAgentOrder.fastDelivery) {
                        await updateFirestoreDoc('agent_orders', reference, {
                            fastDelivery: false,
                            fastDeliveryType: "agent",
                            fastDeliveryFee: 0,
                            basePrice: verifiedAgentResult.basePrice,
                            finalPrice: verifiedAgentResult.basePrice,
                            updatedAt: AdminFieldValue.serverTimestamp(),
                        });
                    }
                }
            }
        } catch (fdErr: any) {
            if (isFirebaseCredentialError(fdErr)) {
                return respondWithServerError(res, fdErr, 'Payment initialization temporarily unavailable');
            }
            console.warn("[Paystack Init] Fast delivery verification notice:", fdErr.message);
        }
        
        const key = getPaystackSecretKey();
        if (!key || (!key.startsWith('sk_') && !key.startsWith('sat_'))) {
            console.error('[Paystack Server Error] PAYSTACK_SECRET_KEY is missing or invalid on server environment.');
            if (reference && (reference.includes('mock') || reference.startsWith('PSTK'))) {
                const fallbackUrl = `${req.body.callback_url}${req.body.callback_url.includes('?') ? '&' : '?'}reference=${req.body.reference}&mock=true`;
                return res.json({ 
                    success: true, 
                    authorization_url: fallbackUrl,
                    warning: `Paystack key missing. Falling back to test mock.`
                });
            }
            return res.status(400).json({ success: false, error: 'Payment could not be initialized. Please try again.' });
        }
        
        console.log(`[Paystack] Initializing transaction for email: ${email}, amount: ${finalAmountPesewas} pesewas, currency: ${currency || "GHS"}`);
        const paystackPayload: any = {
            email,
            amount: finalAmountPesewas, // must be in pesewas / subunits
            reference,
            callback_url,
            currency: currency || "GHS",
            metadata: {
                ...(metadata || {}),
                service: bookingCodeId ? "booking_codes" : (metadata?.service || "orders"),
                ...(verifiedResult.isFastDelivery ? {
                    fastDelivery: true,
                    fastDeliveryType: verifiedResult.fastDeliveryType,
                    fastDeliveryFee: verifiedResult.fastDeliveryFee,
                    basePrice: verifiedResult.basePrice,
                    finalPrice: verifiedResult.finalPrice,
                } : {
                    fastDelivery: false,
                }),
                ...(bookingCodeId ? {
                    bookingCodeId,
                    code_title: bookingCodeDoc?.title || "",
                    bookmaker: bookingCodeDoc?.bookmaker || "",
                    odds: String(bookingCodeDoc?.odds || ""),
                } : {})
            }
        };

        const response = await gatewayHttpClient.post('https://api.paystack.co/transaction/initialize', paystackPayload, {
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.status && response.data.data) {
            return res.json({ 
                success: true, 
                authorization_url: response.data.data.authorization_url,
                reference: reference
            });
        } else {
            throw new Error(response.data?.message || 'Invalid response from Paystack API');
        }
    } catch (err: any) {
        const errorDetails = err.response?.data || {};
        const errorMsg = errorDetails.message || err.message || "Payment could not be initialized. Please try again.";
        console.error(`[Paystack Initialization Error]:`, errorDetails || err.message);
        
        if (req.body?.reference && (req.body.reference.includes('mock') || req.body.reference.startsWith('PSTK'))) {
            const fallbackUrl = `${req.body.callback_url}${req.body.callback_url.includes('?') ? '&' : '?'}reference=${req.body.reference}&mock=true`;
            return res.json({ 
                success: true, 
                authorization_url: fallbackUrl
            });
        }
        return res.status(400).json({ success: false, error: errorDetails.message ? errorDetails.message : 'Payment could not be initialized. Please try again.' });
    }
}

app.post('/api/paystack-initialize', handlePaystackInitialize);
app.post('/api/paystack/initialize', handlePaystackInitialize);
app.post('/api/booking-codes/initialize', handlePaystackInitialize);

async function updateFirestoreOrderPaymentStatus(
    reference: string,
    paymentStatus: "success" | "failed" | "cancelled" | "pending" = "success",
    extraMeta?: Record<string, any>
) {
    try {
        console.log(`[Server Firestore] Updating order ${reference} to paymentStatus: ${paymentStatus}`);
        const resolved = await resolveOrderDocByReference(reference);
        const targetId = resolved.docId || reference;
        const orderSnap = resolved.snap;
        const orderData = resolved.data;
        const agentOrderSnap = await getFirestoreDoc('agent_orders', targetId);
        const agentData = agentOrderSnap?.exists ? agentOrderSnap.data() : null;

        // Guard: Never downgrade or mark failed/cancelled an order already verified as paid/processing/accepted/delivered/completed
        if (orderData && isProtectedPaidOrFulfilledState(orderData)) {
            if (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "pending") {
                console.warn(
                    `[Payment Guard] Refusing to overwrite protected order ${targetId} (status=${orderData.status}, paymentStatus=${orderData.paymentStatus}) with ${paymentStatus}`
                );
                return;
            }
        }

        if (orderSnap && orderSnap.exists) {
            const currentStatus = String(orderData?.status || '').toLowerCase().trim();
            let newStatus: string;
            if (paymentStatus === "success") {
                // Preserve active fulfillment progression (processing/accepted/delivered/completed)
                newStatus = ACTIVE_FULFILLMENT_STATUSES.has(currentStatus) ? orderData.status : "paid";
            } else if (paymentStatus === "failed") {
                newStatus = "failed";
            } else if (paymentStatus === "cancelled") {
                newStatus = "cancelled";
            } else {
                newStatus = orderData?.status || "pending";
            }

            await updateFirestoreDoc('orders', targetId, {
                paymentStatus,
                status: newStatus,
                ...(agentData ? {
                    agentId: agentData.agent_id || orderData?.agentId || orderData?.agent_id,
                    agent_id: agentData.agent_id || orderData?.agent_id || orderData?.agentId,
                    wholesalePrice: agentData.wholesale_price || orderData?.wholesalePrice,
                    wholesale_price: agentData.wholesale_price || orderData?.wholesale_price,
                    agentPrice: agentData.agent_price || orderData?.agentPrice,
                    agent_price: agentData.agent_price || orderData?.agent_price,
                    profit: agentData.profit || orderData?.profit,
                    agent_profit: agentData.profit || orderData?.agent_profit,
                    isAgentOrder: true
                } : {}),
                ...(extraMeta || {}),
                updatedAt: AdminFieldValue.serverTimestamp()
            });
            console.log(`[Server Firestore] Updated order ${targetId} to status: ${newStatus}`);

            // Instantly grant Agent Access if this was an Agent Unlock order and payment is successful
            if (paymentStatus === "success" && orderData?.bundle === "AGENT ACCESS UNLOCK" && orderData?.userId) {
                await updateFirestoreDoc('users', orderData.userId, { isAgent: true, updatedAt: AdminFieldValue.serverTimestamp() });
                console.log(`[Server Firestore] Successfully unlocked Agent Access for user: ${orderData.userId}`);
            }
        } else if (agentData && paymentStatus === "success") {
            // Order existed in agent_orders but not in orders collection - create it in orders
            await setFirestoreDoc('orders', targetId, {
                id: targetId,
                reference: targetId,
                paymentStatus: "success",
                status: "paid",
                email: agentData.customer_details?.email || "",
                phone: agentData.customer_details?.phone || "",
                customerName: agentData.customer_details?.name || "Agent Store Customer",
                network: agentData.customer_details?.network || "Data Bundle",
                bundle: agentData.bundle || "Agent Store Bundle",
                amount: agentData.finalPrice || agentData.agent_price || 0,
                agentId: agentData.agent_id,
                agent_id: agentData.agent_id,
                wholesalePrice: agentData.wholesale_price || 0,
                wholesale_price: agentData.wholesale_price || 0,
                agentPrice: agentData.agent_price || 0,
                agent_price: agentData.agent_price || 0,
                profit: agentData.profit || 0,
                agent_profit: agentData.profit || 0,
                isAgentOrder: true,
                fastDelivery: Boolean(agentData.fastDelivery),
                ...(agentData.fastDelivery ? {
                    fastDeliveryType: agentData.fastDeliveryType || "agent",
                    fastDeliveryFee: Number(agentData.fastDeliveryFee ?? 1.00),
                    basePrice: Number(agentData.basePrice || agentData.agent_price || 0),
                    finalPrice: Number(agentData.finalPrice || agentData.amount || agentData.agent_price || 0),
                } : {}),
                ...(extraMeta || {}),
                createdAt: agentData.created_at || AdminFieldValue.serverTimestamp(),
                updatedAt: AdminFieldValue.serverTimestamp()
            }, true);
            console.log(`[Server Firestore] Reconstructed order ${targetId} from agent_orders doc`);
        } else {
            console.log(`[Server Firestore] Order document ${targetId} not found in Firestore.`);
        }

        if (agentOrderSnap && agentOrderSnap.exists) {
            const agentAlreadyPaid = Boolean(
                agentData &&
                (PROTECTED_ORDER_STATUSES.has(String(agentData.status || '').toLowerCase()) ||
                 PROTECTED_PAYMENT_STATUSES.has(String(agentData.paymentStatus || '').toLowerCase()) ||
                 agentData.profit_credited === true)
            );
            if (!(agentAlreadyPaid && (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "pending"))) {
                await updateFirestoreDoc('agent_orders', targetId, {
                    status: paymentStatus === "success" ? "success" : paymentStatus,
                    paymentStatus: paymentStatus
                });
                console.log(`[Server Firestore] Successfully updated agent_orders document ${targetId} to status: ${paymentStatus}`);
            }
        }

        // Also update efootballOrders collection if present
        try {
            const efOrderSnap = await getFirestoreDoc('efootballOrders', targetId);
            if (efOrderSnap && efOrderSnap.exists) {
                const efData = efOrderSnap.data();
                const efProtected = Boolean(
                    efData &&
                    (PROTECTED_PAYMENT_STATUSES.has(String(efData.paymentStatus || '').toLowerCase()) ||
                     PROTECTED_ORDER_STATUSES.has(String(efData.status || '').toLowerCase()) ||
                     String(efData.fulfillmentStatus || '').toUpperCase() === 'DELIVERED')
                );
                if (efProtected && (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "pending")) {
                    console.warn(`[Payment Guard] Refusing to downgrade protected efootballOrders ${targetId} to ${paymentStatus}`);
                } else {
                    const newEfPaymentStatus = paymentStatus === "success" ? "PAID" : (paymentStatus === "failed" ? "FAILED" : (paymentStatus === "cancelled" ? "CANCELLED" : "PAYMENT_PENDING"));
                    const currentEfStatus = String(efData?.status || '').toLowerCase().trim();
                    const newEfStatus = paymentStatus === "success"
                        ? (ACTIVE_FULFILLMENT_STATUSES.has(currentEfStatus) ? efData.status : "paid")
                        : (paymentStatus === "failed" ? "failed" : (paymentStatus === "cancelled" ? "cancelled" : "pending"));
                    const newFulfillmentStatus = paymentStatus === "success"
                        ? (efData?.fulfillmentStatus === "DELIVERED" ? "DELIVERED" : "AWAITING_FULFILLMENT")
                        : efData?.fulfillmentStatus || "AWAITING_FULFILLMENT";

                    await updateFirestoreDoc('efootballOrders', targetId, {
                        paymentStatus: newEfPaymentStatus,
                        status: newEfStatus,
                        fulfillmentStatus: newFulfillmentStatus,
                        adminStatus: newFulfillmentStatus,
                        ...(paymentStatus === "success" && !efData?.paidAt ? { paidAt: AdminFieldValue.serverTimestamp() } : {}),
                        updatedAt: AdminFieldValue.serverTimestamp()
                    });
                    console.log(`[Server Firestore] Successfully updated efootballOrders document ${targetId} to paymentStatus: ${newEfPaymentStatus}`);
                }
            }
        } catch (efErr: any) {
            if (isFirebaseCredentialError(efErr)) throw efErr;
            console.warn('[Server Firestore] efootballOrders update notice:', efErr?.message);
        }
    } catch (err: any) {
        if (isFirebaseCredentialError(err)) throw err;
        console.log('[Server Firestore] Notice: Update of Firestore status was not completed:', err.message || err);
    }
}

async function updateFirestoreOrderPaymentSuccess(reference: string) {
    return updateFirestoreOrderPaymentStatus(reference, "success");
}

const gatewayHttpClient = {
    get: (url: string, config?: any) => axios.get(url, config),
    post: (url: string, data?: any, config?: any) => axios.post(url, data, config)
};

async function verifyPaystackReference(reference: string): Promise<{
    status: boolean;
    transientError?: boolean;
    gatewayNotFound?: boolean;
    httpStatus?: number;
    message: string;
    data: any;
}> {
    const key = getPaystackSecretKey();
    if (!key || (!key.startsWith('sk_') && !key.startsWith('sat_'))) {
        console.warn('[Paystack Backend Error] PAYSTACK_SECRET_KEY is missing or invalid in server environment.');
        return {
            status: false,
            transientError: true,
            httpStatus: 503,
            message: 'Paystack secret key is missing or not configured on the server',
            data: {}
        };
    }

    try {
        console.log(`[Paystack Backend] Calling Paystack Verify Transaction API for reference: ${reference}`);
        const response = await gatewayHttpClient.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${key}` },
            timeout: 15000
        });

        console.log(`[Paystack Backend Response] Status: ${response.status}, Data Status: ${response.data?.data?.status}`);
        return response.data;
    } catch (err: any) {
        const httpStatus = err.response?.status;
        const errorMsg = err.response?.data?.message || err.message || 'Verification failed';
        const isNetworkOrRateLimitOrServer =
            !err.response ||
            err.code === 'ECONNABORTED' ||
            err.code === 'ETIMEDOUT' ||
            err.code === 'ECONNRESET' ||
            err.code === 'ENOTFOUND' ||
            httpStatus === 408 ||
            httpStatus === 429 ||
            (typeof httpStatus === 'number' && httpStatus >= 500);
        const gatewayNotFound = !err.response?.data?.data?.status && (httpStatus === 400 || httpStatus === 404);

        console.warn(
            `[Paystack Backend Error] Paystack verify API call error for reference ${reference} (httpStatus=${httpStatus || 'network'}, transient=${isNetworkOrRateLimitOrServer}): ${errorMsg}`
        );
        return {
            status: false,
            transientError: isNetworkOrRateLimitOrServer,
            gatewayNotFound,
            httpStatus,
            message: errorMsg,
            data: err.response?.data?.data || {}
        };
    }
}

// Unified Payment Verification Handler
async function handlePaystackVerificationRequest(req: express.Request, res: express.Response) {
    const rawReference = req.body?.reference || req.body?.orderId || req.body?.trxref || req.query?.reference;
    const reference = rawReference ? String(rawReference).trim() : '';
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

    let resolvedOrder: { docId: string; snap: any; data: any } = { docId: reference, snap: null, data: null };

    try {
        resolvedOrder = await resolveOrderDocByReference(reference);
        const resolvedId = resolvedOrder.docId || reference;
        const existingData = resolvedOrder.data;
        const alreadyProtected = isProtectedPaidOrFulfilledState(existingData);

        const existingProvider = String(existingData?.payment_provider || '').trim().toLowerCase();
        const existingMethod = String(existingData?.paymentMethod || '').trim().toLowerCase();
        const requestMethod = String(req.body?.method || req.query?.method || '').trim().toLowerCase();
        const isLegacyKorapayOrder =
            existingProvider === 'korapay' ||
            existingMethod === 'korapay' ||
            requestMethod === 'korapay' ||
            (reference.toUpperCase().startsWith('KORA') && existingProvider !== 'paystack' && existingMethod !== 'paystack');

        if (isLegacyKorapayOrder) {
            console.info(`[Paystack Verify Guard] Skipping Paystack API call for legacy Korapay reference ${reference} (resolvedId=${resolvedId})`);
            return res.status(400).json({
                success: false,
                verified: false,
                unsupportedProvider: true,
                legacyProvider: 'korapay',
                status: existingData?.status || 'legacy',
                paymentMethod: existingData?.paymentMethod || 'Korapay',
                message: 'This transaction belongs to a legacy payment provider (Korapay) that is no longer active.',
                error: 'Legacy Korapay transactions cannot be verified through Paystack. Existing order records remain preserved.'
            });
        }

        const verifyResult = await verifyPaystackReference(reference);
        const paystackData = verifyResult?.data || {};
        const paystackStatus = String(paystackData?.status || '').toLowerCase().trim();

        // 1. Transient API/Network Error or Missing Secret Key: NEVER overwrite order as failed
        if (verifyResult?.transientError) {
            if (alreadyProtected) {
                return res.json({
                    success: true,
                    verified: true,
                    message: "Order already verified and processed ✅",
                    data: paystackData
                });
            }
            return res.status(503).json({
                success: false,
                verified: false,
                retryable: true,
                status: existingData?.status || 'pending',
                error: 'Temporary gateway verification delay. Please retry shortly.'
            });
        }

        // 2. Transaction Pending / In-Flight (e.g. Mobile Money prompt awaiting PIN): Keep PENDING, allow retry
        if (PAYSTACK_PENDING_STATUSES.has(paystackStatus) || (verifyResult?.gatewayNotFound && !paystackStatus)) {
            if (alreadyProtected) {
                return res.json({
                    success: true,
                    verified: true,
                    message: "Order already verified and processed ✅",
                    data: paystackData
                });
            }
            return res.status(202).json({
                success: false,
                verified: false,
                pending: true,
                retryable: true,
                status: paystackStatus || 'pending',
                message: 'Payment is still being confirmed by Paystack. Please wait a moment.'
            });
        }

        // 3. Explicit User Cancellation / Checkout Abandonment: Record CANCELLED cleanly (NOT FAILED)
        if (paystackStatus === 'abandoned') {
            if (alreadyProtected) {
                return res.json({
                    success: true,
                    verified: true,
                    message: "Order already verified and processed ✅",
                    data: paystackData
                });
            }
            if (resolvedOrder.snap && resolvedOrder.snap.exists) {
                await updateFirestoreOrderPaymentStatus(resolvedId, "cancelled", {
                    paymentMethod: existingData?.paymentMethod || "Paystack",
                    payment_provider: "paystack",
                    cancellationReason: paystackData?.gateway_response || 'Payment was cancelled before completion'
                });
            }
            return res.status(200).json({
                success: false,
                verified: false,
                cancelled: true,
                status: 'cancelled',
                error: 'Payment was cancelled before completion.'
            });
        }

        // 4. Strictly check if Paystack verified transaction as successful
        const isSuccess = verifyResult?.status === true && (paystackStatus === 'success' || paystackStatus === 'paid');

        if (!isSuccess) {
            // Critical Guard: If order is already paid/processing/delivered (e.g. via webhook), NEVER mark it failed
            if (alreadyProtected) {
                console.warn(`[Paystack Verify Guard] Order ${resolvedId} already protected (${existingData?.status}). Ignoring non-success verify state: ${paystackStatus}`);
                return res.json({
                    success: true,
                    verified: true,
                    message: "Order already verified and processed ✅",
                    data: paystackData
                });
            }

            console.warn(`[Paystack Backend Unverified] Reference ${reference} explicitly failed: ${paystackStatus || verifyResult?.message || 'failed'}`);
            if (resolvedOrder.snap && resolvedOrder.snap.exists) {
                await updateFirestoreOrderPaymentStatus(resolvedId, "failed", {
                    paymentMethod: existingData?.paymentMethod || "Paystack",
                    payment_provider: "paystack",
                    failureReason: paystackData?.gateway_response || verifyResult?.message || 'Payment failed'
                });
            }

            return res.status(400).json({
                success: false,
                verified: false,
                status: paystackStatus || 'failed',
                error: paystackData?.gateway_response || verifyResult?.message || 'Payment was not completed.'
            });
        }

        // 5. Reference Match Guard
        const gatewayRef = String(paystackData?.reference || '').trim();
        if (gatewayRef) {
            const matchesRequestedRef =
                gatewayRef.toLowerCase() === reference.toLowerCase() ||
                gatewayRef.toLowerCase() === resolvedId.toLowerCase() ||
                (existingData?.paymentReference && gatewayRef.toLowerCase() === String(existingData.paymentReference).toLowerCase());
            if (!matchesRequestedRef) {
                console.warn(`[Paystack Security Alert] Reference mismatch: requested=${reference}, gateway=${gatewayRef}`);
                return res.status(400).json({
                    success: false,
                    verified: false,
                    error: 'Transaction reference mismatch.'
                });
            }
        }

        const amountInMainCurrency = paystackData?.amount ? Number(paystackData.amount) / 100 : 0;
        const currency = (paystackData?.currency || "GHS").toUpperCase();
        const customerEmail = paystackData?.customer?.email || "";
        const customerName = [paystackData?.customer?.first_name, paystackData?.customer?.last_name].filter(Boolean).join(" ").trim() || paystackData?.customer?.name || "";
        const customerPhone = paystackData?.customer?.phone || "";
        const paymentTimestamp = paystackData?.paid_at || new Date().toISOString();

        // 6. Strict Currency Check: Must be GHS
        if (currency !== "GHS") {
            console.warn(`[Paystack Backend Warning] Transaction ${reference} currency mismatch: received ${currency}, expected GHS`);
            return res.status(400).json({
                success: false,
                verified: false,
                error: `Invalid payment currency: ${currency}. Only GHS is accepted.`
            });
        }

        // 7. Strict Underpayment Check (Pesewa Comparison; allow fee pass-through >= expected - 1 pesewa)
        if (!alreadyProtected && existingData && existingData.amount != null) {
            const expectedPesewas = Math.round(Number(existingData.amount) * 100);
            const verifiedPesewas = Math.round(amountInMainCurrency * 100);

            if (expectedPesewas > 0 && verifiedPesewas < expectedPesewas - 1) {
                console.warn(`[Paystack Security Alert] Underpayment on reference ${reference}: paid ${verifiedPesewas} pesewas, expected ${expectedPesewas} pesewas`);
                await updateFirestoreDoc('orders', resolvedId, {
                    paymentStatus: "underpaid",
                    status: "failed",
                    amountPaid: amountInMainCurrency,
                    failureReason: `Underpayment: paid ${amountInMainCurrency} GHS, expected ${existingData.amount} GHS`,
                    updatedAt: AdminFieldValue.serverTimestamp()
                });
                return res.status(400).json({
                    success: false,
                    verified: false,
                    status: 'failed',
                    error: `Underpayment detected. Paid ${amountInMainCurrency} GHS, required ${existingData.amount} GHS.`
                });
            }
        }

        // 8. Check booking code reveal even if already verified (idempotent booking code response)
        let revealedBookingCode: any = null;
        const isBookingCode = existingData?.serviceType === 'booking_code' ||
            existingData?.bookingCodeId ||
            reference.startsWith('BC_') ||
            req.body?.bookingCodeId ||
            req.body?.service === 'booking_codes' ||
            paystackData?.metadata?.service === 'booking_codes' ||
            paystackData?.metadata?.bookingCodeId;

        if (alreadyProtected) {
            console.log(`[Paystack Backend] Order ${resolvedId} was already successfully verified and fulfilled.`);
            if (isBookingCode) {
                const purchaseSnap = await getFirestoreDoc('booking_code_purchases', resolvedId);
                if (purchaseSnap && purchaseSnap.exists) {
                    const p = purchaseSnap.data();
                    revealedBookingCode = {
                        id: p.bookingCodeId,
                        code: p.code,
                        title: p.title,
                        bookmaker: p.bookmaker,
                        odds: p.odds,
                        price: p.price,
                        reference: resolvedId
                    };
                }
            }
            if (existingData) {
                const reqRefBy = req.body?.referredBy ? String(req.body.referredBy).trim().toUpperCase() : '';
                await creditReferralIfEligible(resolvedId, {
                    ...existingData,
                    referredBy: existingData.referredBy || reqRefBy
                });
            }
            const alreadyUnlockedAgent = Boolean(existingData?.bundle === "AGENT ACCESS UNLOCK" && existingData?.userId);
            return res.json({
                success: true,
                message: "Order already verified and processed ✅",
                verified: true,
                ...(alreadyUnlockedAgent ? { unlockedAgent: true } : {}),
                ...(revealedBookingCode ? { serviceType: "booking_code", bookingCode: revealedBookingCode } : {}),
                data: paystackData
            });
        }

        console.log(`[Paystack Backend Success] Reference ${reference} verified! Customer: ${customerEmail || 'Guest'}`);

        const reqUser = await verifyRequestUser(req);
        const reqReferredBy = req.body?.referredBy ? String(req.body.referredBy).trim().toUpperCase() : '';
        let unlockedAgent = false;

        // Update/Save verified order details in Firestore
        try {
            const targetBookingCodeId = existingData?.bookingCodeId ||
                req.body?.bookingCodeId ||
                paystackData?.metadata?.bookingCodeId;

            if (isBookingCode) {
                let bcSnap: any = null;
                if (targetBookingCodeId) {
                    bcSnap = await getFirestoreDoc('booking_codes', targetBookingCodeId);
                }

                if (!bcSnap || !bcSnap.exists) {
                    const activeCodes = await queryActiveBookingCodes(5);
                    if (activeCodes.length > 0) {
                        bcSnap = activeCodes[0];
                    }
                }

                if (bcSnap && bcSnap.exists) {
                    const bcData = bcSnap.data();
                    const realCode = bcData.code || "";

                    revealedBookingCode = {
                        id: bcSnap.id,
                        code: realCode,
                        title: bcData.title || existingData?.bundleName || "VIP Booking Code",
                        bookmaker: bcData.bookmaker || existingData?.bookmaker || "SportyBet",
                        odds: Number(bcData.odds) || Number(existingData?.odds) || 1.0,
                        price: Number(bcData.price) || amountInMainCurrency,
                        reference: resolvedId,
                        description: bcData.description || "",
                    };

                    await setFirestoreDoc('booking_code_purchases', resolvedId, {
                        id: resolvedId,
                        bookingCodeId: bcSnap.id,
                        userId: existingData?.userId || reqUser?.uid || req.body?.userId || "",
                        customerName: customerName || existingData?.customerName || "Royal Customer",
                        customerEmail: customerEmail || existingData?.email || "",
                        customerPhone: customerPhone || existingData?.phone || "",
                        title: bcData.title || "VIP Booking Code",
                        bookmaker: bcData.bookmaker || "SportyBet",
                        code: realCode,
                        odds: Number(bcData.odds) || 1.0,
                        price: amountInMainCurrency || Number(bcData.price) || 0,
                        paymentMethod: "Paystack",
                        paymentReference: reference,
                        status: "paid",
                        verifiedByBackend: true,
                        createdAt: AdminFieldValue.serverTimestamp(),
                        verifiedAt: AdminFieldValue.serverTimestamp()
                    }, true);

                    await incrementBookingCodePurchases(bcSnap.id);
                }
            }

            const currentStatus = String(existingData?.status || '').toLowerCase().trim();
            const preservedStatus = ACTIVE_FULFILLMENT_STATUSES.has(currentStatus) ? existingData.status : "paid";
            const resolvedMethod = existingData?.paymentMethod === 'momo' ? 'momo' : (existingData?.paymentMethod || "Paystack");

            const orderPayload: any = {
                paymentStatus: "success",
                status: preservedStatus,
                paymentMethod: resolvedMethod,
                payment_provider: "paystack",
                paymentReference: reference,
                currency,
                ...(amountInMainCurrency > 0 ? { amountPaid: amountInMainCurrency } : {}),
                ...(!existingData?.referredBy && reqReferredBy ? { referredBy: reqReferredBy } : {}),
                customerDetails: {
                    email: customerEmail,
                    name: customerName,
                    phone: customerPhone
                },
                ...(revealedBookingCode ? {
                    serviceType: "booking_code",
                    bookingCodeId: revealedBookingCode.id,
                    bookingCode: revealedBookingCode.code,
                    code: revealedBookingCode.code,
                    bookmaker: revealedBookingCode.bookmaker,
                    odds: revealedBookingCode.odds,
                } : {}),
                paymentTimestamp,
                verifiedByBackend: true,
                updatedAt: AdminFieldValue.serverTimestamp()
            };

            if (resolvedOrder.snap && resolvedOrder.snap.exists) {
                await updateFirestoreDoc('orders', resolvedId, orderPayload);
                console.log(`[Server Firestore] Order ${resolvedId} updated to paymentStatus: success (status: ${preservedStatus})`);

                if (existingData?.bundle === "AGENT ACCESS UNLOCK" && existingData?.userId) {
                    await updateFirestoreDoc('users', existingData.userId, { isAgent: true, updatedAt: AdminFieldValue.serverTimestamp() });
                    unlockedAgent = true;
                    console.log(`[Server Firestore] Unlocked Agent Access for user: ${existingData.userId}`);
                }
                await creditReferralIfEligible(resolvedId, {
                    ...existingData,
                    referredBy: existingData?.referredBy || reqReferredBy
                });
            } else {
                const newUserId = reqUser?.uid || '';
                await setFirestoreDoc('orders', resolvedId, {
                    id: resolvedId,
                    reference: resolvedId,
                    ...(newUserId ? { userId: newUserId } : {}),
                    email: customerEmail,
                    phone: customerPhone,
                    customerName: customerName || "Customer",
                    createdAt: AdminFieldValue.serverTimestamp(),
                    ...orderPayload
                }, true);
                console.log(`[Server Firestore] Created new verified order ${resolvedId} in Firestore`);
            }

            // Update agent_orders if present
            const agentOrderSnap = await getFirestoreDoc('agent_orders', resolvedId);
            if (agentOrderSnap && agentOrderSnap.exists) {
                const agentData = agentOrderSnap.data();
                await updateFirestoreDoc('agent_orders', resolvedId, {
                    status: "success",
                    paymentStatus: "success",
                    paymentMethod: "Paystack",
                    payment_provider: "paystack",
                    paymentReference: reference,
                    paymentTimestamp
                });

                await setFirestoreDoc('orders', resolvedId, {
                    agentId: agentData.agent_id,
                    agent_id: agentData.agent_id,
                    wholesalePrice: agentData.wholesale_price,
                    wholesale_price: agentData.wholesale_price,
                    agentPrice: agentData.agent_price,
                    agent_price: agentData.agent_price,
                    profit: agentData.profit,
                    agent_profit: agentData.profit,
                    isAgentOrder: true,
                    ...(agentData.fastDelivery ? {
                        fastDelivery: true,
                        fastDeliveryType: agentData.fastDeliveryType || "agent",
                        fastDeliveryFee: Number(agentData.fastDeliveryFee ?? 1.00),
                        basePrice: Number(agentData.basePrice || agentData.agent_price || 0),
                        finalPrice: Number(agentData.finalPrice || agentData.amount || agentData.agent_price || 0),
                    } : {}),
                }, true);
            }

            // Update booking_code_orders only if it actually exists or this is a booking code order
            try {
                const bcoSnap = await getFirestoreDoc('booking_code_orders', resolvedId);
                if ((bcoSnap && bcoSnap.exists) || isBookingCode) {
                    await setFirestoreDoc('booking_code_orders', resolvedId, {
                        status: "delivered",
                        paymentStatus: "success",
                        ...(revealedBookingCode ? { bookingCode: revealedBookingCode.code } : {}),
                        updatedAt: AdminFieldValue.serverTimestamp()
                    }, true);
                }
            } catch (bcoErr: any) {
                if (isFirebaseCredentialError(bcoErr)) throw bcoErr;
                console.warn(`[Server Firestore] booking_code_orders update notice for ${resolvedId}:`, bcoErr?.message);
            }

            // Update efootballOrders if present
            try {
                const efOrderSnap = await getFirestoreDoc('efootballOrders', resolvedId);
                if (efOrderSnap && efOrderSnap.exists) {
                    const efData = efOrderSnap.data();
                    await updateFirestoreDoc('efootballOrders', resolvedId, {
                        paymentStatus: "PAID",
                        status: ACTIVE_FULFILLMENT_STATUSES.has(String(efData?.status || '').toLowerCase()) ? efData.status : "paid",
                        fulfillmentStatus: efData?.fulfillmentStatus === "DELIVERED" ? "DELIVERED" : "AWAITING_FULFILLMENT",
                        adminStatus: efData?.fulfillmentStatus === "DELIVERED" ? "DELIVERED" : "AWAITING_FULFILLMENT",
                        paidAt: efData?.paidAt || AdminFieldValue.serverTimestamp(),
                        payment_provider: "paystack",
                        paymentMethod: "Paystack",
                        updatedAt: AdminFieldValue.serverTimestamp()
                    });
                    console.log(`[Server Firestore] efootballOrders document ${resolvedId} verified as PAID`);
                }
            } catch (efVerifyErr: any) {
                if (isFirebaseCredentialError(efVerifyErr)) throw efVerifyErr;
                console.warn(`[Server Firestore] efootballOrders verify update notice for ${resolvedId}:`, efVerifyErr?.message);
            }
        } catch (fsErr: any) {
            if (isFirebaseCredentialError(fsErr)) throw fsErr;
            console.error(`[Server Firestore] Update notice for reference ${reference}:`, fsErr.message);
        }

        return res.json({
            success: true,
            message: "Payment Verified Successfully ✅",
            verified: true,
            ...(unlockedAgent ? { unlockedAgent: true } : {}),
            ...(revealedBookingCode ? {
                serviceType: "booking_code",
                bookingCode: revealedBookingCode
            } : {}),
            data: paystackData
        });
    } catch (err: any) {
        const errorDetails = err.response?.data || err.message || 'Unknown error';
        console.error(`[Paystack Backend Verification Exception] Reference ${reference}:`, errorDetails);

        // NEVER overwrite an order as failed on an internal/runtime exception
        if (isProtectedPaidOrFulfilledState(resolvedOrder.data)) {
            return res.json({
                success: true,
                verified: true,
                message: "Order already verified and processed ✅"
            });
        }

        return res.status(503).json({
            success: false,
            verified: false,
            retryable: true,
            error: "Temporary verification error. Your order status has not been marked failed; please retry shortly."
        });
    }
}

app.post('/verify-payment', handlePaystackVerificationRequest);
app.post('/api/verify-payment', handlePaystackVerificationRequest);
app.post('/api/paystack-verify', handlePaystackVerificationRequest);
app.post('/api/paystack/verify', handlePaystackVerificationRequest);
app.post('/api/booking-codes/verify', handlePaystackVerificationRequest);

// Explicit Booking Code Reveal Endpoint
app.post('/api/booking-codes/reveal', async (req, res) => {
    const reference = req.body?.reference || req.query?.reference;
    if (!reference) {
        return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
    }

    try {
        // First check if purchase already recorded in booking_code_purchases
        const purchaseSnap = await getFirestoreDoc('booking_code_purchases', reference);
        if (purchaseSnap && purchaseSnap.exists) {
            const purchaseData = purchaseSnap.data();
            if ((purchaseData?.status === 'paid' || purchaseData?.status === 'completed') && purchaseData?.code) {
                return res.json({
                    success: true,
                    verified: true,
                    bookingCode: {
                        id: purchaseData.bookingCodeId,
                        code: purchaseData.code,
                        title: purchaseData.title,
                        bookmaker: purchaseData.bookmaker,
                        odds: purchaseData.odds,
                        price: purchaseData.price,
                        reference: reference
                    }
                });
            }
        }

        // Otherwise verify directly with Paystack
        return handlePaystackVerificationRequest(req, res);
    } catch (err: any) {
        if (isFirebaseCredentialError(err)) {
            return respondWithServerError(res, err, 'Unable to reveal booking code right now');
        }
        return res.status(400).json({ success: false, error: 'Unable to reveal code.' });
    }
});

// REST Endpoint: Paystack Webhook Event Receiver
app.post('/api/paystack-webhook', async (req, res) => {
    try {
        const secretKey = getPaystackSecretKey();
        const signature = req.headers['x-paystack-signature'] as string;

        console.log('[Paystack Webhook] Incoming webhook call with signature header:', signature ? 'Present' : 'None');

        // 1. Mandatory Header and Secret Key Check: Reject missing signatures
        if (!signature) {
            console.warn('[Paystack Webhook Security Warning] Rejected webhook: Missing x-paystack-signature header.');
            return res.status(400).json({ status: false, message: 'Missing x-paystack-signature header' });
        }

        if (!secretKey) {
            console.error('[Paystack Webhook Error] PAYSTACK_SECRET_KEY is not configured on server.');
            return res.status(500).json({ status: false, message: 'Webhook receiver configuration error' });
        }

        // 2. Strict timing-safe HMAC-SHA512 verification against raw body buffer
        const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        const computedSignature = crypto.createHmac('sha512', secretKey)
            .update(rawBody)
            .digest('hex');

        if (!timingSafeCompareStrings(signature, computedSignature)) {
            console.warn('[Paystack Webhook Security Alert] Signature verification failed! Mismatched HMAC.');
            return res.status(401).json({ status: false, message: 'Invalid webhook signature' });
        }
        console.log('[Paystack Webhook] Signature verified successfully.');

        const payload = req.body;
        const event = String(payload?.event || '').toLowerCase().trim();
        const data = payload?.data || {};
        const reference = data.reference || data.id;
        const gatewayStatus = String(data.status || '').toLowerCase().trim();

        console.log(`[Paystack Webhook Details] Event: ${event}, Reference: ${reference}, Status: ${gatewayStatus}`);

        if (event === 'charge.success' && (gatewayStatus === 'success' || gatewayStatus === 'paid')) {
            if (reference) {
                // Currency validation: GHS only
                const currency = (data.currency || 'GHS').toUpperCase();
                if (currency !== 'GHS') {
                    console.warn(`[Paystack Webhook Warning] Webhook reference ${reference} has invalid currency: ${currency}`);
                    return res.status(400).json({ status: false, message: 'Invalid currency' });
                }

                const amountInGHS = Number(data.amount) / 100;
                const resolved = await resolveOrderDocByReference(String(reference));
                const resolvedId = resolved.docId || String(reference);
                const existingOrder = resolved.data;

                // Idempotency: skip if already paid / processing / accepted / delivered / completed
                if (isProtectedPaidOrFulfilledState(existingOrder)) {
                    console.log(`[Paystack Webhook] Order ${resolvedId} was already verified/fulfilled (${existingOrder?.status}).`);
                    if (existingOrder) {
                        await creditReferralIfEligible(resolvedId, existingOrder);
                    }
                    return res.status(200).json({ status: true, message: 'Already fulfilled' });
                }

                // Amount validation: strictly reject underpayment
                if (existingOrder && existingOrder.amount != null) {
                    const expectedAmount = Number(existingOrder.amount);
                    if (expectedAmount > 0 && amountInGHS < expectedAmount - 0.05) {
                        console.warn(`[Paystack Webhook Security Alert] Underpayment on reference ${reference}: paid ${amountInGHS}, expected ${expectedAmount}`);
                        await updateFirestoreDoc('orders', resolvedId, {
                            paymentStatus: 'underpaid',
                            status: 'failed',
                            amountPaid: amountInGHS,
                            failureReason: `Underpayment: paid ${amountInGHS} GHS, expected ${expectedAmount} GHS`,
                            updatedAt: AdminFieldValue.serverTimestamp()
                        });
                        return res.status(400).json({ status: false, message: 'Underpayment rejected' });
                    }
                }

                const resolvedPaymentMethod = existingOrder?.paymentMethod === 'momo' ? 'momo' : (existingOrder?.paymentMethod || "Paystack");
                await updateFirestoreOrderPaymentStatus(resolvedId, "success", {
                    payment_provider: "paystack",
                    paymentMethod: resolvedPaymentMethod,
                    paymentReference: String(reference),
                    amountPaid: amountInGHS,
                    paidAt: existingOrder?.paidAt || AdminFieldValue.serverTimestamp(),
                    verifiedByWebhook: true,
                });

                if (existingOrder) {
                    await creditReferralIfEligible(resolvedId, existingOrder);
                }

                console.log(`[Paystack Webhook Success] Processed charge.success for ${resolvedId}`);
            }
        } else if (event === 'charge.abandoned' || gatewayStatus === 'abandoned') {
            if (reference) {
                const resolved = await resolveOrderDocByReference(String(reference));
                const resolvedId = resolved.docId || String(reference);
                if (isProtectedPaidOrFulfilledState(resolved.data)) {
                    console.warn(`[Paystack Webhook Guard] Ignoring abandoned event for already paid/fulfilled order ${resolvedId}`);
                } else {
                    await updateFirestoreOrderPaymentStatus(resolvedId, "cancelled", {
                        cancellationReason: data.gateway_response || 'Payment abandoned in checkout'
                    });
                    console.log(`[Paystack Webhook Cancelled] Processed abandoned checkout for ${resolvedId}`);
                }
            }
        } else if (event === 'charge.failed' || gatewayStatus === 'failed' || gatewayStatus === 'reversed') {
            if (reference) {
                const resolved = await resolveOrderDocByReference(String(reference));
                const resolvedId = resolved.docId || String(reference);
                if (isProtectedPaidOrFulfilledState(resolved.data)) {
                    console.warn(`[Paystack Webhook Guard] Ignoring delayed charge.failed for already paid/fulfilled order ${resolvedId}`);
                } else {
                    await updateFirestoreOrderPaymentStatus(resolvedId, "failed", {
                        failureReason: data.gateway_response || payload?.message || 'Paystack charge.failed'
                    });
                    console.log(`[Paystack Webhook Failed] Processed charge.failed for ${resolvedId}`);
                }
            }
        }

        return res.status(200).json({ status: true, message: 'Webhook processed' });
    } catch (err: any) {
        console.error('[Paystack Webhook Exception]:', err.message || err);
        return respondWithServerError(res, err, 'Internal webhook error');
    }
});

// ============================================================================
// MIGRATED SECURE STOREFRONT & ACCOUNT ENDPOINTS (Firebase Admin SDK)
// ============================================================================

// 1. Confirm Manual MoMo Payment (Token OR Authenticated Owner)
app.post('/api/orders/:orderId/momo-confirm', async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'orderId is required' });
        }

        const orderSnap = await getFirestoreDoc('orders', orderId);
        if (!orderSnap || !orderSnap.exists) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const data = orderSnap.data();
        const token = String(req.body?.orderAccessToken || req.headers['x-order-token'] || req.query?.token || '').trim();
        const isAuthorizedByToken = Boolean(token && data.orderAccessToken && token === data.orderAccessToken);
        const authUser = !isAuthorizedByToken ? await verifyRequestUser(req) : null;
        const isAuthorizedOwner = Boolean(
            authUser && (
                data.userId === authUser.uid ||
                (authUser.email && data.email && String(data.email).toLowerCase().trim() === authUser.email.toLowerCase().trim())
            )
        );

        if (!isAuthorizedByToken && !isAuthorizedOwner) {
            return res.status(403).json({ success: false, error: 'Unauthorized to confirm this order' });
        }

        const currentStatus = String(data.status || '').toLowerCase().trim();
        if (!['pending', 'pending_verification'].includes(currentStatus)) {
            return res.status(409).json({
                success: false,
                error: 'Order is no longer awaiting payment confirmation'
            });
        }

        const momoTransactionId = typeof req.body?.momoTransactionId === 'string'
            ? req.body.momoTransactionId.trim().slice(0, 64)
            : '';

        await updateFirestoreDoc('orders', orderId, {
            momoSentClicked: true,
            userConfirmedAt: AdminFieldValue.serverTimestamp(),
            ...(momoTransactionId ? { momoTransactionId } : {}),
            updatedAt: AdminFieldValue.serverTimestamp(),
        });

        return res.status(200).json({ success: true, orderId });
    } catch (err: any) {
        console.error('[MoMo Confirm Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to confirm MoMo payment');
    }
});

// 2. MTN Airtime Order Creation (Authenticated, Authoritative Pricing)
const MTN_AIRTIME_PREFIXES = new Set(['024', '025', '053', '054', '055', '059']);
app.post('/api/airtime/orders', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to purchase airtime.' });
        }

        const canonicalPhone = normalizeGhanaPhone(req.body?.recipientPhone);
        if (!canonicalPhone || !MTN_AIRTIME_PREFIXES.has(canonicalPhone.slice(0, 3))) {
            return res.status(400).json({
                success: false,
                error: 'Airtime is available exclusively for valid 10-digit MTN numbers (024, 025, 053, 054, 055, 059).'
            });
        }

        const airtimeAmount = Number(req.body?.airtimeAmount);
        if (!Number.isFinite(airtimeAmount) || airtimeAmount < 1) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid airtime amount of at least GH₵1.00.'
            });
        }

        let airtimeSettings: any = { enabled: true, serviceCharge: 1.00 };
        const airtimeSettingsSnap = await getFirestoreDoc('settings', 'airtime');
        if (airtimeSettingsSnap && airtimeSettingsSnap.exists) {
            airtimeSettings = { ...airtimeSettings, ...airtimeSettingsSnap.data() };
        }
        if (airtimeSettings.enabled === false) {
            return res.status(400).json({
                success: false,
                error: 'Airtime service is currently unavailable. Please check back shortly.'
            });
        }

        const serviceCharge = typeof airtimeSettings.serviceCharge === 'number' && airtimeSettings.serviceCharge >= 0
            ? Number(airtimeSettings.serviceCharge)
            : 1.00;
        const authoritativeTotalGHS = Number((airtimeAmount + serviceCharge).toFixed(2));

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const customerEmail = authUser.email || userData?.email || `${canonicalPhone}@customer.dataghananow.site`;
        const customerName = userData?.fullName || userData?.displayName || `Customer (${canonicalPhone})`;

        const orderId = `DGN-AIRTIME-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
        const orderAccessToken = crypto.randomBytes(32).toString('hex');

        const orderPayload = {
            id: orderId,
            orderId,
            reference: orderId,
            referenceCode: orderId,
            paystackReference: orderId,
            orderAccessToken,
            userId: authUser.uid,
            customerId: authUser.uid,
            customerName,
            email: customerEmail,
            customerEmail,
            phone: canonicalPhone,
            customerPhone: canonicalPhone,
            recipientPhone: canonicalPhone,
            network: 'MTN',
            recipientNetwork: 'MTN',
            bundle: `MTN Airtime - GH₵${airtimeAmount.toFixed(2)}`,
            bundleName: `MTN Airtime - GH₵${airtimeAmount.toFixed(2)}`,
            category: 'Airtime',
            serviceType: 'airtime',
            airtimeAmount,
            serviceFee: serviceCharge,
            amount: authoritativeTotalGHS,
            amountSent: authoritativeTotalGHS,
            currency: 'GHS',
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'Paystack',
            payment_provider: 'paystack',
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        await setFirestoreDoc('orders', orderId, orderPayload, false);

        return res.status(200).json({
            success: true,
            orderId,
            reference: orderId,
            orderAccessToken,
            amount: authoritativeTotalGHS,
            airtimeAmount,
            serviceFee: serviceCharge,
            customerEmail,
            customerName,
            recipientPhone: canonicalPhone,
        });
    } catch (err: any) {
        console.error('[Airtime Order Create Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to create airtime order');
    }
});

// 3. Results Checker Order Creation (Authenticated, Authoritative Pricing + Hidden Charges + Agent Context)
app.post('/api/result-checker/orders', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to purchase Results Checker.' });
        }

        const examType = String(req.body?.examType || '').trim().toUpperCase();
        if (!['WASSCE', 'BECE', 'NOVDEC'].includes(examType)) {
            return res.status(400).json({ success: false, error: 'Invalid exam type.' });
        }

        const quantity = Math.floor(Number(req.body?.quantity));
        if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
            return res.status(400).json({ success: false, error: 'Please select a valid quantity (1 - 100).' });
        }

        const phoneClean = String(req.body?.phone || '').replace(/\s+/g, '').replace(/[^0-9]/g, '');
        if (!/^\d{10,15}$/.test(phoneClean)) {
            return res.status(400).json({ success: false, error: 'Please enter a valid mobile number (10 - 15 digits).' });
        }

        const paymentMethod = req.body?.paymentMethod === 'momo_direct' ? 'momo_direct' : 'paystack';
        const agentContextId = req.body?.agentContextId ? String(req.body.agentContextId).trim() : '';

        // Read authoritative settings/results_checker
        const rcSnap = await getFirestoreDoc('settings', 'results_checker');
        const rcData = rcSnap && rcSnap.exists ? rcSnap.data() : {};
        const isOutOfStock = rcData.inStock === false || rcData.isOutOfStock === true || rcData.outOfStock === true;
        if (isOutOfStock) {
            return res.status(400).json({ success: false, error: 'WAEC Results Checker is currently out of stock.' });
        }

        const rcWholesalePrice = typeof rcData.wholesalePrice === 'number' ? Number(rcData.wholesalePrice) : 19;
        const retailUnitPrice = typeof rcData.pricePerChecker === 'number' ? Number(rcData.pricePerChecker) : 25;

        // Hidden charges
        const hcSnap = await getFirestoreDoc('settings', 'hidden_charges');
        const hcData = hcSnap && hcSnap.exists ? hcSnap.data() : {};
        const agentStoreCharge = typeof hcData.agentStoreCharge === 'number' ? Number(hcData.agentStoreCharge) : 0;
        const retailRCCharge = typeof hcData.retailResultsCheckerCharge === 'number'
            ? Number(hcData.retailResultsCheckerCharge)
            : (typeof hcData.resultsCheckerCharge === 'number' ? Number(hcData.resultsCheckerCharge) : 0);
        const wholesaleRCCharge = typeof hcData.wholesaleResultsCheckerCharge === 'number'
            ? Number(hcData.wholesaleResultsCheckerCharge)
            : 0;

        // Check agent context or user's own agent status
        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const isAgentUser = Boolean(userData?.isAgent);

        let agentDoc: any = null;
        if (agentContextId) {
            const agentSnap = await getFirestoreDoc('agents', agentContextId);
            if (agentSnap && agentSnap.exists) {
                agentDoc = { id: agentSnap.id, ...agentSnap.data() };
            }
        }

        let unitPrice = retailUnitPrice;
        if (agentDoc) {
            const customAgentRcPrice = agentDoc.prices?.results_checker;
            unitPrice = (typeof customAgentRcPrice === 'number' && customAgentRcPrice >= rcWholesalePrice)
                ? Number(customAgentRcPrice)
                : rcWholesalePrice;
        } else if (isAgentUser) {
            unitPrice = rcWholesalePrice;
        }

        const isWholesaleRC = Boolean(agentDoc || isAgentUser);
        const unitSurcharge = isWholesaleRC ? wholesaleRCCharge : retailRCCharge;
        const baseTotal = Number((quantity * unitPrice).toFixed(2));
        const rcSurcharge = Number((unitSurcharge * quantity).toFixed(2));
        const agentStoreSurcharge = agentDoc ? agentStoreCharge : 0;
        const finalAmountToCharge = Number((baseTotal + rcSurcharge + agentStoreSurcharge).toFixed(2));

        const customerEmail = authUser.email || userData?.email || (phoneClean ? `${phoneClean}@customer.dataghananow.com` : 'customer@dataghananow.com');
        const customerName = userData?.fullName || userData?.displayName || (phoneClean ? `Customer (${phoneClean})` : 'Royal Customer');
        const momoNumber = agentDoc?.momo_number ? String(agentDoc.momo_number).trim() : '0535884851';

        const orderId = serverFirestoreOps.generateDocId('orders');
        const orderAccessToken = crypto.randomBytes(32).toString('hex');
        const isMoMo = paymentMethod === 'momo_direct';

        const profitOwnerId = agentDoc ? agentDoc.id : (isAgentUser ? authUser.uid : null);
        const profitOwnerName = agentDoc ? (agentDoc.agent_name || 'Agent') : (isAgentUser ? customerName : null);

        const orderData: any = {
            id: orderId,
            orderAccessToken,
            email: customerEmail,
            serviceType: 'Results Checker',
            examType,
            quantity,
            amount: isMoMo ? baseTotal : finalAmountToCharge,
            basePrice: baseTotal,
            hiddenFee: isMoMo ? 0 : Number((rcSurcharge + agentStoreSurcharge).toFixed(2)),
            customerPhone: phoneClean,
            phone: phoneClean,
            network: 'Result Checker',
            bundle: `Results Checker (${examType}) x${quantity}`,
            status: isMoMo ? 'pending_verification' : 'pending',
            paymentStatus: isMoMo ? 'pending_verification' : 'pending',
            paymentMethod,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
            userId: authUser.uid,
            customerName,
            reference: isMoMo ? phoneClean : orderId,
            ...(isMoMo ? { momoRefCode: phoneClean, momoNumber } : {}),
            ...(isAgentUser ? { isAgentOrder: true } : {}),
            ...(profitOwnerId ? {
                agentId: profitOwnerId,
                agent_id: profitOwnerId,
                agentName: profitOwnerName,
                agent_name: profitOwnerName,
                wholesalePrice: Number((rcWholesalePrice * quantity).toFixed(2)),
                wholesale_price: Number((rcWholesalePrice * quantity).toFixed(2)),
                agentPrice: baseTotal,
                agent_price: baseTotal,
                profit: Math.max(0, Number(((unitPrice - rcWholesalePrice) * quantity).toFixed(2))),
                agent_profit: Math.max(0, Number(((unitPrice - rcWholesalePrice) * quantity).toFixed(2))),
                profit_credited: false,
                profitAwarded: false,
            } : {})
        };

        await setFirestoreDoc('orders', orderId, orderData, false);

        if (agentDoc) {
            await setFirestoreDoc('agent_orders', orderId, {
                id: orderId,
                agent_id: agentDoc.id,
                customer_details: {
                    name: customerName,
                    email: customerEmail,
                    phone: phoneClean,
                    network: 'Result Checker',
                },
                wholesale_price: Number((rcWholesalePrice * quantity).toFixed(2)),
                agent_price: baseTotal,
                profit: Math.max(0, Number(((unitPrice - rcWholesalePrice) * quantity).toFixed(2))),
                status: isMoMo ? 'pending_verification' : 'pending',
                created_at: AdminFieldValue.serverTimestamp(),
                paymentReference: isMoMo ? phoneClean : orderId,
            }, false);
        }

        return res.status(200).json({
            success: true,
            orderId,
            reference: isMoMo ? phoneClean : orderId,
            orderAccessToken,
            amount: isMoMo ? baseTotal : finalAmountToCharge,
            baseTotal,
            customerEmail,
            customerName,
            momoNumber,
        });
    } catch (err: any) {
        console.error('[Result Checker Order Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to create Results Checker order');
    }
});

// 4. eFootball Coins Order Creation (Authenticated, Authoritative Product Pricing)
app.post('/api/efootball/orders', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to order eFootball Coins.' });
        }

        const productId = String(req.body?.productId || '').trim();
        const accountIdentifier = String(req.body?.accountIdentifier || '').trim();
        if (!productId || accountIdentifier.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Valid productId and accountIdentifier are required.'
            });
        }

        const productSnap = await getFirestoreDoc('efootballProducts', productId);
        if (!productSnap || !productSnap.exists) {
            return res.status(404).json({ success: false, error: 'eFootball package not found.' });
        }

        const product = productSnap.data();
        if (product.active === false) {
            return res.status(400).json({ success: false, error: 'This eFootball package is currently unavailable.' });
        }

        const authoritativeAmount = Number(product.price);
        if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid package price configuration.' });
        }

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const userEmail = authUser.email || userData?.email || userData?.gmail || '';
        if (!userEmail) {
            return res.status(400).json({ success: false, error: 'Account email is required.' });
        }

        const userName = userData?.fullName || userData?.username || 'Customer';
        const customerPhone = String(req.body?.customerPhone || userData?.phone || userData?.phoneNumber || '').trim();

        const rawPlatform = String(req.body?.platform || product.platformLabel || product.platform || 'Android');
        const normalizedPlatform = /ios/i.test(rawPlatform) ? 'iOS' : (/steam/i.test(rawPlatform) ? 'Steam' : 'Android');
        const isEmailType = accountIdentifier.includes('@') && accountIdentifier.includes('.');
        const accountIdentifierType = isEmailType ? 'email' : 'konami_id';

        const orderId = `EF-${crypto.randomInt(10000, 99999)}`;
        const reference = `EF_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const orderPayload = {
            id: reference,
            orderId,
            customerId: authUser.uid,
            userId: authUser.uid,
            customerName: userName,
            customerEmail: userEmail,
            email: userEmail,
            customerPhone,
            phone: customerPhone,
            productId: productSnap.id,
            productName: product.name || 'eFootball Coins',
            bundle: `${product.name || 'eFootball Coins'} (${normalizedPlatform})`,
            bundleName: product.name || 'eFootball Coins',
            coinAmount: Number(product.coinAmount || 0),
            platform: normalizedPlatform,
            accountIdentifier,
            accountIdentifierType,
            konamiId: accountIdentifier,
            amount: authoritativeAmount,
            currency: product.currency || 'GHS',
            paymentStatus: 'PAYMENT_PENDING',
            fulfillmentStatus: 'AWAITING_FULFILLMENT',
            adminStatus: 'AWAITING_FULFILLMENT',
            status: 'pending',
            serviceType: 'efootball',
            network: 'Game Coins',
            category: 'eFootball Coins',
            paystackReference: reference,
            reference,
            paymentMethod: 'Paystack',
            payment_provider: 'paystack',
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
            paidAt: null,
            acceptedAt: null,
            acceptedBy: null,
            deliveredAt: null,
            deliveredBy: null,
            deliveryNote: null,
        };

        await Promise.all([
            setFirestoreDoc('efootballOrders', reference, orderPayload, false),
            setFirestoreDoc('orders', reference, orderPayload, false),
        ]);

        return res.status(200).json({
            success: true,
            orderId,
            reference,
            amount: authoritativeAmount,
            currency: product.currency || 'GHS',
            productName: product.name || 'eFootball Coins',
            coinAmount: Number(product.coinAmount || 0),
            platform: normalizedPlatform,
            accountIdentifier,
            accountIdentifierType,
            customerEmail: userEmail,
            customerName: userName,
            customerPhone,
        });
    } catch (err: any) {
        console.error('[eFootball Order Create Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to create eFootball order');
    }
});

// 5. Mark eFootball Order Initialization Failed (Owner Only + Paid Guard)
app.post('/api/efootball/orders/:orderId/init-failed', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'orderId is required' });
        }

        const efSnap = await getFirestoreDoc('efootballOrders', orderId);
        const ordSnap = await getFirestoreDoc('orders', orderId);
        const targetData = (efSnap && efSnap.exists ? efSnap.data() : null) || (ordSnap && ordSnap.exists ? ordSnap.data() : null);

        if (!targetData) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        if (targetData.userId !== authUser.uid && targetData.customerId !== authUser.uid) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        if (isProtectedPaidOrFulfilledState(targetData)) {
            return res.status(409).json({ success: false, error: 'Cannot mark a paid or fulfilled order as failed' });
        }

        const failUpdate = {
            paymentStatus: 'PAYMENT_INITIALIZATION_FAILED',
            status: 'failed',
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        if (efSnap && efSnap.exists) {
            await updateFirestoreDoc('efootballOrders', orderId, failUpdate);
        }
        if (ordSnap && ordSnap.exists) {
            await updateFirestoreDoc('orders', orderId, failUpdate);
        }

        return res.status(200).json({ success: true, orderId });
    } catch (err: any) {
        console.error('[eFootball Init Failed Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to update initialization status');
    }
});

// Helper to parse expiry timestamps for booking codes
function isBookingCodeExpired(expiresAt: any): boolean {
    if (!expiresAt) return false;
    let expiryMs = 0;
    if (typeof expiresAt === 'number') expiryMs = expiresAt;
    else if (typeof expiresAt?.toMillis === 'function') expiryMs = expiresAt.toMillis();
    else if (typeof expiresAt?.seconds === 'number') expiryMs = expiresAt.seconds * 1000;
    else if (typeof expiresAt === 'string') {
        const parsed = Date.parse(expiresAt);
        if (!isNaN(parsed)) expiryMs = parsed;
    } else if (expiresAt instanceof Date) {
        expiryMs = expiresAt.getTime();
    }
    return expiryMs > 0 && expiryMs <= Date.now();
}

// 6. Paid Booking Code Order Creation (Authenticated, Never Reveals Code Before Payment)
app.post('/api/booking-codes/create-order', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to purchase booking codes.' });
        }

        const bookingCodeId = String(req.body?.bookingCodeId || '').trim();
        if (!bookingCodeId) {
            return res.status(400).json({ success: false, error: 'bookingCodeId is required.' });
        }

        const bcSnap = await getFirestoreDoc('booking_codes', bookingCodeId);
        if (!bcSnap || !bcSnap.exists) {
            return res.status(404).json({ success: false, error: 'Booking code not found.' });
        }

        const bc = bcSnap.data();
        if (bc.active === false) {
            return res.status(400).json({ success: false, error: 'This booking code is no longer active.' });
        }
        if (isBookingCodeExpired(bc.expiresAt)) {
            return res.status(400).json({ success: false, error: 'This booking code has expired.' });
        }

        const authoritativePrice = Number(bc.price);
        if (!Number.isFinite(authoritativePrice) || authoritativePrice <= 0) {
            return res.status(400).json({ success: false, error: 'Free booking codes should use the free claim endpoint.' });
        }

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const providedEmail = String(req.body?.email || '').trim();
        const emailToUse = (providedEmail && providedEmail.includes('@')) ? providedEmail : (authUser.email || userData?.email || '');
        if (!emailToUse) {
            return res.status(400).json({ success: false, error: 'A valid email address is required.' });
        }
        const phoneToUse = String(req.body?.phone || userData?.phoneNumber || userData?.phone || '').trim();
        const customerName = userData?.fullName || (phoneToUse ? `Customer (${phoneToUse})` : 'Royal Customer');

        const orderRefId = `BC_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const bookingOrderPayload = {
            id: orderRefId,
            orderId: orderRefId,
            reference: orderRefId,
            userId: authUser.uid,
            customerName,
            customerEmail: emailToUse,
            email: emailToUse,
            customerPhone: phoneToUse,
            phone: phoneToUse,
            bundle: `VIP BOOKING CODE: ${bc.title || bc.bookmaker} (${bc.bookmaker} ${Number(bc.odds || 1).toFixed(2)}x)`,
            bundleName: bc.title || `${bc.bookmaker || 'SportyBet'} VIP Code`,
            serviceType: 'Booking Codes',
            network: 'Booking Codes',
            bookmaker: bc.bookmaker || 'SportyBet',
            odds: Number(bc.odds) || 1.0,
            amount: authoritativePrice,
            price: authoritativePrice,
            bookingCodeId: bcSnap.id,
            bookingCodeTitle: bc.title || 'VIP Booking Code',
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'Paystack',
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        await Promise.all([
            setFirestoreDoc('orders', orderRefId, bookingOrderPayload, false),
            setFirestoreDoc('booking_code_purchases', orderRefId, {
                id: orderRefId,
                bookingCodeId: bcSnap.id,
                userId: authUser.uid,
                customerName,
                customerEmail: emailToUse,
                customerPhone: phoneToUse,
                title: bc.title || 'VIP Booking Code',
                bookmaker: bc.bookmaker || 'SportyBet',
                code: 'Pending Payment ⏳',
                odds: Number(bc.odds) || 1.0,
                price: authoritativePrice,
                paymentMethod: 'Paystack',
                paymentReference: orderRefId,
                status: 'pending',
                createdAt: AdminFieldValue.serverTimestamp(),
                updatedAt: AdminFieldValue.serverTimestamp(),
            }, false),
            setFirestoreDoc('booking_code_orders', orderRefId, bookingOrderPayload, false),
        ]);

        return res.status(200).json({
            success: true,
            reference: orderRefId,
            orderId: orderRefId,
            amount: authoritativePrice,
            title: bc.title || 'VIP Booking Code',
            bookmaker: bc.bookmaker || 'SportyBet',
            odds: Number(bc.odds) || 1.0,
            customerEmail: emailToUse,
        });
    } catch (err: any) {
        console.error('[Booking Code Create Order Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to create booking code order');
    }
});

// 7. Free Booking Code Claim (Authenticated, Strictly Verifies price <= 0)
app.post('/api/booking-codes/free-claim', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to claim free booking codes.' });
        }

        const bookingCodeId = String(req.body?.bookingCodeId || '').trim();
        if (!bookingCodeId) {
            return res.status(400).json({ success: false, error: 'bookingCodeId is required.' });
        }

        const bcSnap = await getFirestoreDoc('booking_codes', bookingCodeId);
        if (!bcSnap || !bcSnap.exists) {
            return res.status(404).json({ success: false, error: 'Booking code not found.' });
        }

        const bc = bcSnap.data();
        if (bc.active === false) {
            return res.status(400).json({ success: false, error: 'This booking code is no longer active.' });
        }
        if (isBookingCodeExpired(bc.expiresAt)) {
            return res.status(400).json({ success: false, error: 'This booking code has expired.' });
        }
        if (Number(bc.price) > 0) {
            return res.status(400).json({ success: false, error: 'This booking code requires payment.' });
        }

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const providedEmail = String(req.body?.email || '').trim();
        const emailToUse = (providedEmail && providedEmail.includes('@')) ? providedEmail : (authUser.email || userData?.email || '');
        const phoneToUse = String(req.body?.phone || userData?.phoneNumber || userData?.phone || '').trim();
        const customerName = userData?.fullName || (phoneToUse ? `Customer (${phoneToUse})` : 'Royal Customer');

        const orderRefId = `BC_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const freeOrderPayload = {
            id: orderRefId,
            orderId: orderRefId,
            reference: orderRefId,
            userId: authUser.uid,
            customerName,
            customerEmail: emailToUse,
            email: emailToUse,
            customerPhone: phoneToUse,
            phone: phoneToUse,
            bundle: `FREE VIP BOOKING CODE: ${bc.title || bc.bookmaker} (${bc.bookmaker} ${Number(bc.odds || 1).toFixed(2)}x)`,
            bundleName: bc.title || `${bc.bookmaker || 'SportyBet'} VIP Code`,
            serviceType: 'Booking Codes',
            network: 'Booking Codes',
            bookmaker: bc.bookmaker || 'SportyBet',
            odds: Number(bc.odds) || 1.0,
            amount: 0,
            price: 0,
            bookingCodeId: bcSnap.id,
            bookingCodeTitle: bc.title || 'VIP Booking Code',
            code: bc.code || '',
            status: 'completed',
            paymentStatus: 'success',
            paymentMethod: 'Free Claim',
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        await Promise.all([
            setFirestoreDoc('orders', orderRefId, freeOrderPayload, false),
            setFirestoreDoc('booking_code_purchases', orderRefId, {
                id: orderRefId,
                bookingCodeId: bcSnap.id,
                userId: authUser.uid,
                customerName,
                customerEmail: emailToUse,
                customerPhone: phoneToUse,
                title: bc.title || 'VIP Booking Code',
                bookmaker: bc.bookmaker || 'SportyBet',
                code: bc.code || '',
                odds: Number(bc.odds) || 1.0,
                price: 0,
                paymentMethod: 'Free Claim',
                paymentReference: orderRefId,
                status: 'completed',
                createdAt: AdminFieldValue.serverTimestamp(),
                updatedAt: AdminFieldValue.serverTimestamp(),
            }, false),
            setFirestoreDoc('booking_code_orders', orderRefId, freeOrderPayload, false),
        ]);

        await incrementBookingCodePurchases(bcSnap.id).catch(() => {});

        return res.status(200).json({
            success: true,
            reference: orderRefId,
            bookingCode: {
                id: bcSnap.id,
                code: bc.code || '',
                title: bc.title || 'VIP Booking Code',
                bookmaker: bc.bookmaker || 'SportyBet',
                odds: Number(bc.odds) || 1.0,
                price: 0,
                description: bc.description || '',
            }
        });
    } catch (err: any) {
        console.error('[Free Booking Code Claim Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to claim free booking code');
    }
});

// 8. Agent Access Unlock Order / Free Unlock (Authenticated, Authoritative settings/agent_store)
app.post('/api/agent/unlock-order', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to unlock agent access.' });
        }

        const settingSnap = await getFirestoreDoc('settings', 'agent_store');
        const settingData = settingSnap && settingSnap.exists ? settingSnap.data() : {};
        const priceToPay = typeof settingData.price === 'number' && !isNaN(settingData.price) ? Number(settingData.price) : 50;

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const customerEmail = authUser.email || userData?.email || 'customer@dataghananow.com';
        const customerName = userData?.fullName || 'Aspiring Agent';

        if (priceToPay <= 0) {
            await setFirestoreDoc('users', authUser.uid, {
                isAgent: true,
                updatedAt: AdminFieldValue.serverTimestamp(),
            }, true);
            return res.status(200).json({
                success: true,
                freeUnlocked: true,
                price: 0,
            });
        }

        const orderId = serverFirestoreOps.generateDocId('orders');
        const orderAccessToken = crypto.randomBytes(32).toString('hex');

        await setFirestoreDoc('orders', orderId, {
            id: orderId,
            orderAccessToken,
            email: customerEmail,
            phone: userData?.phoneNumber || userData?.phone || '0000000000',
            network: 'SYSTEM',
            bundle: 'AGENT ACCESS UNLOCK',
            amount: priceToPay,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'paystack',
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
            userId: authUser.uid,
            customerName,
            reference: orderId,
            isAgentOrder: true,
            agentId: authUser.uid,
            agent_id: authUser.uid,
            agentName: customerName,
            agent_name: customerName,
        }, false);

        return res.status(200).json({
            success: true,
            freeUnlocked: false,
            orderId,
            reference: orderId,
            orderAccessToken,
            amount: priceToPay,
            customerEmail,
            customerName,
        });
    } catch (err: any) {
        console.error('[Agent Unlock Order Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to initiate agent access unlock');
    }
});

// 9. Agent Registration (Authenticated, Requires Paid Unlock or Free Agent Store)
app.post('/api/agent/register', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required for agent registration.' });
        }

        const agentName = String(req.body?.agentName || '').trim();
        const momoName = String(req.body?.momoName || '').trim();
        const momoNumber = String(req.body?.momoNumber || '').trim();

        if (!agentName || !momoName || !momoNumber) {
            return res.status(400).json({ success: false, error: 'All registration fields are required.' });
        }
        if (!/^0\d{9}$/.test(momoNumber)) {
            return res.status(400).json({ success: false, error: 'Mobile Money Number must be 10 digits starting with 0.' });
        }

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const settingSnap = await getFirestoreDoc('settings', 'agent_store');
        const settingData = settingSnap && settingSnap.exists ? settingSnap.data() : {};
        const storePrice = typeof settingData.price === 'number' && !isNaN(settingData.price) ? Number(settingData.price) : 50;

        if (!userData?.isAgent && storePrice > 0) {
            return res.status(403).json({
                success: false,
                error: 'Agent access must be unlocked before registering your store.'
            });
        }

        const existingAgent = await getFirestoreDoc('agents', authUser.uid);
        if (existingAgent && existingAgent.exists) {
            return res.status(200).json({
                success: true,
                alreadyRegistered: true,
                agent: existingAgent.data(),
            });
        }

        let baseSlug = agentName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        if (!baseSlug) {
            baseSlug = `agent-${authUser.uid.slice(0, 5).toLowerCase()}`;
        }

        let finalSlug = baseSlug;
        const slugTaken = await serverFirestoreOps.queryByField('agents', 'agent_slug', finalSlug);
        if (slugTaken && slugTaken.exists) {
            finalSlug = `${baseSlug}-${crypto.randomInt(100, 999)}`;
        }

        const agentRecord = {
            id: authUser.uid,
            agent_name: agentName,
            agent_slug: finalSlug,
            momo_name: momoName,
            momo_number: momoNumber,
            profit_balance: 0,
            created_at: AdminFieldValue.serverTimestamp(),
            prices: {},
        };

        await Promise.all([
            setFirestoreDoc('agents', authUser.uid, agentRecord, false),
            setFirestoreDoc('users', authUser.uid, {
                isAgent: true,
                updatedAt: AdminFieldValue.serverTimestamp(),
            }, true),
        ]);

        return res.status(201).json({
            success: true,
            agent: {
                id: authUser.uid,
                agent_name: agentName,
                agent_slug: finalSlug,
                momo_name: momoName,
                momo_number: momoNumber,
                profit_balance: 0,
            }
        });
    } catch (err: any) {
        console.error('[Agent Register Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to complete agent registration');
    }
});

// 10. Agent Order Report to Admin (Authenticated + Order Owner Verification)
app.post('/api/agent/report-order', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required to report an order.' });
        }

        const orderId = String(req.body?.orderId || '').trim();
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'orderId is required.' });
        }

        const orderSnap = await getFirestoreDoc('orders', orderId);
        if (!orderSnap || !orderSnap.exists) {
            return res.status(404).json({ success: false, error: 'Order not found.' });
        }

        const orderData = orderSnap.data();
        const isOrderAgentOwner = orderData.agentId === authUser.uid || orderData.agent_id === authUser.uid;
        if (!isOrderAgentOwner) {
            return res.status(403).json({ success: false, error: 'Unauthorized to report this order.' });
        }

        await updateFirestoreDoc('orders', orderId, {
            reportedToAdmin: true,
            agentReportReason: 'Reported directly to DATAGHANAnow via WhatsApp',
            reportedAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        });

        return res.status(200).json({ success: true, orderId });
    } catch (err: any) {
        console.error('[Agent Report Order Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to report order');
    }
});

// 11. Free Data Lucky Spin Winner Claim (Verifies Paystack when settings/free_data price > 0)
app.post('/api/free-data/claim', async (req, res) => {
    try {
        const clientIp = getClientIpKey(req);
        const ipLimit = checkRateLimit(`free_data_claim:${clientIp}`, 10, 10 * 60 * 1000);
        if (!ipLimit.allowed) {
            res.setHeader('Retry-After', String(ipLimit.retryAfterSec));
            return res.status(429).json({
                success: false,
                error: 'Too many claim requests. Please wait a few minutes and try again.'
            });
        }

        const authUser = await verifyRequestUser(req);
        const canonicalPhone = normalizeGhanaPhone(req.body?.phone);
        if (!canonicalPhone) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid Ghanaian phone number (e.g. 0241234567).'
            });
        }

        const rawNet = String(req.body?.network || 'MTN').trim();
        const normalizedNet = /telecel/i.test(rawNet)
            ? 'Telecel'
            : (/at|airteltigo/i.test(rawNet) ? (rawNet === 'AT' ? 'AT' : 'AirtelTigo') : 'MTN');

        const settingSnap = await getFirestoreDoc('settings', 'free_data');
        const settingData = settingSnap && settingSnap.exists ? settingSnap.data() : {};
        if (settingData.disabled === true) {
            return res.status(400).json({ success: false, error: 'Free Data promo is currently disabled.' });
        }

        const authoritativePrice = (settingData.price !== undefined && settingData.price !== null)
            ? Number(settingData.price)
            : 1;
        const rawPaymentRef = String(req.body?.paymentRef || '').trim();

        let claimDocId = '';
        let verifiedPaid = false;

        if (authoritativePrice > 0) {
            if (!rawPaymentRef) {
                return res.status(400).json({
                    success: false,
                    error: 'Verified Paystack payment reference is required for this spin entry.'
                });
            }

            // Prevent replay using same payment reference
            const existingClaim = await getFirestoreDoc('orders', rawPaymentRef);
            if (existingClaim && existingClaim.exists) {
                return res.status(409).json({
                    success: false,
                    error: 'This payment reference has already been claimed.'
                });
            }

            const verifyResult = await verifyPaystackReference(rawPaymentRef);
            if (verifyResult.transientError) {
                return res.status(503).json({
                    success: false,
                    retryable: true,
                    error: 'Payment verification temporarily delayed. Please retry shortly.'
                });
            }

            const psData = verifyResult.data || {};
            const psStatus = String(psData.status || '').toLowerCase().trim();
            const psCurrency = String(psData.currency || 'GHS').toUpperCase();
            const psAmountGHS = psData.amount ? Number(psData.amount) / 100 : 0;

            if (!verifyResult.status || !['success', 'paid'].includes(psStatus) || psCurrency !== 'GHS' || psAmountGHS < authoritativePrice - 0.01) {
                return res.status(400).json({
                    success: false,
                    error: 'Payment reference could not be verified for Free Data entry.'
                });
            }

            claimDocId = rawPaymentRef;
            verifiedPaid = true;
        } else {
            claimDocId = `FD_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        }

        const userSnap = authUser ? await getFirestoreDoc('users', authUser.uid) : null;
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        const customerEmail = authUser?.email || userData?.email || `${canonicalPhone}@customer.dataghananow.com`;
        const customerName = userData?.fullName || `Customer (${canonicalPhone})`;

        await setFirestoreDoc('orders', claimDocId, {
            id: claimDocId,
            reference: claimDocId,
            email: customerEmail,
            serviceType: 'Free Data Win',
            orderType: 'Free Data Win',
            isFreeDataWin: true,
            network: normalizedNet,
            bundle: `1GB ${normalizedNet} Free Data Win`,
            bundleName: `1GB ${normalizedNet} Free Data Win`,
            phone: canonicalPhone,
            amount: authoritativePrice > 0 ? authoritativePrice : 0,
            quantity: 1,
            status: verifiedPaid ? 'paid' : 'pending',
            paymentStatus: verifiedPaid ? 'success' : 'free_promo',
            paymentMethod: verifiedPaid ? 'paystack' : 'free_promo',
            ...(verifiedPaid ? { verifiedByBackend: true } : {}),
            customerName,
            userId: authUser ? authUser.uid : `guest_${canonicalPhone}`,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        }, false);

        return res.status(201).json({
            success: true,
            orderId: claimDocId,
            reference: claimDocId,
            verifiedPaid,
        });
    } catch (err: any) {
        console.error('[Free Data Claim Error]:', err.message || err);
        return respondWithServerError(res, err, 'Failed to submit Free Data claim');
    }
});

// 12. Ensure Personal Referral Code on Signed-In Profile (Authenticated)
app.post('/api/referrals/ensure-code', async (req, res) => {
    try {
        const authUser = await verifyRequestUser(req);
        if (!authUser) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const uidSuffix = authUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'VIP';
        const fallbackCode = `DGN-${uidSuffix}`;

        if (!adminDb) {
            return res.status(200).json({ success: true, referralCode: fallbackCode });
        }

        const userSnap = await getFirestoreDoc('users', authUser.uid);
        const userData = userSnap && userSnap.exists ? userSnap.data() : {};
        if (userData?.referralCode) {
            return res.status(200).json({ success: true, referralCode: String(userData.referralCode) });
        }

        let candidate = fallbackCode;
        const existingOwner = await serverFirestoreOps.queryByField('users', 'referralCode', candidate);
        if (existingOwner && existingOwner.exists && existingOwner.id !== authUser.uid) {
            candidate = `DGN-${uidSuffix}${crypto.randomBytes(1).toString('hex').toUpperCase()}`;
        }

        await setFirestoreDoc('users', authUser.uid, {
            referralCode: candidate,
            updatedAt: AdminFieldValue.serverTimestamp(),
        }, true);

        return res.status(200).json({ success: true, referralCode: candidate });
    } catch (err: any) {
        console.warn('[Ensure Referral Code Notice]:', err.message || err);
        const uidSuffix = 'VIP';
        return res.status(200).json({ success: true, referralCode: `DGN-${uidSuffix}` });
    }
});



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



// Explicit SEO & Authorization Endpoints
app.get('/sw.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    res.sendFile(swPath);
  } else {
    res.status(404).send('Service worker not found');
  }
});

app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const adsFilePath = path.join(process.cwd(), 'public', 'ads.txt');
  if (fs.existsSync(adsFilePath)) {
    res.sendFile(adsFilePath);
  } else {
    res.send('google.com, pub-8226724072918040, DIRECT, f08c47fec0942fa0\n');
  }
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    return res.sendFile(robotsPath);
  }

  res.send(`User-agent: *
Allow: /

# Private & Administrative Routes
Disallow: /admin
Disallow: /api/

# Sitemap Indexing
Sitemap: https://kingjdeals.site/sitemap.xml`);
});

// Explicit sitemap routes and trailing slash / extensionless redirects
app.get(['/sitemap', '/sitemap/'], (req, res) => {
  res.redirect(301, 'https://kingjdeals.site/sitemap.xml');
});

app.get(['/sitemap.xml', '/sitemap.xml/'], (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    return res.sendFile(sitemapPath);
  }

  const today = new Date().toISOString().split('T')[0];
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://kingjdeals.site/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Category Hubs -->
  <url>
    <loc>https://kingjdeals.site/data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/booking-codes</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/game-coins</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/pc-games</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/premium-apps</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Specific Service Pages -->
  <url>
    <loc>https://kingjdeals.site/mtn-data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/telecel-data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/airteltigo-data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/wassce-results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/bece-results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/novdec-results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/fc-mobile-points</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/pubg-mobile-uc</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/fc-26</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Informational and Policy Pages -->
  <url>
    <loc>https://kingjdeals.site/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/refund-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`);
});

function getValidApkPath(): { path: string; size: number; mtime: Date; filename: string } | null {
  const candidatePaths = [
    // Preferred current DataGhanaNow release APK
    path.join(process.cwd(), 'public', 'downloads', 'DATAGHANAnow.apk'),
    path.join(process.cwd(), 'dist', 'downloads', 'DATAGHANAnow.apk'),
    path.join(process.cwd(), 'downloads', 'DATAGHANAnow.apk'),
    path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'release', 'DATAGHANAnow.apk'),
    // Legacy King-J-Deals release APK for backward compatibility
    path.join(process.cwd(), 'public', 'downloads', 'King-J-Deals.apk'),
    path.join(process.cwd(), 'dist', 'downloads', 'King-J-Deals.apk'),
    path.join(process.cwd(), 'downloads', 'King-J-Deals.apk'),
    path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'release', 'King-J-Deals.apk'),
    path.join(process.cwd(), 'android', 'app', 'src', 'main', 'assets', 'public', 'downloads', 'King-J-Deals.apk'),
    path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  ];

  for (const apkPath of candidatePaths) {
    try {
      if (fs.existsSync(apkPath)) {
        const stat = fs.statSync(apkPath);
        // A valid APK must be an actual binary file of at least 100KB (typically 5MB - 35MB)
        if (stat.isFile() && stat.size > 100 * 1024) {
          // Verify ZIP magic bytes (0x50, 0x4B, 0x03, 0x04)
          const fd = fs.openSync(apkPath, 'r');
          const buffer = Buffer.alloc(4);
          fs.readSync(fd, buffer, 0, 4, 0);
          fs.closeSync(fd);
          if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
            return { path: apkPath, size: stat.size, mtime: stat.mtime, filename: path.basename(apkPath) };
          }
        }
      }
    } catch {
      // Continue checking next candidate
    }
  }
  return null;
}

// Direct APK Download Endpoint for DATAGHANAnow.apk and legacy King-J-Deals.apk
app.get([
  '/downloads/DATAGHANAnow.apk', 
  '/download/DATAGHANAnow.apk', 
  '/downloads/King-J-Deals.apk', 
  '/download/King-J-Deals.apk'
], (req, res) => {
  const reqUrl = req.path || '';
  const isLegacy = reqUrl.toLowerCase().includes('king-j-deals');
  const targetFilename = isLegacy ? 'King-J-Deals.apk' : 'DATAGHANAnow.apk';

  // Non-blocking log direct URL download
  try {
    const userAgent = req.get('user-agent') || '';
    const isAndroid = /android/i.test(userAgent);
    if (adminDb) {
      adminDb.collection('app_downloads').add({
        customerName: 'Direct Download / Browser Link',
        customerEmail: '',
        customerPhone: '',
        isRegisteredUser: false,
        deviceType: isAndroid ? 'android' : 'desktop',
        platform: isAndroid ? 'Android Mobile' : 'Desktop / Web Browser',
        userAgent: userAgent,
        source: 'direct_url_request',
        downloadUrl: `https://kingjdeals.site/downloads/${targetFilename}`,
        apkName: targetFilename,
        downloadedAt: AdminFieldValue.serverTimestamp()
      }).catch(() => {});
    }
  } catch (e) {
    // Non-blocking
  }

  const apkInfo = getValidApkPath();

  if (apkInfo) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${apkInfo.filename}"`);
    res.setHeader('Content-Length', apkInfo.size.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');

    return res.sendFile(apkInfo.path, {
      acceptRanges: true,
      cacheControl: false
    });
  }

  // Fallback response preventing delivery of corrupt/empty stubs that cause package parse errors
  res.status(404).json({
    success: false,
    error: `${targetFilename} release build is not yet deployed or is incomplete.`,
    expectedLocation: `public/downloads/${targetFilename}`,
    expectedFilename: targetFilename,
    downloadUrl: `/downloads/${targetFilename}`,
    instructions: `Please place your signed release APK in public/downloads/${targetFilename}.`
  });
});

// APK Status Endpoint to let frontend & administrators verify APK readiness and exact size
app.get('/api/apk-status', (req, res) => {
  const apkInfo = getValidApkPath();
  if (apkInfo) {
    const sizeMb = (apkInfo.size / (1024 * 1024)).toFixed(1);
    return res.json({
      available: true,
      filename: apkInfo.filename,
      downloadUrl: `/downloads/${apkInfo.filename}`,
      filePresent: true,
      sizeBytes: apkInfo.size,
      sizeFormatted: `${sizeMb} MB`,
      lastModified: apkInfo.mtime.toISOString(),
      path: apkInfo.path
    });
  }

  const primaryPath = path.join(process.cwd(), 'public', 'downloads', 'DATAGHANAnow.apk');
  const legacyPath = path.join(process.cwd(), 'public', 'downloads', 'King-J-Deals.apk');
  const fileExists = fs.existsSync(primaryPath) || fs.existsSync(legacyPath);
  const size = fileExists ? (fs.existsSync(primaryPath) ? fs.statSync(primaryPath).size : fs.statSync(legacyPath).size) : 0;
  const activeName = fs.existsSync(primaryPath) ? 'DATAGHANAnow.apk' : 'King-J-Deals.apk';

  return res.json({
    available: false,
    filename: activeName,
    downloadUrl: `/downloads/${activeName}`,
    filePresent: fileExists,
    sizeBytes: size,
    warning: fileExists && size < 100 * 1024
      ? `Detected file is only ${size} bytes (invalid/incomplete stub). An authentic Android APK is typically 5MB - 35MB.`
      : 'No release APK file detected.',
    expectedLocation: `public/downloads/${activeName}`
  });
});

// Cached Firestore bundle retrieval for SEO server-rendered HTML
let cachedSeoBundles: any[] = [];
let lastSeoBundleFetch = 0;
async function getLiveBundlesForSeo() {
  const now = Date.now();
  if (cachedSeoBundles.length > 0 && (now - lastSeoBundleFetch) < 30000) {
    return cachedSeoBundles;
  }
  try {
    if (!adminDb) return cachedSeoBundles;
    const snap = await adminDb.collection("bundles").get();
    cachedSeoBundles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    lastSeoBundleFetch = now;
  } catch (err: any) {
    console.warn("[SEO Server Bundles] Notice fetching live bundles:", err.message || err);
  }
  return cachedSeoBundles;
}

// React App Serving
async function startServer() {
  console.log("[Startup] Checking payment gateway configuration...");
  const hasPaystackSecret = Boolean(getPaystackSecretKey());
  const hasPaystackPublic = Boolean(getPaystackPublicKey());
  console.log(`[Startup] PAYSTACK_SECRET_KEY Configured: ${hasPaystackSecret ? "YES" : "NO"}`);
  console.log(`[Startup] PAYSTACK_PUBLIC_KEY Configured: ${hasPaystackPublic ? "YES" : "NO"}`);

  const isProd = process.env.NODE_ENV === "production" || (typeof __filename !== 'undefined' && __filename.includes('dist'));

  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    
    // SEO Routes Middleware in Development
    app.use(async (req, res, next) => {
      if (req.method !== 'GET') return next();
      const seo = getSeoPageData(req.path);
      if (!seo) return next();
      try {
        const indexPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf8');
          template = await vite.transformIndexHtml(req.url, template);
          const liveBundles = await getLiveBundlesForSeo();
          const html = renderSeoHtml(template, seo, liveBundles);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.status(200).send(html);
        }
      } catch (err) {
        console.warn("[Dev SEO Route Middleware Error]", err);
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const seo = getSeoPageData(req.path);
      const indexPath = path.join(distPath, 'index.html');
      const fileExists = fs.existsSync(indexPath);

      if (seo && fileExists) {
        try {
          const template = fs.readFileSync(indexPath, 'utf8');
          const liveBundles = await getLiveBundlesForSeo();
          const html = renderSeoHtml(template, seo, liveBundles);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.status(200).send(html);
        } catch (err) {
          console.error("[Prod SEO Serve Error]", err);
        }
      }

      if (!fileExists) {
        console.error("[Production HTML Fallback Error] dist/index.html missing at path:", indexPath);
        return res.status(503).json({
          success: false,
          error: "Service Unavailable: Application build output missing (dist/index.html). Please run 'npm run build'.",
          timestamp: new Date().toISOString()
        });
      }

      res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
          console.error("[Production HTML sendFile Error]", err);
          res.status(500).json({
            success: false,
            error: "Failed to serve application HTML",
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }
  app.listen(3000, "0.0.0.0", () => console.log('Server running on 3000'));
}

if (process.env.DATAGHANA_DISABLE_AUTOSTART !== '1') {
  startServer();
}

export {
  app,
  serverFirestoreOps,
  serverAuthOps,
  gatewayHttpClient,
  isProtectedPaidOrFulfilledState,
  resetRateLimits,
  sanitizeOrderForCustomerHistory,
  deriveSeparatedOrderStatuses
};
