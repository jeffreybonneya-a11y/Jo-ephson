import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    limit, 
    getDocs, 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Firestore 
} from 'firebase/firestore';
import axios from 'axios';

/**
 * NALO Solutions USSD Request Payload Structure
 * Handles parameter casing variations sent by Nalo's USSD gateway.
 */
export interface NaloUssdIncomingPayload {
    USERID?: string;
    userId?: string;
    userid?: string;

    MSISDN?: string;
    msisdn?: string;
    phoneNumber?: string;
    phone?: string;

    USERDATA?: string;
    userData?: string;
    userdata?: string;
    input?: string;
    text?: string;

    MSGTYPE?: boolean | number | string;
    msgType?: boolean | number | string;
    msgtype?: boolean | number | string;

    SESSIONID?: string;
    sessionId?: string;
    sessionid?: string;
    SESSION_ID?: string;

    NETWORK?: string;
    network?: string;

    SERVICECODE?: string;
    serviceCode?: string;
    servicecode?: string;
    SERVICE_CODE?: string;
}

/**
 * NALO Solutions USSD Response Structure
 * MSG: Message string displayed on the mobile subscriber's screen
 * MSGTYPE: boolean (true = Continue session [CON], false = End session [END])
 */
export interface NaloUssdResponsePayload {
    USERID: string;
    MSISDN: string;
    MSG: string;
    MSGTYPE: boolean;
}

/**
 * Active Bundle Representation for USSD
 */
export interface UssdBundleItem {
    id: string;
    name: string;
    dataAmount: string;
    price: number;
    network: string;
}

/**
 * Internal state representation for active USSD sessions
 */
interface UssdSessionState {
    sessionId: string;
    msisdn: string;
    screen: string;
    selectedNetwork?: string;
    bundlePage?: number;
    selectedBundle?: {
        bundleId: string;
        name: string;
        dataAmount: string;
        price: number;
        network: string;
        category?: string;
    };
    recipientPhone?: string;
    paymentNetwork?: string;
    paymentProvider?: 'mtn' | 'vod' | 'atl';
    paymentPhone?: string;
    createdOrderRef?: string;
    createdOrderId?: string;
    createdPrice?: number;
    data?: Record<string, any>;
    lastActive: number;

    // Game Coins specific fields
    gameCategory?: string;
    gameUserId?: string;
    gameUsername?: string;
}

/**
 * Paystack Ghana Mobile Money Charge Response
 */
export interface PaystackChargeResult {
    success: boolean;
    reference: string;
    status: string;
    displayText?: string;
    message?: string;
}

/**
 * Safely resolves the Paystack Secret Key from environment or explicit parameter
 */
export function getUssdPaystackSecretKey(explicitKey?: string): string {
    if (explicitKey && explicitKey.trim()) {
        return explicitKey.trim();
    }
    const rawKey = process.env.PAYSTACK_SECRET_KEY || 
        process.env.PAYSTACK_SECRET || 
        process.env.PAYSTACK_SECRET_KEY_LIVE || 
        process.env.PAYSTACK_SECRET_KEY_TEST || 
        process.env.PAYSTACK_KEY ||
        process.env.VITE_PAYSTACK_SECRET_KEY || "";
    let key = rawKey.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1).trim();
    }
    return key;
}

/**
 * Initiates a Ghana Mobile Money Charge via Paystack's server-side /charge API
 * Supported Ghana Mobile Money providers:
 * - MTN Mobile Money: "mtn"
 * - Telecel Cash: "vod"
 * - AirtelTigo Money: "atl"
 */
export async function initiatePaystackMomoCharge(params: {
    secretKey: string;
    reference: string;
    amountGhs: number;
    paymentPhone: string;
    provider: 'mtn' | 'vod' | 'atl';
    recipientPhone: string;
    network: string;
    paymentNetwork: string;
    bundleName: string;
    sessionId: string;
}): Promise<PaystackChargeResult> {
    const key = params.secretKey;
    if (!key) {
        console.error('[Paystack MoMo Charge] Secret key is missing.');
        return {
            success: false,
            reference: params.reference,
            status: 'failed',
            message: 'Paystack secret key is missing'
        };
    }

    const amountInPesewas = Math.round(params.amountGhs * 100);

    const chargePayload = {
        amount: amountInPesewas,
        email: `${params.paymentPhone}@ussd.kingjdeals.com`,
        currency: 'GHS',
        reference: params.reference,
        mobile_money: {
            phone: params.paymentPhone,
            provider: params.provider
        },
        metadata: {
            source: 'ussd',
            channel: 'USSD',
            recipientPhone: params.recipientPhone,
            paymentPhone: params.paymentPhone,
            network: params.network,
            paymentNetwork: params.paymentNetwork,
            bundleName: params.bundleName,
            sessionId: params.sessionId
        }
    };

    console.log(`[Paystack MoMo Charge] Initiating charge for ref ${params.reference}, provider ${params.provider}, phone ${params.paymentPhone}, amount ${params.amountGhs} GHS (${amountInPesewas} pesewas)`);

    try {
        const response = await axios.post('https://api.paystack.co/charge', chargePayload, {
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        const data = response.data;
        console.log(`[Paystack MoMo Charge Response] Status: ${response.status}, Success: ${data?.status}, Data status: ${data?.data?.status}`);

        if (data && data.status === true) {
            const chargeStatus = data.data?.status || 'pending';
            // Valid Ghana MoMo initiation statuses include "pay_offline", "pending", "send_otp", "success"
            return {
                success: true,
                reference: params.reference,
                status: chargeStatus,
                displayText: data.data?.display_text || 'Please authorize payment on your phone'
            };
        } else {
            console.warn(`[Paystack MoMo Charge] Paystack returned status false:`, data?.message);
            return {
                success: false,
                reference: params.reference,
                status: 'failed',
                message: data?.message || 'Paystack charge failed'
            };
        }
    } catch (err: any) {
        const errorData = err.response?.data;
        console.error(`[Paystack MoMo Charge Exception]:`, errorData || err.message);
        return {
            success: false,
            reference: params.reference,
            status: 'failed',
            message: errorData?.message || err.message || 'Paystack charge request failed'
        };
    }
}

// In-memory session store (keyed by sessionId)
export const sessionStore = new Map<string, UssdSessionState>();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// Periodic cleanup of stale sessions
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessionStore.entries()) {
        if (now - session.lastActive > SESSION_TTL_MS) {
            sessionStore.delete(key);
        }
    }
}, 60 * 1000);
if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
}

