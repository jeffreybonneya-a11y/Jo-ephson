import { collection, getDocs, deleteDoc, doc, Firestore } from "firebase/firestore";

export interface DuplicateScanResult {
  totalScanned: number;
  totalRemoved: number;
  removedIds: string[];
  fcRemoved: number;
  details: string[];
}

/**
 * Normalizes an order string field for safe comparison
 */
function normalizeStr(str?: any): string {
  if (!str) return "";
  return String(str).toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Gets a unix timestamp number from an order's createdAt field
 */
export function getOrderTimestamp(order: any): number {
  if (!order) return 0;
  if (order.createdAt?.seconds) return order.createdAt.seconds * 1000;
  if (typeof order.createdAt?.toMillis === "function") return order.createdAt.toMillis();
  if (order.createdAt instanceof Date) return order.createdAt.getTime();
  if (typeof order.createdAt === "number") return order.createdAt;
  if (typeof order.createdAt === "string") {
    const parsed = Date.parse(order.createdAt);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

/**
 * Determines whether an order is considered FC Mobile Points, FC Mobile Silver, or Game Coins
 */
export function isFcOrCoinsOrder(order: any): boolean {
  if (!order) return false;
  const net = normalizeStr(order.network);
  const bundle = normalizeStr(order.bundle || order.bundleName);
  const cat = normalizeStr(order.category);

  return (
    net.includes("fc") ||
    net.includes("fifa") ||
    net.includes("silver") ||
    net.includes("coin") ||
    bundle.includes("fc point") ||
    bundle.includes("fc silver") ||
    bundle.includes("fifa") ||
    bundle.includes("game coin") ||
    bundle.includes("fc mobile") ||
    cat.includes("fc") ||
    cat.includes("silver") ||
    !!order.fcUserId ||
    !!order.fcUsername
  );
}

/**
 * Strictly determines if an order should be displayed on the Dashboard.
 * Shows all active, successful, paid, processing, pending, and completed orders,
 * excluding only explicitly failed, cancelled, abandoned, or declined transactions.
 */
export function isOrderSuccessfullyPaid(order: any): boolean {
  if (!order) return false;

  const paymentStatus = normalizeStr(order.paymentStatus);
  const status = normalizeStr(order.status);

  // 1. Explicit failure / cancelled / abandoned / declined states MUST NOT appear
  if (
    paymentStatus === "failed" ||
    paymentStatus === "abandoned" ||
    paymentStatus === "cancelled" ||
    paymentStatus === "declined" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "abandoned" ||
    status === "declined"
  ) {
    return false;
  }

  return true;
}

/**
 * Ranks an order's completeness/quality so we always keep the best one when deduplicating
 */
function getOrderRank(order: any): number {
  let score = 0;
  const status = normalizeStr(order.status);
  const payStatus = normalizeStr(order.paymentStatus);

  if (status === "delivered" || status === "completed") score += 1000;
  else if (status === "processing" || status === "accepted") score += 700;
  else if (payStatus === "success" || status === "paid") score += 500;
  else if (status === "pending" || payStatus === "pending") score += 100;
  else score += 10;

  if (order.fcUserId) score += 20;
  if (order.fcUsername) score += 20;
  if (order.reference) score += 10;
  if (order.phone) score += 10;

  return score;
}

/**
 * Generates a deduplication signature for an order.
 * Orders with the same signature created around the same time or identical details are duplicates.
 */
function getOrderSignature(order: any): string {
  const isFc = isFcOrCoinsOrder(order);
  const userIdentifier = normalizeStr(order.userId || order.email || order.phone || "anon");
  const bundle = normalizeStr(order.bundle || order.bundleName || "");
  const amount = Number(order.amount || 0).toFixed(2);
  const net = normalizeStr(order.network || "");
  const fcUser = normalizeStr(order.fcUserId || "");
  const fcName = normalizeStr(order.fcUsername || "");

  if (isFc) {
    // For FC Points and Silver coins, prioritize user identifier + bundle + amount + FC UID
    return `fc_${userIdentifier}_${bundle}_${amount}_${fcUser}_${fcName}`;
  }

  const phone = normalizeStr(order.phone || order.recipientPhone || "");
  return `gen_${userIdentifier}_${net}_${bundle}_${amount}_${phone}`;
}

/**
 * Deduplicates an in-memory array of orders, keeping only the best/canonical record
 */
export function deduplicateOrdersList<T extends { id?: string }>(orders: T[]): T[] {
  if (!orders || orders.length <= 1) return orders || [];

  const seenIds = new Set<string>();
  const idUniqueOrders: T[] = [];

  // 1. Remove literal ID duplicates
  for (const o of orders) {
    const id = o.id || "";
    if (id && seenIds.has(id)) continue;
    if (id) seenIds.add(id);
    idUniqueOrders.push(o);
  }

  // 2. Group by signature and time window to deduplicate identical submissions
  const groups = new Map<string, T[]>();

  for (const order of idUniqueOrders) {
    const sig = getOrderSignature(order);
    const existing = groups.get(sig) || [];
    existing.push(order);
    groups.set(sig, existing);
  }

  const result: T[] = [];

  for (const [, group] of groups.entries()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Sort group: highest rank first, then newest timestamp
    group.sort((a: any, b: any) => {
      const rankA = getOrderRank(a);
      const rankB = getOrderRank(b);
      if (rankA !== rankB) return rankB - rankA;
      return getOrderTimestamp(b) - getOrderTimestamp(a);
    });

    // Check if duplicate submissions occurred within 15 seconds of each other with identical parameters
    const kept: T[] = [];
    for (const item of group) {
      const timeItem = getOrderTimestamp(item);
      const isDuplicateOfKept = kept.some((k: any) => {
        const timeK = getOrderTimestamp(k);
        // If exact same ID or exact same non-empty payment reference
        if (item.id && k.id && item.id === k.id) return true;
        if ((item as any).reference && (k as any).reference && String((item as any).reference).trim() === String((k as any).reference).trim()) return true;
        
        // If timestamps are extremely close (within 15 seconds) with identical parameters (accidental double submit)
        if (timeItem > 0 && timeK > 0) {
          const diffMs = Math.abs(timeItem - timeK);
          if (diffMs < 15 * 1000) return true;
        }

        return false;
      });

      if (!isDuplicateOfKept) {
        kept.push(item);
      }
    }

    result.push(...kept);
  }

  // Final sort by timestamp descending
  result.sort((a: any, b: any) => getOrderTimestamp(b) - getOrderTimestamp(a));
  return result;
}

/**
 * Scans Firestore `orders` and permanently deletes duplicate orders,
 * with special attention to FC Mobile Points, FC Mobile Silver, and Game Coins.
 */
export async function purgeDuplicateOrdersFromFirestore(
  db: Firestore,
  options?: { onlyFcAndCoins?: boolean }
): Promise<DuplicateScanResult> {
  const ordersSnap = await getDocs(collection(db, "orders"));
  const allDocs = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const groups = new Map<string, any[]>();

  for (const order of allDocs) {
    if (options?.onlyFcAndCoins && !isFcOrCoinsOrder(order)) {
      continue;
    }

    const sig = getOrderSignature(order);
    const list = groups.get(sig) || [];
    list.push(order);
    groups.set(sig, list);
  }

  const toDeleteIds: string[] = [];
  let fcRemovedCount = 0;
  const details: string[] = [];

  for (const [sig, group] of groups.entries()) {
    if (group.length <= 1) continue;

    // Rank and sort: best order first
    group.sort((a: any, b: any) => {
      const rankA = getOrderRank(a);
      const rankB = getOrderRank(b);
      if (rankA !== rankB) return rankB - rankA;
      return getOrderTimestamp(b) - getOrderTimestamp(a);
    });

    const kept = group[0];
    const duplicates = group.slice(1);

    for (const dup of duplicates) {
      toDeleteIds.push(dup.id);
      if (isFcOrCoinsOrder(dup)) {
        fcRemovedCount++;
      }
      details.push(
        `Deleted duplicate order #${dup.id.slice(-6)} (${dup.bundle || dup.network}) for ${dup.customerName || dup.phone || "Customer"}`
      );
    }
  }

  // Delete duplicate documents from Firestore in parallel batches
  const batchSize = 25;
  for (let i = 0; i < toDeleteIds.length; i += batchSize) {
    const chunk = toDeleteIds.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (docId) => {
        try {
          await deleteDoc(doc(db, "orders", docId));
          // Also clean up any agent_orders copy if present
          try {
            await deleteDoc(doc(db, "agent_orders", docId));
          } catch {
            // ignore
          }
        } catch (err) {
          console.warn(`Failed to delete order document ${docId}:`, err);
        }
      })
    );
  }

  return {
    totalScanned: allDocs.length,
    totalRemoved: toDeleteIds.length,
    removedIds: toDeleteIds,
    fcRemoved: fcRemovedCount,
    details,
  };
}
