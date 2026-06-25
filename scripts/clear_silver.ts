import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function clear() {
  const q = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Silver'));
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    console.log(`Deleted ${doc.id}`);
  }
  console.log('Clear complete');
  process.exit(0);
}

clear().catch(console.error);
