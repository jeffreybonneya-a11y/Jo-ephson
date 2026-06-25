import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Silver'));
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.size} silver packages`);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
  process.exit(0);
}

check().catch(console.error);