// King J Deals Official Support Numbers
export const SUPPORT_NUMBERS = "0535884851 / 0541557530";

/**
 * In-Memory Bundles Cache (60 seconds TTL)
 * Enables sub-50ms USSD response times while staying in sync with Firestore
 */
interface BundlesCache {
    items: UssdBundleItem[];
    lastFetched: number;
}

const bundlesCacheByNetwork = new Map<string, BundlesCache>();
const BUNDLE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Normalizes network string to standard casing used in Firestore
 */
export function normalizeNetworkName(network: string): string {
    const upper = network.trim().toUpperCase();
    if (upper === 'TELECEL' || upper === 'VODAFONE') return 'Telecel';
    if (upper === 'AIRTELTIGO' || upper === 'AT' || upper === 'AIRTEL' || upper === 'TIGO') return 'AirtelTigo';
    return 'MTN';
}

/**
 * Normalizes Ghanaian phone numbers into local 10-digit format (0XXXXXXXXX)
 * Supports:
 * - 0241234567
 * - 233241234567
 * - +233241234567
 * - 241234567 (9-digit omission of leading zero)
 */
export function normalizeGhanaPhone(input: string): string | null {
    if (!input) return null;
    let clean = input.replace(/[\s+-]/g, '');
    if (clean.startsWith('233') && clean.length === 12) {
        clean = '0' + clean.slice(3);
    } else if (clean.length === 9 && /^[235]\d{8}$/.test(clean)) {
        clean = '0' + clean;
    }
    // Valid Ghana mobile numbers: 10 digits starting with 02, 03, or 05
    if (/^0[235]\d{8}$/.test(clean)) {
        return clean;
    }
    return null;
}

/**
 * Fetches active bundles from Firestore for a network with short-lived caching
 */
export async function getActiveBundlesForNetwork(
    db: Firestore | null,
    network: string
): Promise<UssdBundleItem[]> {
    if (!db) return [];

    const normNetwork = normalizeNetworkName(network);
    const cached = bundlesCacheByNetwork.get(normNetwork);
    if (cached && (Date.now() - cached.lastFetched < BUNDLE_CACHE_TTL_MS)) {
        return cached.items;
    }

    try {
        const bundlesCol = collection(db, 'bundles');
        const q = query(
            bundlesCol,
            where('network', '==', normNetwork),
            where('active', '==', true)
        );
        const snapshot = await getDocs(q);

        const map = new Map<string, UssdBundleItem>();
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const price = typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0;
            const dataAmount = String(data.dataAmount || data.name || '').trim();
            const name = String(data.name || data.dataAmount || `${normNetwork} Data`).trim();

            if (price <= 0 || !dataAmount) return;

            // Deduplicate packages with identical data volume, keeping the lowest active price
            const dedupKey = dataAmount.toLowerCase().replace(/\s+/g, '');
            if (!map.has(dedupKey) || (map.get(dedupKey)!.price > price)) {
                map.set(dedupKey, {
                    id: docSnap.id,
                    name,
                    dataAmount,
                    price,
                    network: normNetwork
                });
            }
        });

        const items = Array.from(map.values());
        // Sort bundles ascending by price
        items.sort((a, b) => a.price - b.price);

        bundlesCacheByNetwork.set(normNetwork, {
            items,
            lastFetched: Date.now()
        });

        return items;
    } catch (err: any) {
        console.error(`[NALO USSD] Error fetching active bundles for ${normNetwork}:`, err.message || err);
        if (cached && cached.items.length > 0) {
            return cached.items;
        }
        return [];
    }
}

const gameCoinsCacheByCategory = new Map<string, BundlesCache>();

/**
 * Fetches active Game Coins packages dynamically from Firestore with short-lived caching
 */
export async function getActiveGameCoinsBundles(
    db: Firestore | null,
    category: string
): Promise<UssdBundleItem[]> {
    if (!db) return [];

    const cached = gameCoinsCacheByCategory.get(category);
    if (cached && (Date.now() - cached.lastFetched < BUNDLE_CACHE_TTL_MS)) {
        return cached.items;
    }

    try {
        const bundlesCol = collection(db, 'bundles');
        const qCat = query(
            bundlesCol,
            where('category', '==', category),
            where('active', '==', true)
        );
        const catSnap = await getDocs(qCat);

        const qNet = query(
            bundlesCol,
            where('network', '==', category),
            where('active', '==', true)
        );
        const netSnap = await getDocs(qNet);

        const map = new Map<string, UssdBundleItem>();

        const processDoc = (docSnap: any) => {
            const data = docSnap.data();
            if (!data.active) return;
            const price = typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0;
            const dataAmount = String(data.dataAmount || data.name || '').trim();
            const name = String(data.name || data.dataAmount || `${category} Package`).trim();

            if (price <= 0 || !dataAmount) return;

            const dedupKey = dataAmount.toLowerCase().replace(/\s+/g, '');
            if (!map.has(dedupKey) || (map.get(dedupKey)!.price > price)) {
                map.set(dedupKey, {
                    id: docSnap.id,
                    name,
                    dataAmount,
                    price,
                    network: String(data.network || category)
                });
            }
        };

        catSnap.docs.forEach(processDoc);
        netSnap.docs.forEach(processDoc);

        const items = Array.from(map.values());
        items.sort((a, b) => a.price - b.price);

        gameCoinsCacheByCategory.set(category, {
            items,
            lastFetched: Date.now()
        });

        return items;
    } catch (err: any) {
        console.error(`[NALO USSD] Error fetching active game coins for ${category}:`, err.message || err);
        if (cached && cached.items.length > 0) {
            return cached.items;
        }
        return [];
    }
}

/**
 * Generates an idempotent, human-readable King J Deals order reference
 * Example: KJD-USSD-7B3K9X2P
 */
