import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { EFootballProduct } from '../types';
import efootballCoinsPackImage from '../assets/images/efootball_coins_pack_1788817788509.jpg';
import efootballBannerImage from '../assets/images/efootball_coins_banner_1788817806286.jpg';
import efootballMobileHeroCover from '../assets/images/efootball_mobile_hero_cover_1788819904181.jpg';

export { efootballCoinsPackImage, efootballBannerImage, efootballMobileHeroCover };

export const DEFAULT_EFOOTBALL_COIN_IMAGE = efootballCoinsPackImage;
export const DEFAULT_EFOOTBALL_COVER_IMAGE = efootballMobileHeroCover;

export const INITIAL_EFOOTBALL_PRODUCTS: Omit<EFootballProduct, 'id'>[] = [
  // ==========================================
  // 1. iOS PACKAGES (10 Products)
  // ==========================================
  {
    name: "137 eFootball Coins (iOS)",
    coinAmount: 137,
    platform: "ios",
    platformLabel: "iOS",
    price: 25,
    currency: "GHS",
    active: true,
    displayOrder: 1,
    description: "137 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "315 eFootball Coins (iOS)",
    coinAmount: 315,
    platform: "ios",
    platformLabel: "iOS",
    price: 42,
    currency: "GHS",
    active: true,
    displayOrder: 2,
    description: "315 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "578 eFootball Coins (iOS)",
    coinAmount: 578,
    platform: "ios",
    platformLabel: "iOS",
    price: 65,
    currency: "GHS",
    active: true,
    displayOrder: 3,
    description: "578 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "788 eFootball Coins (iOS)",
    coinAmount: 788,
    platform: "ios",
    platformLabel: "iOS",
    price: 85,
    currency: "GHS",
    active: true,
    displayOrder: 4,
    description: "788 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "1,092 eFootball Coins (iOS)",
    coinAmount: 1092,
    platform: "ios",
    platformLabel: "iOS",
    price: 110,
    currency: "GHS",
    active: true,
    displayOrder: 5,
    badge: "POPULAR",
    description: "1,092 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "2,237 eFootball Coins (iOS)",
    coinAmount: 2237,
    platform: "ios",
    platformLabel: "iOS",
    price: 215,
    currency: "GHS",
    active: true,
    displayOrder: 6,
    badge: "BEST VALUE",
    description: "2,237 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "3,413 eFootball Coins (iOS)",
    coinAmount: 3413,
    platform: "ios",
    platformLabel: "iOS",
    price: 320,
    currency: "GHS",
    active: true,
    displayOrder: 7,
    description: "3,413 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "5,985 eFootball Coins (iOS)",
    coinAmount: 5985,
    platform: "ios",
    platformLabel: "iOS",
    price: 515,
    currency: "GHS",
    active: true,
    displayOrder: 8,
    description: "5,985 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "13,440 eFootball Coins (iOS)",
    coinAmount: 13440,
    platform: "ios",
    platformLabel: "iOS",
    price: 1085,
    currency: "GHS",
    active: true,
    displayOrder: 9,
    description: "13,440 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "32,200 eFootball Coins (iOS)",
    coinAmount: 32200,
    platform: "ios",
    platformLabel: "iOS",
    price: 2520,
    currency: "GHS",
    active: true,
    displayOrder: 10,
    badge: "MEGA PACK",
    description: "32,200 eFootball Coins delivered directly to your iOS eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },

  // ==========================================
  // 2. ANDROID PACKAGES (10 Products)
  // ==========================================
  {
    name: "137 eFootball Coins (Android)",
    coinAmount: 137,
    platform: "android",
    platformLabel: "Android",
    price: 25,
    currency: "GHS",
    active: true,
    displayOrder: 1,
    description: "137 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "315 eFootball Coins (Android)",
    coinAmount: 315,
    platform: "android",
    platformLabel: "Android",
    price: 42,
    currency: "GHS",
    active: true,
    displayOrder: 2,
    description: "315 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "578 eFootball Coins (Android)",
    coinAmount: 578,
    platform: "android",
    platformLabel: "Android",
    price: 65,
    currency: "GHS",
    active: true,
    displayOrder: 3,
    description: "578 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "788 eFootball Coins (Android)",
    coinAmount: 788,
    platform: "android",
    platformLabel: "Android",
    price: 85,
    currency: "GHS",
    active: true,
    displayOrder: 4,
    description: "788 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "1,092 eFootball Coins (Android)",
    coinAmount: 1092,
    platform: "android",
    platformLabel: "Android",
    price: 110,
    currency: "GHS",
    active: true,
    displayOrder: 5,
    badge: "POPULAR",
    description: "1,092 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "2,237 eFootball Coins (Android)",
    coinAmount: 2237,
    platform: "android",
    platformLabel: "Android",
    price: 215,
    currency: "GHS",
    active: true,
    displayOrder: 6,
    badge: "BEST VALUE",
    description: "2,237 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "3,413 eFootball Coins (Android)",
    coinAmount: 3413,
    platform: "android",
    platformLabel: "Android",
    price: 320,
    currency: "GHS",
    active: true,
    displayOrder: 7,
    description: "3,413 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "5,985 eFootball Coins (Android)",
    coinAmount: 5985,
    platform: "android",
    platformLabel: "Android",
    price: 515,
    currency: "GHS",
    active: true,
    displayOrder: 8,
    description: "5,985 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "13,440 eFootball Coins (Android)",
    coinAmount: 13440,
    platform: "android",
    platformLabel: "Android",
    price: 1085,
    currency: "GHS",
    active: true,
    displayOrder: 9,
    description: "13,440 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "32,200 eFootball Coins (Android)",
    coinAmount: 32200,
    platform: "android",
    platformLabel: "Android",
    price: 2520,
    currency: "GHS",
    active: true,
    displayOrder: 10,
    badge: "MEGA PACK",
    description: "32,200 eFootball Coins delivered directly to your Android eFootball account.",
    imageUrl: efootballCoinsPackImage,
  },

  // ==========================================
  // 3. STEAM PACKAGES (8 Products)
  // ==========================================
  {
    name: "105 eFootball Coins (Steam)",
    coinAmount: 105,
    platform: "steam",
    platformLabel: "Steam",
    price: 22,
    currency: "GHS",
    active: true,
    displayOrder: 1,
    description: "105 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "546 eFootball Coins (Steam)",
    coinAmount: 546,
    platform: "steam",
    platformLabel: "Steam",
    price: 67,
    currency: "GHS",
    active: true,
    displayOrder: 2,
    description: "546 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "1,103 eFootball Coins (Steam)",
    coinAmount: 1103,
    platform: "steam",
    platformLabel: "Steam",
    price: 125,
    currency: "GHS",
    active: true,
    displayOrder: 3,
    badge: "POPULAR",
    description: "1,103 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "2,258 eFootball Coins (Steam)",
    coinAmount: 2258,
    platform: "steam",
    platformLabel: "Steam",
    price: 240,
    currency: "GHS",
    active: true,
    displayOrder: 4,
    badge: "BEST VALUE",
    description: "2,258 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "3,465 eFootball Coins (Steam)",
    coinAmount: 3465,
    platform: "steam",
    platformLabel: "Steam",
    price: 355,
    currency: "GHS",
    active: true,
    displayOrder: 5,
    description: "3,465 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "6,090 eFootball Coins (Steam)",
    coinAmount: 6090,
    platform: "steam",
    platformLabel: "Steam",
    price: 580,
    currency: "GHS",
    active: true,
    displayOrder: 6,
    description: "6,090 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "12,600 eFootball Coins (Steam)",
    coinAmount: 12600,
    platform: "steam",
    platformLabel: "Steam",
    price: 1150,
    currency: "GHS",
    active: true,
    displayOrder: 7,
    description: "12,600 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
  {
    name: "32,600 eFootball Coins (Steam)",
    coinAmount: 32600,
    platform: "steam",
    platformLabel: "Steam",
    price: 2860,
    currency: "GHS",
    active: true,
    displayOrder: 8,
    badge: "MEGA PACK",
    description: "32,600 eFootball Coins for Steam (PC) eFootball accounts.",
    imageUrl: efootballCoinsPackImage,
  },
];

let isSeedingInProgress = false;
let hasSeededOnce = false;

/**
 * Automatically seeds the 28 distinct eFootball products (10 iOS, 10 Android, 8 Steam)
 * into Firestore collection 'efootballProducts'. Cleans up any legacy combined 'ios_android'
 * documents to ensure separate platform catalog fidelity.
 */
export async function seedEFootballProducts(): Promise<void> {
  if (hasSeededOnce || isSeedingInProgress) return;
  isSeedingInProgress = true;
  try {
    const colRef = collection(db, 'efootballProducts');
    const snapshot = await getDocs(colRef);

    let needsReseed = snapshot.empty;
    const legacyDocsToDelete: string[] = [];

    if (!snapshot.empty) {
      let hasIos = false;
      let hasAndroid = false;
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.platform === 'ios') hasIos = true;
        if (data.platform === 'android') hasAndroid = true;
        if (data.platform === 'ios_android' || d.id.includes('ios_android')) {
          legacyDocsToDelete.push(d.id);
          needsReseed = true;
        }
      });
      if (!hasIos || !hasAndroid) {
        needsReseed = true;
      }
    }

    if (needsReseed) {
      console.log('[eFootball] Seeding / Upgrading 28 distinct iOS, Android, and Steam packages into Firestore...');
      const batch = writeBatch(db);

      // Clean up legacy merged products if any exist
      for (const legacyId of legacyDocsToDelete) {
        batch.delete(doc(colRef, legacyId));
      }

      // Upsert all 28 separate platform products
      for (const item of INITIAL_EFOOTBALL_PRODUCTS) {
        const docId = `ef_${item.platform}_${item.coinAmount}`;
        batch.set(
          doc(colRef, docId),
          {
            ...item,
            id: docId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
      hasSeededOnce = true;
      console.log('[eFootball] Successfully committed separate iOS, Android, and Steam products.');
    } else {
      hasSeededOnce = true;
    }
  } catch (err: any) {
    console.warn('[eFootball] Notice while checking/seeding efootballProducts:', err?.message || err);
  } finally {
    isSeedingInProgress = false;
  }
}
