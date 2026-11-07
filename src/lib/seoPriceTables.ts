import { Bundle } from '../types';

export interface SeoBundleRow {
  id: string;
  network: 'MTN' | 'Telecel' | 'AirtelTigo';
  dataAmount: string;
  volumeGb: number;
  price: number;
  pricePerGb: string;
  active: boolean;
}

export const BASELINE_MTN_BUNDLES: SeoBundleRow[] = [
  { id: "3L8nooTyvoR7xPJPnRXE", network: "MTN", dataAmount: "1GB", volumeGb: 1, price: 5.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "vD66q9VuII8KU6zGeF78", network: "MTN", dataAmount: "2GB", volumeGb: 2, price: 11.00, pricePerGb: "GH₵5.50 / GB", active: true },
  { id: "s0nT7lhxIqqUChcuVJfN", network: "MTN", dataAmount: "3GB", volumeGb: 3, price: 15.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "4qIkmTP5774nTpGNZhjy", network: "MTN", dataAmount: "4GB", volumeGb: 4, price: 22.00, pricePerGb: "GH₵5.50 / GB", active: true },
  { id: "5sYYeACsOqAYsR5wNoyq", network: "MTN", dataAmount: "5GB", volumeGb: 5, price: 25.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "Lv6VQoxGrfZBYIwMUc7B", network: "MTN", dataAmount: "6GB", volumeGb: 6, price: 30.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "w86WpMignbTe6LU1LqUN", network: "MTN", dataAmount: "8GB", volumeGb: 8, price: 40.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "JYDyxeAhxqxZhjhM8wIm", network: "MTN", dataAmount: "10GB", volumeGb: 10, price: 50.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "37cYQNvCLHh4ldlC2RaU", network: "MTN", dataAmount: "15GB", volumeGb: 15, price: 70.00, pricePerGb: "GH₵4.67 / GB", active: true },
  { id: "aPvKda1VNKRAXOBaqR0L", network: "MTN", dataAmount: "20GB", volumeGb: 20, price: 100.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "Xva5ljNEk38q407pDjPz", network: "MTN", dataAmount: "25GB", volumeGb: 25, price: 110.00, pricePerGb: "GH₵4.40 / GB", active: true },
  { id: "phEj1l38R6eHRMSSaICG", network: "MTN", dataAmount: "30GB", volumeGb: 30, price: 130.00, pricePerGb: "GH₵4.33 / GB", active: true },
  { id: "CtdTevRGs9JB1XbPhvvT", network: "MTN", dataAmount: "40GB", volumeGb: 40, price: 165.00, pricePerGb: "GH₵4.13 / GB", active: true },
  { id: "NTVPToNTwZpaG9hiGaEz", network: "MTN", dataAmount: "50GB", volumeGb: 50, price: 250.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "CYaeKZAFD1RKsiJBTJQ2", network: "MTN", dataAmount: "100GB", volumeGb: 100, price: 500.00, pricePerGb: "GH₵5.00 / GB", active: true },
];

export const BASELINE_TELECEL_BUNDLES: SeoBundleRow[] = [
  { id: "dmGaWslQMzfClOrkpmOg", network: "Telecel", dataAmount: "10GB", volumeGb: 10, price: 40.00, pricePerGb: "GH₵4.00 / GB", active: true },
  { id: "qmVOcEfHvRcaDbLVX9CC", network: "Telecel", dataAmount: "12GB", volumeGb: 12, price: 50.00, pricePerGb: "GH₵4.17 / GB", active: true },
  { id: "h8aFvyrF02sg9tFJz6SX", network: "Telecel", dataAmount: "15GB", volumeGb: 15, price: 60.00, pricePerGb: "GH₵4.00 / GB", active: true },
  { id: "S5J3ymUNyeWtoGAnRcsZ", network: "Telecel", dataAmount: "20GB", volumeGb: 20, price: 80.00, pricePerGb: "GH₵4.00 / GB", active: true },
  { id: "qB1bQrzei1MnafFabAJB", network: "Telecel", dataAmount: "30GB", volumeGb: 30, price: 115.00, pricePerGb: "GH₵3.83 / GB", active: true },
  { id: "Eq35wQsphI6jaz3x94hO", network: "Telecel", dataAmount: "40GB", volumeGb: 40, price: 150.00, pricePerGb: "GH₵3.75 / GB", active: true },
  { id: "Zs1MAXpFVYjb9LvrR7Wi", network: "Telecel", dataAmount: "50GB", volumeGb: 50, price: 200.00, pricePerGb: "GH₵4.00 / GB", active: true },
  { id: "tUfIlaw33ZdXzmGlkpag", network: "Telecel", dataAmount: "100GB", volumeGb: 100, price: 355.00, pricePerGb: "GH₵3.55 / GB", active: true },
];