export function generateUssdOrderReference(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KJD-USSD-${code}`;
}

/**
 * Normalizes incoming request parameters from Nalo
 */
export function normalizeNaloRequest(body: Record<string, any> = {}, query: Record<string, any> = {}): {
    userId: string;
    msisdn: string;
    userData: string;
    isNewSession: boolean;
    sessionId: string;
    network?: string;
    serviceCode?: string;
} {
    const payload = { ...query, ...body };

    const userId = String(
        payload.USERID || payload.userId || payload.userid || process.env.NALO_USER_ID || 'kingjdeals'
    ).trim();

    const rawMsisdn = String(
        payload.MSISDN || payload.msisdn || payload.phoneNumber || payload.phone || ''
    ).trim();

    // Clean phone number (remove spaces, plus sign)
    const msisdn = rawMsisdn.replace(/[\s+]/g, '');

    const rawUserData = String(
        payload.USERDATA !== undefined ? payload.USERDATA :
        payload.userData !== undefined ? payload.userData :
        payload.userdata !== undefined ? payload.userdata :
        payload.input !== undefined ? payload.input :
        payload.text !== undefined ? payload.text : ''
    ).trim();

    const rawMsgType = payload.MSGTYPE !== undefined ? payload.MSGTYPE :
                       payload.msgType !== undefined ? payload.msgType :
                       payload.msgtype !== undefined ? payload.msgtype : undefined;

    // In Nalo USSD API, MSGTYPE: true (or 1) indicates the first dial / new session from gateway.
    // Also if rawUserData contains root dial string like *920*...# or is empty on initial hit.
    const isNewSession = (
        rawMsgType === true ||
        rawMsgType === 1 ||
        rawMsgType === 'true' ||
        rawMsgType === '1' ||
        (rawUserData.startsWith('*') && rawUserData.endsWith('#'))
    );

    const sessionId = String(
        payload.SESSIONID || payload.sessionId || payload.sessionid || payload.SESSION_ID || msisdn || 'unknown_session'
    ).trim();

    const network = payload.NETWORK || payload.network || undefined;
    const serviceCode = payload.SERVICECODE || payload.serviceCode || payload.servicecode || payload.SERVICE_CODE || undefined;

    return {
        userId,
        msisdn,
        userData: rawUserData,
        isNewSession,
        sessionId,
        network,
        serviceCode
    };
}

/**
 * Safely masks player ID / UID for privacy in USSD outputs
 * Example: 1034714769 -> 1034****769, 12345678 -> 1234****678
 */
function maskPlayerId(id: string): string {
    const clean = String(id || '').trim();
    if (!clean) return '';
    if (clean.length <= 4) return '****';
    if (clean.length <= 7) return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
    return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
}

/**
 * Extracts a numeric epoch millisecond timestamp from Firestore createdAt / updatedAt fields
 */
function getOrderCreatedAtMillis(data: any): number {
    if (!data) return 0;
    const val = data.createdAt || data.updatedAt;
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (val.seconds) return val.seconds * 1000 + (val.nanoseconds ? Math.round(val.nanoseconds / 1000000) : 0);
    if (typeof val === 'string') {
        const parsed = Date.parse(val);
        if (!isNaN(parsed)) return parsed;
    }
    return 0;
}

/**
 * Formats order details for the Check Order USSD menu
 * Supports both Data Bundles and Game Coins with clean, privacy-safe formatting
 */
function formatOrderSummary(data: any): string {
    const bundle = data.bundle || data.bundleName || data.dataAmount || 'Package';
    const phone = data.recipientPhone || data.phone || data.paymentPhone || 'N/A';
    const rawStatus = String(data.status || '').toLowerCase();
    const rawPaymentStatus = String(data.paymentStatus || '').toLowerCase();

    let displayStatus = 'Payment Pending';
    if (rawStatus === 'paid' || rawStatus === 'success' || rawPaymentStatus === 'success') {
        displayStatus = 'Paid';
    } else if (rawStatus === 'delivered' || rawStatus === 'completed') {
        displayStatus = 'Delivered';
    } else if (rawStatus === 'processing' || rawStatus === 'accepted') {
        displayStatus = 'Processing';
    } else if (rawStatus === 'failed' || rawStatus === 'declined' || rawPaymentStatus === 'failed') {
        displayStatus = 'Payment Failed';
    } else if (rawStatus === 'pending' || rawPaymentStatus === 'pending') {
        displayStatus = 'Payment Pending';
    }

    const amount = typeof data.amount === 'number' ? data.amount : 
                   typeof data.amountSent === 'number' ? data.amountSent : 
                   typeof data.finalPrice === 'number' ? data.finalPrice : 0;

    const isGameCoins = Boolean(
        data.fcUserId || 
        data.category || 
        (data.network && (data.network.includes('FC Mobile') || data.network.includes('PUBG') || data.network.includes('Game'))) ||
        (data.recipientNetwork && (data.recipientNetwork.includes('FC Mobile') || data.recipientNetwork.includes('PUBG')))
    );

    if (isGameCoins) {
        const gameTitle = data.category || data.network || data.recipientNetwork || 'Game Coins';
        const maskedUid = maskPlayerId(data.fcUserId || '');
        let lines = `Order Status:\nGame: ${gameTitle}\nPackage: ${bundle}`;
        if (maskedUid) {
            lines += `\nPlayer ID: ${maskedUid}`;
        }
        lines += `\nStatus: ${displayStatus}\nAmount: GHS ${amount.toFixed(2)}`;
        return lines;
    } else {
        const networkName = data.network || data.recipientNetwork || 'Data Bundle';
        return `Order Status:\nNetwork: ${networkName}\nPackage: ${bundle}\nRecipient: ${phone}\nStatus: ${displayStatus}\nAmount: GHS ${amount.toFixed(2)}`;
    }
}

/**
 * Helper to query an order from Firestore using Order Reference / ID
 * Normalizes case and auto-matches 8-character suffixes (e.g. 7B3K9X2P -> KJD-USSD-7B3K9X2P)
 */
export async function lookupOrderByReferenceInFirestore(db: Firestore | null, searchInput: string): Promise<string> {
    if (!db) {
        return `Order lookup is temporarily unavailable. Please contact King J Deals on ${SUPPORT_NUMBERS}.`;
    }

    const rawTrimmed = searchInput.trim();
    if (!rawTrimmed) {
        return `Please enter your King J Deals order reference.`;
    }

    const upperInput = rawTrimmed.toUpperCase();
    const candidates = [rawTrimmed, upperInput];
    if (!upperInput.startsWith('KJD-USSD-') && upperInput.length === 8) {
        candidates.push(`KJD-USSD-${upperInput}`);
    } else if (!upperInput.startsWith('KJD-')) {
        candidates.push(`KJD-USSD-${upperInput}`);
        candidates.push(`KJD-${upperInput}`);
    }
    const uniqueCandidates = Array.from(new Set(candidates));

    try {
        const ordersCol = collection(db, 'orders');

        // 1. Direct document ID lookup
        for (const candidate of uniqueCandidates) {
            try {
                const docRef = doc(db, 'orders', candidate);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return formatOrderSummary(docSnap.data());
                }
            } catch (_) {}
        }

        // 2. Query by reference & referenceCode fields
        for (const candidate of uniqueCandidates) {
            const qRef = query(ordersCol, where('reference', '==', candidate), limit(1));
            const refSnap = await getDocs(qRef);
            if (!refSnap.empty) {
                return formatOrderSummary(refSnap.docs[0].data());
            }

            const qRefCode = query(ordersCol, where('referenceCode', '==', candidate), limit(1));
            const refCodeSnap = await getDocs(qRefCode);
            if (!refCodeSnap.empty) {
                return formatOrderSummary(refCodeSnap.docs[0].data());
            }
        }

        return `Order not found for "${rawTrimmed}". Please confirm your order reference or contact support: ${SUPPORT_NUMBERS}.`;
    } catch (err: any) {
        console.error('[NALO USSD] Firestore order reference lookup error:', err.message || err);
        return `Service temporarily unavailable. Please check online at https://kingjdeals.site or contact ${SUPPORT_NUMBERS}.`;
    }
}

