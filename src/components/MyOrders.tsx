import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { getApiUrl } from "@/src/lib/api";
import { normalizeGhanaPhone, formatGhanaPhoneDisplay } from "@/src/lib/phoneUtils";
import { UserProfile } from "@/src/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Package,
  Calendar,
  Tag,
  CreditCard,
  AlertTriangle,
  Zap,
  RefreshCw,
  Search,
  Phone,
  ArrowLeft,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MyOrdersProps {
  user?: any;
  profile?: UserProfile | null;
  onBackHome?: () => void;
}

interface TrackedOrder {
  id: string;
  reference: string;
  paymentReference?: string;
  productName: string;
  network?: string;
  serviceType?: string;
  amount: number;
  basePrice?: number;
  fastDelivery?: boolean;
  fastDeliveryFee?: number;
  fastDeliveryType?: string;
  phone?: string;
  status?: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  fulfillmentStatus: string;
  fulfillmentStatusLabel: string;
  paymentMethod?: string;
  fcUserId?: string;
  fcUsername?: string;
  accountIdentifier?: string;
  accountIdentifierType?: string;
  konamiId?: string;
  platform?: string;
  coinAmount?: number;
  voucherCode?: string;
  pin?: string;
  serialNumber?: string;
  deliveryNote?: string;
  cancellationReason?: string;
  createdAtMs: number;
  createdAtIso?: string | null;
  updatedAtIso?: string | null;
}

function parseTimestampMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "string") {
    const parsed = Date.parse(ts);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function normalizeClientDocToTrackedOrder(id: string, data: any): TrackedOrder {
  const createdAtMs = parseTimestampMs(data.createdAt);
  const rawPay = String(data.paymentStatus || "").toLowerCase().trim();
  const rawStatus = String(data.status || "").toLowerCase().trim();
  const rawFulfill = String(data.fulfillmentStatus || data.adminStatus || "").toLowerCase().trim();

  let paymentStatus = "pending";
  let paymentStatusLabel = "Pending";
  if (rawPay === "success" || rawPay === "paid" || rawPay === "successful" || rawStatus === "paid" || rawStatus === "success") {
    paymentStatus = "success";
    paymentStatusLabel = "Paid / Successful";
  } else if (rawPay === "failed" || rawPay === "abandoned" || (rawStatus === "failed" && !rawPay)) {
    paymentStatus = "failed";
    paymentStatusLabel = "Failed";
  } else if (rawPay === "declined" || (rawStatus === "declined" && !rawPay)) {
    paymentStatus = "declined";
    paymentStatusLabel = "Declined";
  } else if (rawPay === "cancelled" || (rawStatus === "cancelled" && (!rawPay || rawPay === "payment_pending" || rawPay === "pending"))) {
    paymentStatus = "cancelled";
    paymentStatusLabel = "Cancelled";
  } else if (rawStatus === "pending_verification" || rawPay === "pending_verification") {
    paymentStatus = "pending_verification";
    paymentStatusLabel = "Pending Verification";
  } else if (rawStatus === "unpaid" || rawPay === "unpaid") {
    paymentStatus = "unpaid";
    paymentStatusLabel = "Unpaid";
  }

  let fulfillmentStatus = "pending";
  let fulfillmentStatusLabel = "Pending";
  if (rawFulfill === "delivered" || rawFulfill === "completed" || rawStatus === "delivered" || rawStatus === "completed") {
    fulfillmentStatus = "delivered";
    fulfillmentStatusLabel = "Delivered";
  } else if (rawFulfill === "processing" || rawFulfill === "accepted" || rawStatus === "processing" || rawStatus === "accepted") {
    fulfillmentStatus = "processing";
    fulfillmentStatusLabel = "Processing";
  } else if (rawFulfill === "declined" || rawStatus === "declined") {
    fulfillmentStatus = "declined";
    fulfillmentStatusLabel = "Declined";
  } else if (rawFulfill === "cancelled" || rawFulfill === "refunded" || rawStatus === "cancelled") {
    fulfillmentStatus = "cancelled";
    fulfillmentStatusLabel = rawFulfill === "refunded" ? "Refunded" : "Cancelled";
  } else if (rawFulfill === "failed" || rawStatus === "failed") {
    fulfillmentStatus = "failed";
    fulfillmentStatusLabel = "Failed";
  }

  return {
    id,
    reference: String(data.referenceCode || data.orderId || data.reference || id),
    paymentReference: String(data.paymentReference || data.paystackReference || data.momoRefCode || ""),
    productName: String(data.bundle || data.bundleName || data.productName || data.title || data.network || "Order"),
    network: String(data.network || data.recipientNetwork || data.category || ""),
    serviceType: String(data.serviceType || data.category || data.type || ""),
    amount: Number(data.amount ?? data.finalPrice ?? data.amountSent ?? data.price ?? 0),
    basePrice: data.basePrice != null ? Number(data.basePrice) : undefined,
    fastDelivery: Boolean(data.fastDelivery),
    fastDeliveryFee: data.fastDeliveryFee != null ? Number(data.fastDeliveryFee) : undefined,
    fastDeliveryType: data.fastDeliveryType || undefined,
    phone: String(data.phone || data.recipientPhone || data.customerPhone || "").trim(),
    status: String(data.status || "pending"),
    paymentStatus,
    paymentStatusLabel,
    fulfillmentStatus,
    fulfillmentStatusLabel,
    paymentMethod: String(data.paymentMethod || data.payment_provider || "").trim(),
    fcUserId: data.fcUserId,
    fcUsername: data.fcUsername,
    accountIdentifier: data.accountIdentifier,
    accountIdentifierType: data.accountIdentifierType,
    konamiId: data.konamiId,
    platform: data.platform,
    coinAmount: data.coinAmount != null ? Number(data.coinAmount) : undefined,
    voucherCode: data.voucherCode,
    pin: data.pin,
    serialNumber: data.serialNumber || data.serial,
    deliveryNote: data.deliveryNote || data.deliveryNotes,
    cancellationReason: data.cancellationReason,
    createdAtMs,
    createdAtIso: createdAtMs > 0 ? new Date(createdAtMs).toISOString() : null,
  };
}

function rankTrackedOrder(o: TrackedOrder): number {
  let score = 0;
  if (o.fulfillmentStatus === "delivered") score += 1000;
  else if (o.fulfillmentStatus === "processing") score += 700;
  else if (o.paymentStatus === "success") score += 500;
  else if (o.fulfillmentStatus === "declined" || o.fulfillmentStatus === "cancelled" || o.fulfillmentStatus === "failed") score += 200;
  else score += 100;
  if (o.deliveryNote) score += 20;
  if (o.voucherCode || o.pin) score += 20;
  return score;
}

function mergeTrackedOrders(...lists: TrackedOrder[][]): TrackedOrder[] {
  const byId = new Map<string, TrackedOrder>();
  for (const list of lists) {
    for (const item of list) {
      if (!item?.id) continue;
      const existing = byId.get(item.id);
      if (!existing || rankTrackedOrder(item) >= rankTrackedOrder(existing)) {
        byId.set(item.id, item);
      }
    }
  }
  const byPayRef = new Map<string, TrackedOrder>();
  const finalResults: TrackedOrder[] = [];
  for (const item of byId.values()) {
    const payRef = String(item.paymentReference || "").trim();
    const isUniqueRef = payRef.length >= 12 && !/^\d{9,13}$/.test(payRef);
    if (isUniqueRef) {
      const existing = byPayRef.get(payRef);
      if (!existing) {
        byPayRef.set(payRef, item);
        finalResults.push(item);
      } else if (rankTrackedOrder(item) > rankTrackedOrder(existing)) {
        const idx = finalResults.indexOf(existing);
        if (idx !== -1) finalResults[idx] = item;
        byPayRef.set(payRef, item);
      }
    } else {
      finalResults.push(item);
    }
  }
  finalResults.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  return finalResults;
}

export default function MyOrders({ user, profile, onBackHome }: MyOrdersProps) {
  const activeUser = user || auth.currentUser;
  const [backendOrders, setBackendOrders] = useState<TrackedOrder[]>([]);
  const [liveUidOrders, setLiveUidOrders] = useState<TrackedOrder[]>([]);
  const [liveEmailOrders, setLiveEmailOrders] = useState<TrackedOrder[]>([]);
  const [liveEfOrders, setLiveEfOrders] = useState<TrackedOrder[]>([]);
  const [guestExtraOrders, setGuestExtraOrders] = useState<TrackedOrder[]>([]);

  const [loading, setLoading] = useState<boolean>(Boolean(activeUser));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guest phone lookup state
  const [phoneInput, setPhoneInput] = useState<string>(() => {
    try {
      return sessionStorage.getItem("dgn_guest_track_phone") || "";
    } catch {
      return "";
    }
  });
  const [trackedGuestPhone, setTrackedGuestPhone] = useState<string>(() => {
    try {
      return sessionStorage.getItem("dgn_guest_track_phone") || "";
    } catch {
      return "";
    }
  });
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);
  const [guestLookupError, setGuestLookupError] = useState<string | null>(null);
  const [hasSearchedGuest, setHasSearchedGuest] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem("dgn_guest_track_phone"));
    } catch {
      return false;
    }
  });
  const [showSignedInPhoneLookup, setShowSignedInPhoneLookup] = useState(false);

  const syncSignedInOrders = useCallback(async (showSpinner = false) => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setLoading(false);
      return;
    }
    if (showSpinner) setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const idToken = await fbUser.getIdToken();
      const res = await fetch(getApiUrl("/api/orders/my-history"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.orders)) {
        setBackendOrders(data.orders);
      } else if (!res.ok) {
        setErrorMsg(data.error || "Could not synchronize full order history right now.");
      }
    } catch (err) {
      console.warn("[History Sync] Backend fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const lookupGuestOrdersByPhone = useCallback(async (rawPhone: string, silent = false) => {
    const canonical = normalizeGhanaPhone(rawPhone);
    if (!canonical) {
      setGuestLookupError("Please enter a valid Ghanaian phone number (e.g. 0241234567 or +233241234567).");
      return;
    }
    setGuestLookupError(null);
    if (!silent) setGuestLookupLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(getApiUrl("/api/orders/track-guest"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: canonical }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setGuestLookupError(data.error || "Failed to look up orders for this phone number.");
        return;
      }

      const ordersList: TrackedOrder[] = Array.isArray(data.orders) ? data.orders : [];
      setTrackedGuestPhone(canonical);
      setHasSearchedGuest(true);
      try {
        sessionStorage.setItem("dgn_guest_track_phone", canonical);
      } catch {}

      if (activeUser) {
        setGuestExtraOrders(ordersList);
      } else {
        setBackendOrders(ordersList);
      }
    } catch (err) {
      setGuestLookupError("Network error while tracking orders. Please check your connection and try again.");
    } finally {
      setGuestLookupLoading(false);
      setIsRefreshing(false);
    }
  }, [activeUser]);

  // Signed-in sync + Firestore live listeners
  useEffect(() => {
    if (!activeUser?.uid) {
      setLiveUidOrders([]);
      setLiveEmailOrders([]);
      setLiveEfOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    syncSignedInOrders(false);

    const unsubs: Array<() => void> = [];

    try {
      const qUid = query(collection(db, "orders"), where("userId", "==", activeUser.uid));
      unsubs.push(
        onSnapshot(
          qUid,
          (snap) => {
            setLiveUidOrders(snap.docs.map((d) => normalizeClientDocToTrackedOrder(d.id, d.data())));
            setLoading(false);
          },
          (err) => {
            console.warn("Orders UID listener notice:", err?.message || err);
          }
        )
      );
    } catch {}

    if (activeUser.email) {
      try {
        const qEmail = query(collection(db, "orders"), where("email", "==", activeUser.email));
        unsubs.push(
          onSnapshot(
            qEmail,
            (snap) => {
              setLiveEmailOrders(snap.docs.map((d) => normalizeClientDocToTrackedOrder(d.id, d.data())));
            },
            (err) => {
              console.warn("Orders email listener notice:", err?.message || err);
            }
          )
        );
      } catch {}
    }

    try {
      const qEf = query(collection(db, "efootballOrders"), where("userId", "==", activeUser.uid));
      unsubs.push(
        onSnapshot(
          qEf,
          (snap) => {
            setLiveEfOrders(snap.docs.map((d) => normalizeClientDocToTrackedOrder(d.id, d.data())));
          },
          (err) => {
            console.warn("eFootball orders listener notice:", err?.message || err);
          }
        )
      );
    } catch {}

    const handleFocus = () => {
      syncSignedInOrders(false);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubs.forEach((u) => u());
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeUser?.uid, activeUser?.email, syncSignedInOrders]);

  // Guest auto-load if phone remembered in sessionStorage + periodic refresh for live status updates
  useEffect(() => {
    if (activeUser?.uid) return;
    if (!trackedGuestPhone) return;

    lookupGuestOrdersByPhone(trackedGuestPhone, false);
    const interval = setInterval(() => {
      lookupGuestOrdersByPhone(trackedGuestPhone, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeUser?.uid, trackedGuestPhone, lookupGuestOrdersByPhone]);

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupGuestOrdersByPhone(phoneInput, false);
  };

  const handleClearGuestLookup = () => {
    setPhoneInput("");
    setTrackedGuestPhone("");
    setHasSearchedGuest(false);
    setGuestLookupError(null);
    if (activeUser) {
      setGuestExtraOrders([]);
    } else {
      setBackendOrders([]);
    }
    try {
      sessionStorage.removeItem("dgn_guest_track_phone");
    } catch {}
  };

  const handleOpenSupportForOrder = (order: TrackedOrder) => {
    window.dispatchEvent(
      new CustomEvent("OPEN_SUPPORT_MODAL", {
        detail: {
          orderRef: order.reference || order.id,
          phone: order.phone || trackedGuestPhone || "",
        },
      })
    );
  };

  const orders = activeUser
    ? mergeTrackedOrders(backendOrders, liveUidOrders, liveEmailOrders, liveEfOrders, guestExtraOrders)
    : mergeTrackedOrders(backendOrders);

  const getPaymentBadgeStyle = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "success":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300";
      case "failed":
      case "declined":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200";
      case "cancelled":
        return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
      case "pending_verification":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300";
      default:
        return "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200";
    }
  };

  const getFulfillmentBadgeStyle = (fulfillmentStatus: string) => {
    switch (fulfillmentStatus) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300";
      case "declined":
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200";
      case "cancelled":
        return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300";
    }
  };

  const formatDateDisplay = (order: TrackedOrder) => {
    if (order.createdAtIso) {
      const d = new Date(order.createdAtIso);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    if (order.createdAtMs > 0) {
      return new Date(order.createdAtMs).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "Recent";
  };

  return (
    <div className="container mx-auto px-4 pt-24 sm:pt-28 pb-16 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {onBackHome && (
              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Store
              </button>
            )}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Package className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              {activeUser ? "MY ORDER HISTORY" : "TRACK YOUR ORDERS"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {activeUser
                ? "Automatically synchronized across your account purchases and order updates."
                : "Track your data bundle, airtime, result checker, or gaming purchases without signing in."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="border-2 border-primary/30 text-primary font-black px-3.5 py-1.5 rounded-xl"
            >
              {orders.length} {orders.length === 1 ? "ORDER" : "ORDERS"}
            </Badge>
            {(activeUser || trackedGuestPhone) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isRefreshing || guestLookupLoading}
                onClick={() => {
                  if (activeUser) {
                    syncSignedInOrders(true);
                    if (trackedGuestPhone) lookupGuestOrdersByPhone(trackedGuestPhone, true);
                  } else if (trackedGuestPhone) {
                    lookupGuestOrdersByPhone(trackedGuestPhone, true);
                  }
                }}
                className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${(isRefreshing || guestLookupLoading) ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Guest Phone Lookup Card OR Optional Signed-in Phone Check */}
        {!activeUser ? (
          <Card className="rounded-3xl border-2 border-amber-500/30 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-md">
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Guest Order Lookup
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Enter the phone number you used when purchasing.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (guestLookupError) setGuestLookupError(null);
                  }}
                  placeholder="e.g. 024 123 4567 or +233 24 123 4567"
                  className="h-12 flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-800 font-semibold text-base"
                  aria-label="Purchase phone number"
                />
                <Button
                  type="submit"
                  disabled={guestLookupLoading}
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-secondary font-black tracking-wide uppercase shrink-0 gap-2 cursor-pointer"
                >
                  {guestLookupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      TRACK MY ORDERS
                    </>
                  )}
                </Button>
              </div>

              {guestLookupError && (
                <div className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{guestLookupError}</span>
                </div>
              )}

              {trackedGuestPhone && !guestLookupError && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Showing orders for <strong className="text-slate-900 dark:text-white font-mono">{formatGhanaPhoneDisplay(trackedGuestPhone)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearGuestLookup}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Clear / Track Different Number
                  </button>
                </div>
              )}
            </form>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Synced for <strong className="text-slate-900 dark:text-white">{profile?.email || activeUser.email}</strong>
                  {profile?.phoneNumber ? ` • ${profile.phoneNumber}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSignedInPhoneLookup((v) => !v)}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                {showSignedInPhoneLookup ? "Hide phone lookup" : "Placed an order with another phone?"}
              </button>
            </div>

            {showSignedInPhoneLookup && (
              <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                <form onSubmit={handleGuestSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (guestLookupError) setGuestLookupError(null);
                    }}
                    placeholder="Enter purchase phone number (e.g. 0241234567)"
                    className="h-10 flex-1 rounded-xl text-sm"
                  />
                  <Button type="submit" disabled={guestLookupLoading} size="sm" className="h-10 px-4 rounded-xl font-bold uppercase text-xs">
                    {guestLookupLoading ? "Searching..." : "Track Number"}
                  </Button>
                  {trackedGuestPhone && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearGuestLookup} className="h-10 text-xs font-bold">
                      Clear
                    </Button>
                  )}
                </form>
                {guestLookupError && (
                  <p className="text-xs text-red-500 font-semibold mt-2">{guestLookupError}</p>
                )}
              </Card>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading State */}
        {(loading || guestLookupLoading) && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin w-10 h-10 text-primary mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
              {activeUser ? "Synchronizing your order history..." : "Looking up orders for your phone number..."}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-10 text-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              {!activeUser && !hasSearchedGuest
                ? "ENTER YOUR PHONE NUMBER ABOVE"
                : "NO ORDERS FOUND"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 font-medium">
              {!activeUser && !hasSearchedGuest
                ? "Enter the phone number you used during checkout and tap TRACK MY ORDERS to view your live payment and delivery status."
                : !activeUser && trackedGuestPhone
                ? `We could not find any purchases linked to ${formatGhanaPhoneDisplay(trackedGuestPhone)}. Double-check the number or contact support if you need help.`
                : "You haven't placed any orders matching this account yet."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onBackHome && (
                <Button
                  type="button"
                  onClick={onBackHome}
                  className="bg-primary hover:bg-primary/90 text-secondary font-bold rounded-xl px-6 cursor-pointer"
                >
                  SHOP BUNDLES
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("OPEN_SUPPORT_MODAL", {
                      detail: { phone: trackedGuestPhone || profile?.phoneNumber || "" },
                    })
                  )
                }
                className="rounded-xl font-bold px-5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Need Help?
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.3) }}
              >
                <Card className="rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-lg overflow-hidden bg-white dark:bg-slate-950">
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Product + Price */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg uppercase tracking-tight">
                              {order.productName}
                            </h3>
                            {order.network && (
                              <Badge variant="outline" className="text-[10px] font-bold uppercase px-2 py-0.5">
                                {order.network}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {formatDateDisplay(order)}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <CreditCard className="w-3.5 h-3.5 shrink-0" />
                              Ref: {order.reference}
                            </span>
                            {order.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                {order.phone}
                              </span>
                            )}
                          </div>

                          {order.fastDelivery && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 mt-1">
                              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                              FAST DELIVERY ({order.fastDeliveryType === "agent" ? "AGENT" : "CUSTOMER"} • +GH₵{Number(order.fastDeliveryFee || 0).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right border-t sm:border-t-0 dark:border-slate-800 pt-3 sm:pt-0 shrink-0">
                        <p className="text-xl font-black text-primary">
                          GHS {Number(order.amount || 0).toFixed(2)}
                        </p>
                        {order.paymentMethod && (
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Via {order.paymentMethod}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Service Specific Metadata */}
                    {order.fcUserId && order.fcUsername && (
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-black text-emerald-600 dark:text-[#00FF87] uppercase tracking-wider bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <span>FC ID: {order.fcUserId}</span>
                        <span>User: {order.fcUsername}</span>
                      </div>
                    )}

                    {(order.accountIdentifier || order.konamiId) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-wider bg-yellow-500/10 w-fit px-3 py-1.5 rounded-lg border border-yellow-500/20">
                        <span>
                          {order.accountIdentifierType === "email" || (order.accountIdentifier || order.konamiId)?.includes("@")
                            ? "eFootball Email:"
                            : "KONAMI ID:"}
                        </span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {order.accountIdentifier || order.konamiId}
                        </span>
                        {order.platform && <span>• {order.platform}</span>}
                        {order.coinAmount != null && <span>• {Number(order.coinAmount).toLocaleString()} COINS</span>}
                      </div>
                    )}

                    {(order.voucherCode || order.pin || order.serialNumber) && (
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs space-y-1">
                        <div className="font-black text-emerald-700 dark:text-emerald-300 uppercase">
                          Delivered Checker Details
                        </div>
                        {order.serialNumber && (
                          <div className="font-mono text-slate-800 dark:text-slate-200">
                            Serial: <strong>{order.serialNumber}</strong>
                          </div>
                        )}
                        {(order.pin || order.voucherCode) && (
                          <div className="font-mono text-slate-800 dark:text-slate-200">
                            PIN / Code: <strong>{order.pin || order.voucherCode}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {order.deliveryNote && (
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 px-3.5 py-2.5 text-xs text-blue-800 dark:text-blue-200">
                        <strong>Delivery Note:</strong> {order.deliveryNote}
                      </div>
                    )}

                    {order.cancellationReason && (
                      <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
                        <strong>Reason:</strong> {order.cancellationReason}
                      </div>
                    )}

                    {/* Separate Payment Status & Fulfillment Status + Support CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`font-black text-[10px] uppercase px-2.5 py-1 rounded-lg ${getPaymentBadgeStyle(order.paymentStatus)}`}
                        >
                          Payment: {order.paymentStatusLabel}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`font-black text-[10px] uppercase px-2.5 py-1 rounded-lg ${getFulfillmentBadgeStyle(order.fulfillmentStatus)}`}
                        >
                          {order.fulfillmentStatus === "processing" && <Clock className="w-3 h-3 mr-1" />}
                          {order.fulfillmentStatus === "delivered" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {(order.fulfillmentStatus === "declined" || order.fulfillmentStatus === "failed") && <XCircle className="w-3 h-3 mr-1" />}
                          Fulfillment: {order.fulfillmentStatusLabel}
                        </Badge>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 self-start sm:self-auto cursor-pointer"
                        onClick={() => handleOpenSupportForOrder(order)}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Get Support
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
