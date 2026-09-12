import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    limit, 
    getDocs, 
    doc, 
    getDoc,
    Firestore 
} from 'firebase/firestore';

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
 * Internal state representation for active USSD sessions
 */
interface UssdSessionState {
    sessionId: string;
    msisdn: string;
    screen: string;
    selectedNetwork?: string;
    selectedBundle?: {
        name: string;
        price: number;
    };
    recipientPhone?: string;
    data?: Record<string, any>;
    lastActive: number;
}

// In-memory session store (keyed by sessionId or msisdn)
const sessionStore = new Map<string, UssdSessionState>();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// Periodic cleanup of stale sessions
setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessionStore.entries()) {
        if (now - session.lastActive > SESSION_TTL_MS) {
            sessionStore.delete(key);
        }
    }
}, 60 * 1000);

// Bundles catalog for USSD display
const BUNDLE_CATALOG = {
    MTN: [
        { id: '1', name: '1GB', price: 6 },
        { id: '2', name: '2GB', price: 12 },
        { id: '3', name: '3GB', price: 18 },
        { id: '4', name: '5GB', price: 29 },
        { id: '5', name: '10GB', price: 56 },
    ],
    TELECEL: [
        { id: '1', name: '1GB', price: 6 },
        { id: '2', name: '2GB', price: 12 },
        { id: '3', name: '5GB', price: 29 },
        { id: '4', name: '10GB', price: 56 },
    ],
    AIRTELTIGO: [
        { id: '1', name: '1GB', price: 6 },
        { id: '2', name: '2GB', price: 12 },
        { id: '3', name: '5GB', price: 28 },
        { id: '4', name: '10GB', price: 54 },
    ]
};

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
        rawUserData.startsWith('*') && rawUserData.endsWith('#')
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

const SUPPORT_NUMBERS = "0535884851 / 0541557530";

/**
 * Helper to query an order from Firestore for the Check Order option
 */
async function lookupOrderInFirestore(db: Firestore | null, searchInput: string): Promise<string> {
    if (!db) {
        return `Order lookup is currently syncing. Please visit https://kingjdeals.site or call/WhatsApp ${SUPPORT_NUMBERS}.`;
    }

    const cleanInput = searchInput.trim();
    if (!cleanInput) {
        return `Please provide a valid Order ID or phone number.`;
    }

    try {
        const ordersCol = collection(db, 'orders');

        // 1. Try direct Doc ID lookup
        try {
            const docRef = doc(db, 'orders', cleanInput);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const status = (data.status || 'processing').toUpperCase();
                const item = data.bundleName || data.bundle || data.dataAmount || 'Data Package';
                const amount = data.amountSent || data.amount || 0;
                return `Order Status: ${status}\nItem: ${item}\nAmount: GHS ${amount}\nFor assistance call: ${SUPPORT_NUMBERS}`;
            }
        } catch (_) {}

        // 2. Query by referenceCode
        const qRef = query(ordersCol, where('referenceCode', '==', cleanInput), limit(1));
        const refSnap = await getDocs(qRef);
        if (!refSnap.empty) {
            const data = refSnap.docs[0].data();
            const status = (data.status || 'processing').toUpperCase();
            const item = data.bundleName || data.bundle || data.dataAmount || 'Data Package';
            const amount = data.amountSent || data.amount || 0;
            return `Order Found!\nStatus: ${status}\nItem: ${item}\nAmount: GHS ${amount}\nFor assistance call: ${SUPPORT_NUMBERS}`;
        }

        // 3. Query by recipientPhone or phone
        const cleanPhone = cleanInput.replace(/[\s+]/g, '');
        const qPhone = query(ordersCol, where('recipientPhone', '==', cleanPhone), limit(1));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
            const data = phoneSnap.docs[0].data();
            const status = (data.status || 'processing').toUpperCase();
            const item = data.bundleName || data.bundle || data.dataAmount || 'Data Package';
            const amount = data.amountSent || data.amount || 0;
            return `Latest Order for ${cleanPhone}:\nStatus: ${status}\nItem: ${item}\nAmount: GHS ${amount}\nHelpline: ${SUPPORT_NUMBERS}`;
        }

        // Fallback: Query by phone field
        const qPhoneOld = query(ordersCol, where('phone', '==', cleanPhone), limit(1));
        const phoneOldSnap = await getDocs(qPhoneOld);
        if (!phoneOldSnap.empty) {
            const data = phoneOldSnap.docs[0].data();
            const status = (data.status || 'processing').toUpperCase();
            const item = data.bundleName || data.bundle || data.dataAmount || 'Data Package';
            const amount = data.amountSent || data.amount || 0;
            return `Latest Order for ${cleanPhone}:\nStatus: ${status}\nItem: ${item}\nAmount: GHS ${amount}\nHelpline: ${SUPPORT_NUMBERS}`;
        }

        return `No order found matching "${cleanInput}". Please confirm the details or visit https://kingjdeals.site. Helpline: ${SUPPORT_NUMBERS}`;
    } catch (err: any) {
        console.error('[NALO USSD] Firestore query error:', err.message || err);
        return `Unable to fetch order status right now. Please check online at https://kingjdeals.site or call ${SUPPORT_NUMBERS}.`;
    }
}

