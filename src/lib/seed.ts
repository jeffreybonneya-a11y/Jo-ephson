import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';

let isSeeding = false;

export async function seedFC() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const q = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Points'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
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
  }

  const q2 = query(collection(db, 'bundles'), where('category', '==', 'FC Mobile Silver'));
  const snapshot2 = await getDocs(q2);
  let hasExactPackages = false;
  for (const doc of snapshot2.docs) {
    if (doc.data().dataAmount === '39 FC Silver') hasExactPackages = true;
  }

  if (!hasExactPackages) {
    // delete old ones
    for (const d of snapshot2.docs) {
      await deleteDoc(d.ref);
    }

    const newSilverPackages = [
      { dataAmount: '39 FC Silver', price: 8.00 },
      { dataAmount: '99 FC Silver', price: 17.00 },
      { dataAmount: '499 FC Silver', price: 80.00 },
      { dataAmount: '999 FC Silver', price: 155.00 },
      { dataAmount: '1999 FC Silver', price: 310.00 },
      { dataAmount: '4999 FC Silver', price: 770.00 },
      { dataAmount: '9999 FC Silver', price: 1530.00 }
    ];

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
    }
  }
  } finally {
    isSeeding = false;
  }
}