/**
 * Backward compatibility alias for lookupOrderByReferenceInFirestore
 */
export async function lookupOrderInFirestore(db: Firestore | null, searchInput: string): Promise<string> {
    return lookupOrderByReferenceInFirestore(db, searchInput);
}

/**
 * Helper to query the most recent order for a customer's phone number
 * Checks recipientPhone, phone, and paymentPhone fields, returning the newest record by createdAt
 */
export async function lookupOrderByPhoneInFirestore(
    db: Firestore | null, 
    phoneInput: string
): Promise<{ found: boolean; message: string }> {
    if (!db) {
        return {
            found: false,
            message: `Order lookup is temporarily unavailable. Please contact King J Deals on ${SUPPORT_NUMBERS}.`
        };
    }

    const normalized = normalizeGhanaPhone(phoneInput);
    if (!normalized) {
        return {
            found: false,
            message: `Invalid phone number.\n\nEnter the phone number used for your order:\n0. Back`
        };
    }

    try {
        const ordersCol = collection(db, 'orders');
        const candidatePhones = Array.from(new Set([
            normalized,
            phoneInput.trim(),
            `233${normalized.slice(1)}`
        ]));

        const matchedDocsMap = new Map<string, any>();

        for (const phoneVal of candidatePhones) {
            // Check recipientPhone
            try {
                const qRecipient = query(ordersCol, where('recipientPhone', '==', phoneVal), limit(5));
                const snapRecipient = await getDocs(qRecipient);
                snapRecipient.docs.forEach(d => matchedDocsMap.set(d.id, d.data()));
            } catch (_) {}

            // Check phone
            try {
                const qPhone = query(ordersCol, where('phone', '==', phoneVal), limit(5));
                const snapPhone = await getDocs(qPhone);
                snapPhone.docs.forEach(d => matchedDocsMap.set(d.id, d.data()));
            } catch (_) {}

            // Check paymentPhone
            try {
                const qPaymentPhone = query(ordersCol, where('paymentPhone', '==', phoneVal), limit(5));
                const snapPaymentPhone = await getDocs(qPaymentPhone);
                snapPaymentPhone.docs.forEach(d => matchedDocsMap.set(d.id, d.data()));
            } catch (_) {}
        }

        const ordersList = Array.from(matchedDocsMap.values());
        if (ordersList.length === 0) {
            return {
                found: false,
                message: `No order found for this number.\nPlease check the number and try again.\n0. Back`
            };
        }

        // Sort descending by creation timestamp to pick the newest order
        ordersList.sort((a, b) => getOrderCreatedAtMillis(b) - getOrderCreatedAtMillis(a));
        const newestOrder = ordersList[0];

        return {
            found: true,
            message: formatOrderSummary(newestOrder)
        };
    } catch (err: any) {
        console.error('[NALO USSD] Firestore order phone lookup error:', err.message || err);
        return {
            found: false,
            message: `Service temporarily unavailable. Please check online at https://kingjdeals.site or contact ${SUPPORT_NUMBERS}.`
        };
    }
}

const BUNDLES_PER_PAGE = 5;

/**
 * Renders the paginated bundle list for a network
 */
function renderBundleMenu(network: string, bundles: UssdBundleItem[], page: number): string {
    const totalPages = Math.ceil(bundles.length / BUNDLES_PER_PAGE);
    const start = page * BUNDLES_PER_PAGE;
    const pageItems = bundles.slice(start, start + BUNDLES_PER_PAGE);

    const lines = pageItems.map((b, idx) => `${idx + 1}. ${b.dataAmount || b.name} - GHS ${b.price}`).join('\n');
    let nav = '';
    if (page < totalPages - 1) {
        nav += '\n9. More';
    }
    if (page > 0) {
        nav += '\n8. Prev';
    }
    nav += '\n0. Back';

    return `${network} Data Bundles:\n${lines}${nav}`;
}

/**
 * Renders the paginated bundle list for a Game Coins category
 */
function renderGameCoinsBundleMenu(category: string, bundles: UssdBundleItem[], page: number): string {
    const totalPages = Math.ceil(bundles.length / BUNDLES_PER_PAGE);
    const start = page * BUNDLES_PER_PAGE;
    const pageItems = bundles.slice(start, start + BUNDLES_PER_PAGE);

    const lines = pageItems.map((b, idx) => `${idx + 1}. ${b.dataAmount || b.name} - GHS ${b.price}`).join('\n');
    let nav = '';
    if (page < totalPages - 1) {
        nav += '\n9. More';
    }
    if (page > 0) {
        nav += '\n8. Prev';
    }
    nav += '\n0. Back';

    return `${category}:\n${lines}${nav}`;
}

