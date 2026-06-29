import { useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';

export default function PriceDropNotifier() {
  const hasNotified = useRef(false);

  useEffect(() => {
    const checkPriceDrops = async () => {
      if (!auth.currentUser || hasNotified.current) return;
      hasNotified.current = true;

      try {
        const userId = auth.currentUser.uid;
        
        // Load previously notified prices from localStorage to avoid spamming
        const storageKey = `notified_price_drops_${userId}`;
        const notifiedPrices: Record<string, number> = JSON.parse(localStorage.getItem(storageKey) || '{}');

        // 1. Fetch user's completed or pending orders
        const ordersRef = collection(db, 'orders');
        const qOrders = query(ordersRef, where('userId', '==', userId));
        const ordersSnap = await getDocs(qOrders);
        
        if (ordersSnap.empty) return;

        // Group by bundle identifier (network + dataAmount)
        // Store the MINIMUM price they ever paid for that bundle.
        // Wait, if we want to notify when it drops below what they paid, 
        // we should compare against the LOWEST price they've paid.
        const lowestPurchasedPrice: Record<string, number> = {};
        
        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.bundle && data.amount) {
            const prevPrice = lowestPurchasedPrice[data.bundle];
            if (prevPrice === undefined || data.amount < prevPrice) {
              lowestPurchasedPrice[data.bundle] = data.amount;
            }
          }
        });

        // 2. Fetch current bundles
        const bundlesRef = collection(db, 'bundles');
        const bundlesSnap = await getDocs(bundlesRef);
        
        const priceDrops: { name: string, oldPrice: number, newPrice: number }[] = [];
        let newlyNotified = false;

        bundlesSnap.forEach((doc) => {
          const b = doc.data();
          if (!b.active) return;
          
          const bundleIdStr = `${b.network} ${b.dataAmount}`;
          const currentPrice = Number(b.price);
          const oldLowestPrice = lowestPurchasedPrice[bundleIdStr];
          
          if (oldLowestPrice !== undefined && oldLowestPrice > currentPrice) {
            // Check if we've already notified them about this specific price (or lower)
            const lastNotifiedPrice = notifiedPrices[bundleIdStr];
            if (lastNotifiedPrice === undefined || currentPrice < lastNotifiedPrice) {
              priceDrops.push({
                name: bundleIdStr,
                oldPrice: oldLowestPrice,
                newPrice: currentPrice
              });
              notifiedPrices[bundleIdStr] = currentPrice;
              newlyNotified = true;
            }
          }
        });

        if (newlyNotified) {
          localStorage.setItem(storageKey, JSON.stringify(notifiedPrices));
        }

        // 3. Show notifications
        priceDrops.forEach((drop, index) => {
          setTimeout(() => {
            toast.success(`Price Drop Alert! 📉 The price of ${drop.name} has dropped from GH₵${drop.oldPrice.toFixed(2)} to GH₵${drop.newPrice.toFixed(2)}!`, {
              duration: 8000
            });
          }, index * 1000);
        });

      } catch (err) {
        console.error("Failed to check price drops:", err);
      }
    };

    const timeout = setTimeout(checkPriceDrops, 2000);
    
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user && !hasNotified.current) {
        checkPriceDrops();
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubAuth();
    };
  }, []);

  return null;
}
