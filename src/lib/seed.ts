import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

export async function seedFC() {
  const q = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Points'));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return;

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

  for (const b of bundles) {
    await addDoc(collection(db, 'bundles'), {
      ...b,
      name: b.dataAmount,
      createdAt: new Date()
    });
  }

  const q2 = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Silver'));
  const snapshot2 = await getDocs(q2);
  // We no longer seed silver automatically, admin will provide exact packages.
}