/**
 * Main USSD State-Machine & Menu Processor
 */
export async function processUssdRequest(
    payload: NaloUssdIncomingPayload,
    db: Firestore | null
): Promise<NaloUssdResponsePayload> {
    const { userId, msisdn, userData, isNewSession, sessionId } = normalizeNaloRequest(payload);

    console.log(`[NALO USSD] ---> Incoming Request:`);
    console.log(`    Session ID: ${sessionId}`);
    console.log(`    MSISDN:     ${msisdn || '(none)'}`);
    console.log(`    User Input: "${userData}"`);
    console.log(`    Is New:     ${isNewSession}`);
    console.log(`    User ID:    ${userId}`);

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

    // Global cancellation or exit: user types '0' or 'exit' or '#' at main menu
    if (session.screen === 'MAIN_MENU' && (input === '0' || input.toLowerCase() === 'exit')) {
        sessionStore.delete(sessionId);
        const exitMsg = `Thank you for visiting KING J DEALS!\nVisit https://kingjdeals.site anytime for instant data bundles.`;
        console.log(`[NALO USSD] <--- Session Terminated by user (Exit).`);
        return {
            USERID: userId,
            MSISDN: msisdn,
            MSG: exitMsg,
            MSGTYPE: false // END session
        };
    }

    // Process menus according to current screen state
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
            if (input === '1') {
                session.screen = 'MTN_MENU';
                session.selectedNetwork = 'MTN';
                responseMsg = `MTN Data Bundles:\n1. 1GB - GHS 6\n2. 2GB - GHS 12\n3. 3GB - GHS 18\n4. 5GB - GHS 29\n5. 10GB - GHS 56\n0. Back`;
                shouldContinue = true;
            } else if (input === '2') {
                session.screen = 'TELECEL_MENU';
                session.selectedNetwork = 'TELECEL';
                responseMsg = `Telecel Data Bundles:\n1. 1GB - GHS 6\n2. 2GB - GHS 12\n3. 5GB - GHS 29\n4. 10GB - GHS 56\n0. Back`;
                shouldContinue = true;
            } else if (input === '3') {
                session.screen = 'AIRTELTIGO_MENU';
                session.selectedNetwork = 'AIRTELTIGO';
                responseMsg = `AirtelTigo Data Bundles:\n1. 1GB - GHS 6\n2. 2GB - GHS 12\n3. 5GB - GHS 28\n4. 10GB - GHS 54\n0. Back`;
                shouldContinue = true;
            } else if (input === '4') {
                session.screen = 'GAME_COINS_MENU';
                responseMsg = `Game Coins & Points:\n1. FC Mobile Points\n2. eFootball Coins\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
            } else if (input === '5') {
                session.screen = 'CHECK_ORDER_PROMPT';
                responseMsg = `Check Order Status:\nEnter your Order Reference ID or Recipient Phone Number:\n0. Back`;
                shouldContinue = true;
            } else if (input === '6') {
                sessionStore.delete(sessionId);
                responseMsg = `KING J DEALS Support:\nCall/WhatsApp: ${SUPPORT_NUMBERS}\nWebsite: kingjdeals.site\nEmail: support@kingjdeals.site\nFast 24/7 delivery!`;
                shouldContinue = false; // END
            } else {
                responseMsg = `Invalid choice.\n\nKING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
            }
            break;
        }

        case 'MTN_MENU':
        case 'TELECEL_MENU':
        case 'AIRTELTIGO_MENU': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            }

            const netKey = session.screen === 'MTN_MENU' ? 'MTN' : 
                           session.screen === 'TELECEL_MENU' ? 'TELECEL' : 'AIRTELTIGO';
            const catalog = BUNDLE_CATALOG[netKey];
            const selected = catalog.find(b => b.id === input);

            if (selected) {
                session.selectedBundle = { name: selected.name, price: selected.price };
                session.screen = 'ENTER_RECIPIENT_PHONE';
                responseMsg = `Selected: ${netKey} ${selected.name} (GHS ${selected.price})\n\nEnter recipient ${netKey} phone number (e.g. 024xxxxxxx):\n0. Cancel`;
                shouldContinue = true;
            } else {
                const list = catalog.map(b => `${b.id}. ${b.name} - GHS ${b.price}`).join('\n');
                responseMsg = `Invalid option.\n\n${netKey} Data Bundles:\n${list}\n0. Back`;
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

            const cleanPhone = input.replace(/[\s+]/g, '');
            if (cleanPhone.length >= 9 && cleanPhone.length <= 13 && /^\d+$/.test(cleanPhone)) {
                session.recipientPhone = cleanPhone;
                session.screen = 'CONFIRM_ORDER';
                const net = session.selectedNetwork || 'Data';
                const bundleName = session.selectedBundle?.name || 'Bundle';
                const price = session.selectedBundle?.price || 0;

                responseMsg = `Confirm Order:\nNetwork: ${net}\nPackage: ${bundleName}\nRecipient: ${cleanPhone}\nPrice: GHS ${price}\n\n1. Confirm Order\n0. Cancel`;
                shouldContinue = true;
            } else {
                responseMsg = `Invalid phone number. Please enter a valid 10-digit number (e.g. 0241234567):\n0. Cancel`;
                shouldContinue = true;
            }
            break;
        }

        case 'CONFIRM_ORDER': {
            if (input === '1') {
                sessionStore.delete(sessionId);
                const net = session.selectedNetwork || 'Data';
                const bundleName = session.selectedBundle?.name || '';
                const phone = session.recipientPhone || msisdn;
                const price = session.selectedBundle?.price || 0;

                responseMsg = `Order Request Received!\n${net} ${bundleName} for ${phone} (GHS ${price}).\n\nTo complete payment and activate instant delivery, visit https://kingjdeals.site or contact WhatsApp: ${SUPPORT_NUMBERS}.`;
                shouldContinue = false; // END session
            } else {
                sessionStore.delete(sessionId);
                responseMsg = `Order cancelled. Thank you for choosing KING J DEALS!\nVisit https://kingjdeals.site anytime.`;
                shouldContinue = false; // END session
            }
            break;
        }

        case 'GAME_COINS_MENU': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
            } else if (input === '1') {
                sessionStore.delete(sessionId);
                responseMsg = `EA Sports FC Mobile Points & Silver are available on KING J DEALS!\nVisit https://kingjdeals.site/gaming or WhatsApp ${SUPPORT_NUMBERS} for instant delivery.`;
                shouldContinue = false; // END
            } else if (input === '2') {
                sessionStore.delete(sessionId);
                responseMsg = `eFootball Coins & Account Top-ups are available on KING J DEALS!\nVisit https://kingjdeals.site/gaming or WhatsApp ${SUPPORT_NUMBERS} for instant top-up.`;
                shouldContinue = false; // END
            } else if (input === '3') {
                sessionStore.delete(sessionId);
                responseMsg = `PUBG Mobile UC is available on KING J DEALS!\nVisit https://kingjdeals.site/gaming or WhatsApp ${SUPPORT_NUMBERS} for quick recharge.`;
                shouldContinue = false; // END
            } else {
                responseMsg = `Invalid selection.\n\nGame Coins & Points:\n1. FC Mobile Points\n2. eFootball Coins\n3. PUBG Mobile UC\n0. Back`;
                shouldContinue = true;
            }
            break;
        }

        case 'CHECK_ORDER_PROMPT': {
            if (input === '0') {
                session.screen = 'MAIN_MENU';
                responseMsg = `KING J DEALS\n1. MTN Data\n2. Telecel Data\n3. AirtelTigo Data\n4. Game Coins\n5. Check Order\n6. Contact Us\n0. Exit`;
                shouldContinue = true;
                break;
            }

            // Look up order in Firestore database
            const lookupResult = await lookupOrderInFirestore(db, input);
            sessionStore.delete(sessionId);
            responseMsg = lookupResult;
            shouldContinue = false; // END session
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