/**
 * Main USSD State-Machine & Menu Processor
 */
export async function processUssdRequest(
    payload: NaloUssdIncomingPayload,
    db: Firestore | null,
    paystackSecretKey?: string
): Promise<NaloUssdResponsePayload> {
    const { userId, msisdn, userData, isNewSession, sessionId } = normalizeNaloRequest(payload);

    console.log(`[NALO USSD] ---> Incoming Request:`);
    console.log(`    Session ID: ${sessionId}`);
    console.log(`    MSISDN:     ${msisdn || '(none)'}`);
    console.log(`    User Input: "${userData}"`);
    console.log(`    Is New:     ${isNewSession}`);

    // Session retrieval or initialization
    let session = sessionStore.get(sessionId);

    // If new session or no session exists or user dialed the root USSD string
    if (isNewSession || !session) {
        session = {
            sessionId,
            msisdn,
            screen: 'MAIN_MENU',
            data: {},
            lastActive: Date.now()
        };
        sessionStore.set(sessionId, session);
    } else {
        session.lastActive = Date.now();
        if (msisdn && !session.msisdn) {
            session.msisdn = msisdn;
        }
    }

    const input = userData.trim();

    // Global cancellation or exit: user types '0' or 'exit' at main menu
    if (session.screen === 'MAIN_MENU' && (input === '0' || input.toLowerCase() === 'exit')) {
        sessionStore.delete(sessionId);
        const exitMsg = `Thank you for visiting KING J DEALS!\nVisit https://kingjdeals.site anytime for instant data bundles.`;
        return {
            USERID: userId,
            MSISDN: msisdn,
            MSG: exitMsg,
            MSGTYPE: false // END session
        };
    }

    let responseMsg = '';
    let shouldContinue = true;

    switch (session.screen) {
        case 'MAIN_MENU': {
            // First time displaying main menu
            if (isNewSession || input === '' || (input.startsWith('*') && input.endsWith('#'))) {
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            }

            // User input on main menu
            if (input === '1' || input === '2' || input === '3') {
                const network = input === '1' ? 'MTN' : input === '2' ? 'Telecel' : 'AirtelTigo';
                session.selectedNetwork = network;
                session.bundlePage = 0;

                const bundles = await getActiveBundlesForNetwork(db, network);
                if (bundles.length === 0) {
                    sessionStore.delete(sessionId);
                    responseMsg = `Service temporarily unavailable. Please try again or contact King J Deals on ${SUPPORT_NUMBERS}.`;
                    shouldContinue = false;
                } else {
                    session.screen = 'BUNDLE_MENU';
                    responseMsg = renderBundleMenu(network, bundles, 0);
                    shouldContinue = true;
                }
            } else if (input === '4') {
                session.screen = 'GAME_COINS_MENU';
                responseMsg = `Game Coins & Points:\n1. FC Mobile Points\n2. FC Mobile Silver\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
            } else if (input === '5') {
                session.screen = 'CHECK_ORDER_MENU';
                responseMsg = `Check Order:\n1. Track using phone number\n2. Track using order reference\n0. Back`;
                shouldContinue = true;
            } else if (input === '6') {
                session.screen = 'CONTACT_US';
                responseMsg = `KING J DEALS Support:\nWhatsApp: ${SUPPORT_NUMBERS}\nCall: ${SUPPORT_NUMBERS}\nWebsite: kingjdeals.site\n\n0. Back`;
                shouldContinue = true;
            } else {
                responseMsg = `Invalid choice.\n\nKING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
            }
            break;
        }

        case 'BUNDLE_MENU': {
            const network = session.selectedNetwork || 'MTN';
            const bundles = await getActiveBundlesForNetwork(db, network);
            if (bundles.length === 0) {
                sessionStore.delete(sessionId);
                responseMsg = `Service temporarily unavailable. Please try again or contact King J Deals on ${SUPPORT_NUMBERS}.`;
                shouldContinue = false;
                break;
            }

            const totalPages = Math.ceil(bundles.length / BUNDLES_PER_PAGE);
            const currentPage = session.bundlePage || 0;

            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            }

            // Next page
            if (input === '9' && currentPage < totalPages - 1) {
                session.bundlePage = currentPage + 1;
                responseMsg = renderBundleMenu(network, bundles, session.bundlePage);
                shouldContinue = true;
                break;
            }

            // Prev page
            if (input === '8' && currentPage > 0) {
                session.bundlePage = currentPage - 1;
                responseMsg = renderBundleMenu(network, bundles, session.bundlePage);
                shouldContinue = true;
                break;
            }

            // Number selection (1 through 5)
            const selectedIdx = parseInt(input, 10);
            const start = currentPage * BUNDLES_PER_PAGE;
            const pageItems = bundles.slice(start, start + BUNDLES_PER_PAGE);

            if (!isNaN(selectedIdx) && selectedIdx >= 1 && selectedIdx <= pageItems.length) {
                const chosen = pageItems[selectedIdx - 1];
                session.selectedBundle = {
                    bundleId: chosen.id,
                    name: chosen.name,
                    dataAmount: chosen.dataAmount,
                    price: chosen.price,
                    network: chosen.network
                };
                session.screen = 'ENTER_RECIPIENT_PHONE';
                responseMsg = `Selected: ${chosen.network} ${chosen.dataAmount || chosen.name} (GHS ${chosen.price})\n\nEnter recipient ${chosen.network} phone number (e.g. 0241234567):\n0. Cancel`;
                shouldContinue = true;
            } else {
                responseMsg = `Invalid option.\n\n${renderBundleMenu(network, bundles, currentPage)}`;
                shouldContinue = true;
            }
            break;
        }

        case 'ENTER_RECIPIENT_PHONE': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            }

            const normalizedPhone = normalizeGhanaPhone(input);
            if (normalizedPhone) {
                session.recipientPhone = normalizedPhone;
                session.screen = 'CONFIRM_ORDER';
                const net = session.selectedNetwork || 'MTN';
                const bundleLabel = session.selectedBundle?.dataAmount || session.selectedBundle?.name || 'Bundle';
                const price = session.selectedBundle?.price || 0;

                responseMsg = `Confirm Order:\nNetwork: ${net}\nPackage: ${bundleLabel}\nRecipient: ${normalizedPhone}\nPrice: GHS ${price.toFixed(2)}\n\n1. Pay with MoMo\n0. Cancel`;
                shouldContinue = true;
            } else {
                responseMsg = `Invalid phone number. Please enter a valid 10-digit Ghana number (e.g. 0241234567):\n0. Cancel`;
                shouldContinue = true;
            }
            break;
        }

        case 'CONFIRM_ORDER': {
            if (input === '1') {
                session.screen = 'SELECT_PAYMENT_NETWORK';
                responseMsg = `Payment network:\n1. MTN MoMo\n2. Telecel\n3. AirtelTigo\n0. Cancel`;
                shouldContinue = true;
            } else if (input === '0') {
                sessionStore.delete(sessionId);
                responseMsg = `Order cancelled. Thank you for choosing KING J DEALS!\nVisit https://kingjdeals.site anytime.`;
                shouldContinue = false; // END session
            } else {
                const isGame = Boolean(session.gameCategory || session.gameUserId);
                if (isGame) {
                    const cat = session.gameCategory || 'Game Coins';
                    const bundleLabel = session.selectedBundle?.dataAmount || session.selectedBundle?.name || 'Package';
                    const price = session.selectedBundle?.price || 0;
                    responseMsg = `Confirm Order:\nGame: ${cat}\nPackage: ${bundleLabel}\nPrice: GHS ${price.toFixed(2)}\nPlayer ID: ${session.gameUserId || ''}\nUsername: ${session.gameUsername || ''}\n\n1. Pay with MoMo\n0. Cancel`;
                } else {
                    const net = session.selectedNetwork || 'MTN';
                    const bundleLabel = session.selectedBundle?.dataAmount || session.selectedBundle?.name || 'Bundle';
                    const price = session.selectedBundle?.price || 0;
                    const recip = session.recipientPhone || msisdn;
                    responseMsg = `Confirm Order:\nNetwork: ${net}\nPackage: ${bundleLabel}\nRecipient: ${recip}\nPrice: GHS ${price.toFixed(2)}\n\n1. Pay with MoMo\n0. Cancel`;
                }
                shouldContinue = true;
            }
            break;
        }

        case 'SELECT_PAYMENT_NETWORK': {
            if (input === '0') {
                sessionStore.delete(sessionId);
                responseMsg = `Order cancelled. Thank you for choosing KING J DEALS!\nVisit https://kingjdeals.site anytime.`;
                shouldContinue = false; // END session
                break;
            }

            if (input === '1') {
                session.paymentNetwork = 'MTN';
                session.paymentProvider = 'mtn';
                session.screen = 'ENTER_PAYMENT_PHONE';
                responseMsg = `Enter payment MoMo number:\ne.g. 0559876543\n0. Cancel`;
                shouldContinue = true;
            } else if (input === '2') {
                session.paymentNetwork = 'Telecel';
                session.paymentProvider = 'vod';
                session.screen = 'ENTER_PAYMENT_PHONE';
                responseMsg = `Enter payment MoMo number:\ne.g. 0559876543\n0. Cancel`;
                shouldContinue = true;
            } else if (input === '3') {
                session.paymentNetwork = 'AirtelTigo';
                session.paymentProvider = 'atl';
                session.screen = 'ENTER_PAYMENT_PHONE';
                responseMsg = `Enter payment MoMo number:\ne.g. 0559876543\n0. Cancel`;
                shouldContinue = true;
            } else {
                responseMsg = `Invalid choice.\n\nPayment network:\n1. MTN MoMo\n2. Telecel\n3. AirtelTigo\n0. Cancel`;
                shouldContinue = true;
            }
            break;
        }

        case 'ENTER_PAYMENT_PHONE': {
            if (input === '0') {
                sessionStore.delete(sessionId);
                responseMsg = `Order cancelled. Thank you for choosing KING J DEALS!\nVisit https://kingjdeals.site anytime.`;
                shouldContinue = false; // END session
                break;
            }

            const normalizedPaymentPhone = normalizeGhanaPhone(input);
            if (!normalizedPaymentPhone) {
                responseMsg = `Invalid phone number. Please enter a valid 10-digit Ghana number (e.g. 0559876543):\n0. Cancel`;
                shouldContinue = true;
                break;
            }

            session.paymentPhone = normalizedPaymentPhone;

            // Idempotency check: If this session already created an order, do not duplicate
            if (session.createdOrderRef) {
                const existingRef = session.createdOrderRef;
                const existingPrice = session.createdPrice || session.selectedBundle?.price || 0;
                responseMsg = `Payment request already sent.\n\nPlease check your MoMo phone and approve the payment.\n\nAmount: GHS ${existingPrice.toFixed(2)}\n\nOrder: ${existingRef}\n\nYour order will be processed after payment is confirmed.`;
                shouldContinue = false;
                break;
            }

            // Live Product Re-Validation before creating order
            let livePrice = session.selectedBundle?.price || 0;
            let liveBundleName = session.selectedBundle?.name || session.selectedBundle?.dataAmount || 'Package';

            if (db && session.selectedBundle?.bundleId) {
                try {
                    const bundleDoc = await getDoc(doc(db, 'bundles', session.selectedBundle.bundleId));
                    if (!bundleDoc.exists() || !bundleDoc.data().active) {
                        session.screen = 'MAIN_MENU';
                        responseMsg = `Selected package is no longer available. Please choose another package:\n\nKING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                        shouldContinue = true;
                        break;
                    }
                    const bData = bundleDoc.data();
                    livePrice = typeof bData.price === 'number' ? bData.price : parseFloat(bData.price) || livePrice;
                    if (bData.name) liveBundleName = bData.name;
                } catch (valErr: any) {
                    console.warn('[NALO USSD] Live product price re-validation notice:', valErr.message || valErr);
                }
            }

            // Generate Unique Order Reference
            const orderRef = generateUssdOrderReference();
            const orderDocId = orderRef;

            const isGameCoins = Boolean(session.gameCategory || session.gameUserId);
            const recipientPhone = isGameCoins ? (session.paymentPhone || msisdn) : (session.recipientPhone || msisdn);
            const paymentPhone = session.paymentPhone;
            const network = isGameCoins ? (session.gameCategory || session.selectedNetwork || 'FC Mobile') : (session.selectedNetwork || 'MTN');
            const recipientNetwork = isGameCoins ? (session.gameCategory || 'FC Mobile') : network;
            const paymentNetwork = session.paymentNetwork || 'MTN';
            const paymentProvider = session.paymentProvider || 'mtn';

            // Real Order Document adhering to King J Deals Direct Shop schema
            // Strictly omitted: agent_id, agentId, isAgentOrder (preserves Direct Shop classification)
            const orderData: Record<string, any> = {
                id: orderDocId,
                userId: "guest-ussd",
                customerName: isGameCoins ? `Game Customer (${paymentPhone})` : `USSD Customer (${paymentPhone})`,
                email: `${paymentPhone}@ussd.kingjdeals.com`,
                phone: recipientPhone,
                recipientPhone: recipientPhone,
                paymentPhone: paymentPhone,
                network: network,
                recipientNetwork: recipientNetwork,
                paymentNetwork: paymentNetwork,
                bundle: liveBundleName,
                bundleName: liveBundleName,
                bundleId: session.selectedBundle?.bundleId || "",
                amount: livePrice,
                basePrice: livePrice,
                finalPrice: livePrice,
                amountSent: livePrice,

                status: "pending",
                paymentStatus: "pending",

                paymentMethod: "momo",
                payment_provider: "paystack",

                reference: orderRef,
                referenceCode: orderRef,

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                source: "ussd",
                channel: "USSD",

                notes: isGameCoins
                    ? `NALO USSD Game Coins (${session.gameCategory}) - UID: ${session.gameUserId || ''}, Nick: ${session.gameUsername || ''}`
                    : `NALO USSD Session: ${sessionId}`
            };

            if (isGameCoins) {
                orderData.fcUserId = session.gameUserId || "";
                orderData.fcUsername = session.gameUsername || "";
                orderData.category = session.gameCategory || "";
            }

            if (db) {
                try {
                    await setDoc(doc(db, 'orders', orderDocId), orderData);
                    console.log(`[NALO USSD] Successfully created Firestore order: ${orderDocId} (${orderRef}) for recipient ${recipientPhone}, payer ${paymentPhone}, GH¢${livePrice}`);
                } catch (writeErr: any) {
                    console.error(`[NALO USSD] Error writing order to Firestore:`, writeErr.message || writeErr);
                }
            }

            // Mark session with created order for idempotency
            session.createdOrderRef = orderRef;
            session.createdOrderId = orderDocId;
            session.createdPrice = livePrice;

            // Initiate Paystack Ghana Mobile Money Charge
            const keyToUse = getUssdPaystackSecretKey(paystackSecretKey);
            const chargeResult = await initiatePaystackMomoCharge({
                secretKey: keyToUse,
                reference: orderRef,
                amountGhs: livePrice,
                paymentPhone: paymentPhone,
                provider: paymentProvider,
                recipientPhone: recipientPhone,
                network: network,
                paymentNetwork: paymentNetwork,
                bundleName: liveBundleName,
                sessionId: sessionId
            });

            if (chargeResult.success) {
                responseMsg = `Payment request sent.\n\nPlease check your MoMo phone and approve the payment.\n\nAmount: GHS ${livePrice.toFixed(2)}\n\nOrder: ${orderRef}\n\nYour order will be processed after payment is confirmed.`;
                shouldContinue = false; // END session per Step 7
            } else {
                // Update order in Firestore to failed so it does not linger as pending
                if (db) {
                    try {
                        await updateDoc(doc(db, 'orders', orderDocId), {
                            status: "failed",
                            paymentStatus: "failed",
                            updatedAt: serverTimestamp()
                        });
                    } catch (e) {}
                }
                responseMsg = `Payment could not be started.\n\nPlease try again or contact:\n${SUPPORT_NUMBERS}`;
                shouldContinue = false; // END session per Step 7
            }
            break;
        }

        case 'GAME_COINS_MENU': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
            } else if (input === '1' || input === '2' || input === '3') {
                const category = input === '1' ? 'FC Mobile Points' : input === '2' ? 'FC Mobile Silver' : 'PUBG Mobile UC';
                const defaultNetwork = input === '3' ? 'PUBG Mobile' : 'FC Mobile';
                session.gameCategory = category;
                session.selectedNetwork = defaultNetwork;
                session.bundlePage = 0;

                const bundles = await getActiveGameCoinsBundles(db, category);
                if (bundles.length === 0) {
                    responseMsg = `${category} packages are currently unavailable. Please check back later.\n\n0. Back`;
                    shouldContinue = true;
                } else {
                    session.screen = 'GAME_COINS_BUNDLE_MENU';
                    responseMsg = renderGameCoinsBundleMenu(category, bundles, 0);
                    shouldContinue = true;
                }
            } else {
                responseMsg = `Invalid selection.\n\nGame Coins & Points:\n1. FC Mobile Points\n2. FC Mobile Silver\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
            }
            break;
        }

        case 'GAME_COINS_BUNDLE_MENU': {
            const category = session.gameCategory || 'FC Mobile Points';
            const bundles = await getActiveGameCoinsBundles(db, category);

            if (bundles.length === 0) {
                session.screen = 'GAME_COINS_MENU';
                responseMsg = `${category} packages are currently unavailable.\n\nGame Coins & Points:\n1. FC Mobile Points\n2. FC Mobile Silver\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
                break;
            }

            const totalPages = Math.ceil(bundles.length / BUNDLES_PER_PAGE);
            const currentPage = session.bundlePage || 0;

            if (input === '0') {
                session.screen = 'GAME_COINS_MENU';
                responseMsg = `Game Coins & Points:\n1. FC Mobile Points\n2. FC Mobile Silver\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
                break;
            }

            // Next page
            if (input === '9' && currentPage < totalPages - 1) {
                session.bundlePage = currentPage + 1;
                responseMsg = renderGameCoinsBundleMenu(category, bundles, session.bundlePage);
                shouldContinue = true;
                break;
            }

            // Prev page
            if (input === '8' && currentPage > 0) {
                session.bundlePage = currentPage - 1;
                responseMsg = renderGameCoinsBundleMenu(category, bundles, session.bundlePage);
                shouldContinue = true;
                break;
            }

            // Number selection (1 through 5)
            const selectedIdx = parseInt(input, 10);
            const start = currentPage * BUNDLES_PER_PAGE;
            const pageItems = bundles.slice(start, start + BUNDLES_PER_PAGE);

            if (!isNaN(selectedIdx) && selectedIdx >= 1 && selectedIdx <= pageItems.length) {
                const chosen = pageItems[selectedIdx - 1];
                session.selectedBundle = {
                    bundleId: chosen.id,
                    name: chosen.name,
                    dataAmount: chosen.dataAmount,
                    price: chosen.price,
                    network: chosen.network,
                    category: category
                };
                session.screen = 'ENTER_GAME_USER_ID';
                responseMsg = `Selected: ${chosen.dataAmount || chosen.name} (GHS ${chosen.price.toFixed(2)})\n\nEnter your ${category} Player ID / UID:\n0. Cancel`;
                shouldContinue = true;
            } else {
                responseMsg = `Invalid option.\n\n${renderGameCoinsBundleMenu(category, bundles, currentPage)}`;
                shouldContinue = true;
            }
            break;
        }

        case 'ENTER_GAME_USER_ID': {
            if (input === '0') {
                session.screen = 'GAME_COINS_MENU';
                responseMsg = `Game Coins & Points:\n1. FC Mobile Points\n2. FC Mobile Silver\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
                break;
            }

            const cleanUid = input.trim();
            if (cleanUid.length < 2 || cleanUid.length > 40) {
                responseMsg = `Invalid Player ID. Please enter your valid Player ID / UID:\n0. Cancel`;
                shouldContinue = true;
                break;
            }

            session.gameUserId = cleanUid;
            session.screen = 'ENTER_GAME_USERNAME';
            responseMsg = `Enter your in-game Nickname / Username:\n0. Cancel`;
            shouldContinue = true;
            break;
        }

        case 'ENTER_GAME_USERNAME': {
            if (input === '0') {
                session.screen = 'ENTER_GAME_USER_ID';
                responseMsg = `Enter your ${session.gameCategory || 'Game'} Player ID / UID:\n0. Cancel`;
                shouldContinue = true;
                break;
            }

            const cleanUsername = input.trim();
            if (cleanUsername.length < 1 || cleanUsername.length > 50) {
                responseMsg = `Invalid username. Please enter your in-game nickname:\n0. Cancel`;
                shouldContinue = true;
                break;
            }

            session.gameUsername = cleanUsername;
            session.screen = 'CONFIRM_ORDER';
            const cat = session.gameCategory || 'Game Coins';
            const bundleLabel = session.selectedBundle?.dataAmount || session.selectedBundle?.name || 'Package';
            const price = session.selectedBundle?.price || 0;

            responseMsg = `Confirm Order:\nGame: ${cat}\nPackage: ${bundleLabel}\nPrice: GHS ${price.toFixed(2)}\nPlayer ID: ${session.gameUserId}\nUsername: ${session.gameUsername}\n\n1. Pay with MoMo\n0. Cancel`;
            shouldContinue = true;
            break;
        }

        case 'CHECK_ORDER_MENU': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            } else if (input === '1') {
                session.screen = 'CHECK_ORDER_BY_PHONE';
                responseMsg = `Enter the phone number used for your order:\n0. Back`;
                shouldContinue = true;
                break;
            } else if (input === '2') {
                session.screen = 'CHECK_ORDER_BY_REF';
                responseMsg = `Check Order Status:\nEnter your King J Deals order reference:\n0. Back`;
                shouldContinue = true;
                break;
            } else {
                responseMsg = `Invalid choice.\n\nCheck Order:\n1. Track using phone number\n2. Track using order reference\n0. Back`;
                shouldContinue = true;
                break;
            }
        }

        case 'CHECK_ORDER_BY_PHONE': {
            if (input === '0') {
                session.screen = 'CHECK_ORDER_MENU';
                responseMsg = `Check Order:\n1. Track using phone number\n2. Track using order reference\n0. Back`;
                shouldContinue = true;
                break;
            }

            const phoneLookup = await lookupOrderByPhoneInFirestore(db, input);
            if (phoneLookup.found) {
                sessionStore.delete(sessionId);
                responseMsg = phoneLookup.message;
                shouldContinue = false; // END session
            } else {
                responseMsg = phoneLookup.message;
                shouldContinue = true; // allow customer to retry or press 0
            }
            break;
        }

        case 'CHECK_ORDER_BY_REF':
        case 'CHECK_ORDER_PROMPT': {
            if (input === '0') {
                session.screen = 'CHECK_ORDER_MENU';
                responseMsg = `Check Order:\n1. Track using phone number\n2. Track using order reference\n0. Back`;
                shouldContinue = true;
                break;
            }

            const lookupResult = await lookupOrderByReferenceInFirestore(db, input);
            sessionStore.delete(sessionId);
            responseMsg = lookupResult;
            shouldContinue = false; // END session
            break;
        }

        case 'CONTACT_US': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            }

            responseMsg = `KING J DEALS Support:\nWhatsApp: ${SUPPORT_NUMBERS}\nCall: ${SUPPORT_NUMBERS}\nWebsite: kingjdeals.site\n\n0. Back`;
            shouldContinue = true;
            break;
        }

        default: {
            session.screen = 'MAIN_MENU';
            responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
            shouldContinue = true;
            break;
        }
    }

    console.log(`[NALO USSD] <--- Outgoing Response:`);
    console.log(`    Session ID: ${sessionId}`);
    console.log(`    MSGTYPE:    ${shouldContinue} (${shouldContinue ? 'CON - Continue' : 'END - Terminate'})`);
    console.log(`    MSG:        \n${responseMsg.replace(/\n/g, ' \\n ')}`);

    return {
        USERID: userId,
        MSISDN: msisdn,
        MSG: responseMsg,
        MSGTYPE: shouldContinue
    };
}