export const BASELINE_AIRTELTIGO_BUNDLES: SeoBundleRow[] = [
  { id: "6shKViSkBm1hF4k3D1EE", network: "AirtelTigo", dataAmount: "1GB", volumeGb: 1, price: 5.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "E5oIDdstaj0w5UeKG8F0", network: "AirtelTigo", dataAmount: "2GB", volumeGb: 2, price: 10.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "opatulZQFQAD81EJnduC", network: "AirtelTigo", dataAmount: "3GB", volumeGb: 3, price: 15.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "nuBZqCDIzmAB9KRIuoMl", network: "AirtelTigo", dataAmount: "4GB", volumeGb: 4, price: 20.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "zbm2RpQcSNgsA06C0pCf", network: "AirtelTigo", dataAmount: "5GB", volumeGb: 5, price: 25.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "QtAbGKdkjDbbMndoTsrr", network: "AirtelTigo", dataAmount: "6GB", volumeGb: 6, price: 30.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "G3J4DQKFUdWaRb7Oi9mG", network: "AirtelTigo", dataAmount: "7GB", volumeGb: 7, price: 35.00, pricePerGb: "GH₵5.00 / GB", active: true },
  { id: "jHKAFKTxMGU3grirAv9N", network: "AirtelTigo", dataAmount: "8GB", volumeGb: 8, price: 40.00, pricePerGb: "GH₵5.00 / GB", active: true },
];

export const parseVolumeGb = (amtStr: string): number => {
  if (!amtStr) return 0;
  const norm = amtStr.trim().toLowerCase();
  const match = norm.match(/([\d.,]+)/);
  if (!match) return 0;
  const val = parseFloat(match[1].replace(/,/g, ""));
  if (norm.includes("mb")) return val / 1024;
  if (norm.includes("tb")) return val * 1024;
  return val; // default GB
};

export const computePricePerGb = (price: number, volumeGb: number): string => {
  if (!volumeGb || volumeGb <= 0 || isNaN(price)) return "N/A";
  const rate = price / volumeGb;
  return `GH₵${rate.toFixed(2)} / GB`;
};

export const getNetworkSeoBundles = (
  network: 'MTN' | 'Telecel' | 'AirtelTigo',
  rawBundles?: any[]
): SeoBundleRow[] => {
  const baselines =
    network === 'MTN'
      ? BASELINE_MTN_BUNDLES
      : network === 'Telecel'
      ? BASELINE_TELECEL_BUNDLES
      : BASELINE_AIRTELTIGO_BUNDLES;

  if (!rawBundles || !Array.isArray(rawBundles) || rawBundles.length === 0) {
    return baselines;
  }

  // Filter raw Firestore bundles for specified network and active status
  const filtered = rawBundles.filter((b) => {
    if (b.active === false) return false;
    const net = (b.network || b.category || "").trim().toLowerCase();
    const target = network.toLowerCase();
    if (net !== target) return false;

    // Telecel strictly >= 10GB check
    if (target === "telecel") {
      const vol = parseVolumeGb(b.dataAmount || b.name || "");
      if (vol < 10) return false;
    }
    return true;
  });

  if (filtered.length === 0) return baselines;

  // Deduplicate and map
  const map = new Map<string, SeoBundleRow>();
  for (const b of filtered) {
    const amt = (b.dataAmount || b.name || "").trim().replace(/^Telecel\s+Data\s+/i, "").replace(/^MTN\s+Data\s+/i, "");
    const vol = parseVolumeGb(amt);
    const p = Number(b.price) || 0;
    const key = `${network}__${vol}`;

    if (!map.has(key)) {
      map.set(key, {
        id: b.id || key,
        network,
        dataAmount: amt.toUpperCase().includes("GB") ? amt.toUpperCase() : `${amt}GB`,
        volumeGb: vol,
        price: p,
        pricePerGb: computePricePerGb(p, vol),
        active: true,
      });
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => a.volumeGb - b.volumeGb);
  return result.length > 0 ? result : baselines;
};
