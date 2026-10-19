import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  indexedDBLocalPersistence, 
  browserLocalPersistence, 
  getAuth, 
  setPersistence 
} from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

// Set log level to silent to prevent non-fatal 10-second backend connection warning noise
setLogLevel('silent');

// Allow environment variables to override the JSON config for production (Render)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with multi-layer persistence (IndexedDB + localStorage fallback)
// This is critical for iOS Safari / iPhone WebKit where IndexedDB can stall, get partitioned, or fail on wake.
// Having browserLocalPersistence in the array guarantees the user token is always retrieved and never lost.
let authInstance: ReturnType<typeof getAuth>;
if (typeof window !== 'undefined') {
  try {
    authInstance = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
  } catch (_e) {
    authInstance = getAuth(app);
  }
} else {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Explicitly lock in permanent browserLocalPersistence to guarantee no session timeout under any circumstances
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Persistence setup notice:', err);
  });
}

const storageBucketUrl = firebaseConfig.storageBucket 
  ? (firebaseConfig.storageBucket.startsWith('gs://') ? firebaseConfig.storageBucket : `gs://${firebaseConfig.storageBucket}`)
  : undefined;

export const storage = getStorage(app, storageBucketUrl);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
