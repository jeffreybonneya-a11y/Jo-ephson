import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, config.firestoreDatabaseId);

const newSilverPackages = [
  { dataAmount: '39 FC Silver', price: 8.00 },
  { dataAmount: '99 FC Silver', price: 17.00 },
  { dataAmount: '499 FC Silver', price: 80.00 },
  { dataAmount: '999 FC Silver', price: 155.00 },
  { dataAmount: '1999 FC Silver', price: 310.00 },
  { dataAmount: '4999 FC Silver', price: 770.00 },
  { dataAmount: '9999 FC Silver', price: 1530.00 },
  { dataAmount: '10000 FC Silver', price: 1530.00 }
];

async function seedSilver() {
  const q = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Silver'));
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    console.log(`Deleted ${doc.id}`);
  }

  for (const b of newSilverPackages) {
    await addDoc(collection(db, 'bundles'), {
      network: 'FC Mobile Silver',
      category: 'FC Mobile Silver',
      dataAmount: b.dataAmount,
      name: b.dataAmount,
      price: b.price,
      active: true,
      createdAt: new Date()
    });
    console.log(`Added ${b.dataAmount}`);
  }
  console.log('Seed complete');
  process.exit(0);
}

seedSilver().catch(console.error);
