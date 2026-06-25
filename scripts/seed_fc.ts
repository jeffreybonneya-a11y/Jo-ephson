import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

const bundles = [
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '40 FC Points', price: 7.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '100 FC Points', price: 15.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '140 FC Points', price: 22.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '180 FC Points', price: 29.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '220 FC Points', price: 36.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '260 FC Points', price: 43.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '340 FC Points', price: 50.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '380 FC Points', price: 57.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '380 FC Points (Premium)', price: 74.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '420 FC Points', price: 81.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '460 FC Points', price: 88.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '500 FC Points', price: 95.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '540 FC Points', price: 102.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '1070 FC Points', price: 142.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '2200 FC Points', price: 280.00, active: true },
  { network: 'FC Mobile Points', category: 'FC Mobile Points', dataAmount: '9999 FC Points', price: 1500.00, active: true },
];

async function seed() {
  const q = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Points'));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    console.log('Already seeded');
    process.exit(0);
  }

  for (const b of bundles) {
    await addDoc(collection(db, 'bundles'), {
      ...b,
      name: b.dataAmount,
      createdAt: new Date()
    });
    console.log(`Added ${b.dataAmount}`);
  }
  console.log('Seeding complete');
  process.exit(0);
}

seed().catch(console.error);
