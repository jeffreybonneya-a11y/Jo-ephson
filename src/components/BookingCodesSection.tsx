import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase";
import { BookingCode, BookingCodePurchase, UserProfile } from "@/src/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Flame,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Eye,
  Lock,
  Search,
  Sparkles,
  Ticket,
  Trophy,
  History,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "@/src/lib/api";
import { openPaystackPopup } from "@/src/lib/paystack";
import {
  PlatformLogo,
  PLATFORMS_CONFIG,
  PlatformConfig,
} from "./BookingCodePlatformLogos";

interface BookingCodesSectionProps {
  profile?: UserProfile | null;
  agentContext?: any;
  onOpenAuth?: () => void;
}

export default function BookingCodesSection({
  profile,
  agentContext = null,
  onOpenAuth,
}: BookingCodesSectionProps) {
  const [bookingCodes, setBookingCodes] = useState<BookingCode[]>([]);
  const [purchasedCodes, setPurchasedCodes] = useState<BookingCodePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my_codes">("available");

  // Filters
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Active Selections
  const [previewSlipCode, setPreviewSlipCode] = useState<BookingCode | null>(null);
  const [checkoutCode, setCheckoutCode] = useState<BookingCode | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null);

  // Success / Revealed Code Modal
  const [revealedCodeData, setRevealedCodeData] = useState<{
    code: string;
    title: string;
    bookmaker: string;
    odds: number;
    reference: string;
    price: number;
    officialUrl?: string;
  } | null>(null);

  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);

  // Current time state for live countdowns
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (profile?.email || auth.currentUser?.email) {
      setCustomerEmail(profile?.email || auth.currentUser?.email || "");
    }
    if (profile?.phoneNumber || profile?.phone) {
      setCustomerPhone(profile?.phoneNumber || profile?.phone || "");
    }
  }, [profile, auth.currentUser]);

  // Listen for Paystack redirect verification and automatic code reveal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref") || params.get("orderId");
    const service = params.get("service");

    if (ref && (service === "booking_codes" || ref.startsWith("BC_"))) {
      const verifyAndReveal = async () => {
        setIsVerifyingPayment(true);
        const toastId = toast.loading("Verifying your Paystack payment directly with backend...");
        try {
          const res = await fetch(getApiUrl("/api/verify-payment"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: ref, orderId: ref }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.verified && data.bookingCode) {
            toast.dismiss(toastId);
            toast.success("Payment Confirmed! Your Booking Code is ready 👑");
            const pCfg = getPlatformConfig(data.bookingCode.bookmaker || "SportyBet");
            setRevealedCodeData({
              code: data.bookingCode.code,
              title: data.bookingCode.title,
              bookmaker: data.bookingCode.bookmaker,
              odds: Number(data.bookingCode.odds) || 1.0,
              reference: ref,
              price: Number(data.bookingCode.price) || 0,
              officialUrl: pCfg?.officialUrl,
            });
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            toast.dismiss(toastId);
            toast.error(
              data.error || "Payment was not completed. Your booking code has not been released."
            );
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err: any) {
          toast.dismiss(toastId);
          toast.error("Unable to verify payment with backend. Please check your purchased codes.");
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setIsVerifyingPayment(false);
        }
      };
      verifyAndReveal();
    }

    // Global event listener for revealed booking codes
    const handleRevealedEvent = (e: any) => {
      const bc = e.detail;
      if (bc && bc.code) {
        const pCfg = getPlatformConfig(bc.bookmaker || "SportyBet");
        setRevealedCodeData({
          code: bc.code,
          title: bc.title,
          bookmaker: bc.bookmaker,
          odds: Number(bc.odds) || 1.0,
          reference: bc.reference || "",
          price: Number(bc.price) || 0,
          officialUrl: pCfg?.officialUrl,
        });
      }
    };

    window.addEventListener("BOOKING_CODE_REVEALED", handleRevealedEvent as EventListener);
    return () => {
      window.removeEventListener("BOOKING_CODE_REVEALED", handleRevealedEvent as EventListener);
    };
  }, []);

  // Listen to active booking codes in real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, "booking_codes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BookingCode[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "VIP Betting Slip",
            bookmaker: data.bookmaker || "SportyBet",
            code: data.code || "",
            odds: Number(data.odds) || 1.0,
            price: Number(data.price) || 0,
            expiresAt: data.expiresAt || null,
            description: data.description || "",
            previewImageUrl: data.previewImageUrl || "",
            sport: data.sport || "Football",
            category: data.category || "VIP Banker",
            active: data.active !== false,
            totalPurchases: Number(data.totalPurchases) || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setBookingCodes(list);
        setLoading(false);
      },
      (err) => {
        console.warn("[BookingCodes] Error listening to booking codes:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen to current user's purchased booking codes
  useEffect(() => {
    const userEmail = (profile?.email || auth.currentUser?.email || "").toLowerCase().trim();
    const uid = auth.currentUser?.uid || profile?.uid || "";

    if (!userEmail && !uid) {
      setPurchasedCodes([]);
      return;
    }

    const qPurchases = query(
      collection(db, "booking_code_purchases"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      qPurchases,
      (snapshot) => {
        const userPurchases: BookingCodePurchase[] = [];
        snapshot.docs.forEach((docSnap) => {
          const p = docSnap.data();
          const pEmail = (p.customerEmail || p.email || "").toLowerCase().trim();
          const pUid = p.userId || p.uid || "";
          if (
            (userEmail && pEmail === userEmail) ||
            (uid && pUid === uid)
          ) {
            userPurchases.push({
              id: docSnap.id,
              bookingCodeId: p.bookingCodeId || "",
              userId: p.userId || "",
              customerName: p.customerName || "",
              customerEmail: p.customerEmail || p.email || "",
              customerPhone: p.customerPhone || p.phone || "",
              title: p.title || "Purchased Booking Code",
              bookmaker: p.bookmaker || "SportyBet",
              code: p.code || "",
              odds: Number(p.odds) || 1.0,
              price: Number(p.price) || 0,
              paymentMethod: p.paymentMethod || "Paystack",
              paymentReference: p.paymentReference || p.reference || docSnap.id,
              status: "paid",
              createdAt: p.createdAt,
            });
          }
        });
        setPurchasedCodes(userPurchases);
      },
      (err) => {
        console.warn("[BookingCodes] Error fetching purchased codes:", err);
      }
    );

    return () => unsubscribe();
  }, [profile, auth.currentUser]);

  // Helper to parse expiry time to epoch ms
  const getExpiryEpoch = (expiresAt: any): number => {
    if (!expiresAt) return 0;
    if (typeof expiresAt === "number") return expiresAt;
    if (expiresAt?.toMillis && typeof expiresAt.toMillis === "function") {
      return expiresAt.toMillis();
    }
    if (expiresAt?.seconds) {
      return expiresAt.seconds * 1000;
    }
    if (typeof expiresAt === "string") {
      const parsed = Date.parse(expiresAt);
      if (!isNaN(parsed)) return parsed;
    }
    if (expiresAt instanceof Date) {
      return expiresAt.getTime();
    }
    return 0;
  };

  // Helper to format remaining time
  const getRemainingTime = (expiresAt: any) => {
    const expiryMs = getExpiryEpoch(expiresAt);
    if (!expiryMs) return { isExpired: false, label: "Active" };

    const diff = expiryMs - now;
    if (diff <= 0) {
      return { isExpired: true, label: "Expired ⚠️" };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { isExpired: false, label: `Expires in ${days}d ${hours % 24}h` };
    }
    if (hours > 0) {
      return { isExpired: false, label: `Expires in ${hours}h ${minutes}m` };
    }
    return { isExpired: false, label: `Expires in ${minutes}m ${seconds}s` };
  };

  const platformKeys = ["ALL", "SportyBet", "Betway", "1xBet", "Mozzart", "22Bet", "Bet9ja"];
  const categories = ["ALL", "VIP Banker", "Mega Odds", "Daily 2+ Odds", "Daily 5+ Odds", "Weekend Special"];

  // Filtered booking codes
  const filteredCodes = bookingCodes.filter((bc) => {
    if (!bc.active) return false;

    // Filter by bookmaker
    if (selectedBookmaker !== "ALL" && bc.bookmaker.toLowerCase() !== selectedBookmaker.toLowerCase()) {
      return false;
    }

    // Filter by category
    if (selectedCategory !== "ALL" && bc.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = bc.title.toLowerCase().includes(q);
      const matchBookmaker = bc.bookmaker.toLowerCase().includes(q);
      const matchDesc = (bc.description || "").toLowerCase().includes(q);
      const matchCategory = (bc.category || "").toLowerCase().includes(q);
      if (!matchTitle && !matchBookmaker && !matchDesc && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  const getPlatformConfig = (name: string): PlatformConfig => {
    const key = Object.keys(PLATFORMS_CONFIG).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    return key ? PLATFORMS_CONFIG[key] : PLATFORMS_CONFIG.SportyBet;
  };

  const handleOpenCheckout = (code: BookingCode) => {
    const expiryStatus = getRemainingTime(code.expiresAt);
    if (expiryStatus.isExpired) {
      toast.error("This booking code has expired and can no longer be purchased.");
      return;
    }

    const activeUser = auth.currentUser;
    if (!activeUser) {
      toast.error("Please sign in with Google or create an account to purchase booking codes! 👑", {
        description: "Your purchased codes will be saved securely to your royal account.",
      });
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        window.dispatchEvent(new CustomEvent("OPEN_AUTH_MODAL"));
      }
      return;
    }

    setCheckoutCode(code);
  };

  // Execute payment via Paystack Popup or direct hosted checkout
  const handleProceedToPayment = async () => {
    if (!checkoutCode) return;

    const emailToUse = (customerEmail || profile?.email || auth.currentUser?.email || "").trim();
    const phoneToUse = (customerPhone || profile?.phoneNumber || profile?.phone || "").trim();

    if (!emailToUse || !emailToUse.includes("@")) {
      toast.error("Please enter a valid email address to receive your booking code.");
      return;
    }

    // Safety check: is it expired?
    const expiryStatus = getRemainingTime(checkoutCode.expiresAt);
    if (expiryStatus.isExpired) {
      toast.error("This booking code just expired. Purchase was aborted.");
      setCheckoutCode(null);
      return;
    }

    setIsProcessingPayment(true);
    setPaystackAuthUrl(null);
    const orderRefId = `BC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const amountInPesewas = Math.round(Number(checkoutCode.price) * 100);

    // Retrieve public key
    let publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
    try {
      const pkRes = await fetch(getApiUrl("/api/paystack-public-key"));
      if (pkRes.ok) {
        const pkData = await pkRes.json();
        if (pkData.publicKey) {
          publicKey = pkData.publicKey;
        }
      }
    } catch (pkErr) {
      console.warn("Could not fetch Paystack public key, using default:", pkErr);
    }

    const customerFullName = profile?.fullName || auth.currentUser?.displayName || (phoneToUse ? `Customer (${phoneToUse})` : "Royal Customer");
    const currentUserId = auth.currentUser?.uid || profile?.uid || "";

    const bookingOrderPayload = {
      id: orderRefId,
      orderId: orderRefId,
      reference: orderRefId,
      userId: currentUserId,
      customerName: customerFullName,
      customerEmail: emailToUse,
      email: emailToUse,
      customerPhone: phoneToUse || "",
      phone: phoneToUse || "",
      bundle: `VIP BOOKING CODE: ${checkoutCode.title || checkoutCode.bookmaker} (${checkoutCode.bookmaker} ${Number(checkoutCode.odds).toFixed(2)}x)`,
      bundleName: checkoutCode.title || `${checkoutCode.bookmaker} VIP Code`,
      serviceType: "Booking Codes",
      network: "Booking Codes",
      bookmaker: checkoutCode.bookmaker || "SportyBet",
      odds: Number(checkoutCode.odds) || 1.0,
      amount: Number(checkoutCode.price),
      price: Number(checkoutCode.price),
      bookingCodeId: checkoutCode.id,
      bookingCodeTitle: checkoutCode.title || "VIP Booking Code",
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "Paystack",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save pending order immediately to Firestore so it appears instantly across all Admin & Customer dashboards
    try {
      await Promise.all([
        // 1. Primary `orders` collection: shows in Admin Dashboard live orders & customer's My Orders
        setDoc(doc(db, "orders", orderRefId), bookingOrderPayload, { merge: true }),
        // 2. `booking_code_purchases` collection: shows in Admin Booking Codes Manager Sales log
        setDoc(doc(db, "booking_code_purchases", orderRefId), {
          id: orderRefId,
          bookingCodeId: checkoutCode.id,
          userId: currentUserId,
          customerName: customerFullName,
          customerEmail: emailToUse,
          customerPhone: phoneToUse || "",
          title: checkoutCode.title || "VIP Booking Code",
          bookmaker: checkoutCode.bookmaker || "SportyBet",
          code: "Pending Payment ⏳",
          odds: Number(checkoutCode.odds) || 1.0,
          price: Number(checkoutCode.price) || 0,
          paymentMethod: "Paystack",
          paymentReference: orderRefId,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        // 3. Dedicated `booking_code_orders` collection
        setDoc(doc(db, "booking_code_orders", orderRefId), bookingOrderPayload, { merge: true }),
      ]);
    } catch (dbErr) {
      console.warn("Could not pre-save booking code order to Firestore:", dbErr);
    }

    // Attempt 1: Try Paystack Inline Popup directly in browser (works seamlessly across all domains & mobile)
    try {
      toast.info("Opening Paystack Checkout 👑...");
      await openPaystackPopup({
        key: publicKey,
        email: emailToUse,
        amount: amountInPesewas,
        currency: "GHS",
        ref: orderRefId,
        onSuccess: async (verifiedRef: string) => {
          const finalRef = verifiedRef || orderRefId;
          toast.success("Payment completed successfully! Revealing code... 👑");
          setIsProcessingPayment(true);

          // Attempt direct verification & immediate modal reveal
          try {
            const res = await fetch(getApiUrl("/api/verify-payment"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: finalRef, orderId: finalRef }),
            });
            const data = await res.json();
            if (res.ok && data.success && data.bookingCode) {
              const pCfg = getPlatformConfig(data.bookingCode.bookmaker || checkoutCode.bookmaker || "SportyBet");
              setRevealedCodeData({
                code: data.bookingCode.code,
                title: data.bookingCode.title || checkoutCode.title,
                bookmaker: data.bookingCode.bookmaker || checkoutCode.bookmaker,
                odds: Number(data.bookingCode.odds) || Number(checkoutCode.odds) || 1.0,
                reference: finalRef,
                price: Number(data.bookingCode.price) || Number(checkoutCode.price) || 0,
                officialUrl: pCfg?.officialUrl,
              });
              setCheckoutCode(null);
              setIsProcessingPayment(false);
              return;
            }
          } catch (vErr) {
            console.warn("Direct verification notice:", vErr);
          }

          const targetUrl = `${window.location.origin}/?reference=${finalRef}&service=booking_codes`;
          window.location.href = targetUrl;
        },
        onClose: () => {
          toast.info("Payment window closed.");
          setIsProcessingPayment(false);
        },
      });
      return;
    } catch (popupErr) {
      console.warn("[BookingCodes] Popup could not open, falling back to hosted checkout URL:", popupErr);
    }

    // Attempt 2: Fallback to Server-Side Paystack Hosted URL
    try {
      const initRes = await fetch(getApiUrl("/api/paystack-initialize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          amount: amountInPesewas,
          reference: orderRefId,
          callback_url: `${window.location.origin}/?reference=${orderRefId}&service=booking_codes`,
          currency: "GHS",
          bookingCodeId: checkoutCode.id,
          userId: auth.currentUser?.uid || profile?.uid || "",
          customerName: profile?.fullName || auth.currentUser?.displayName || "Royal Customer",
          customerPhone: phoneToUse || undefined,
        }),
      });

      const initData = await initRes.json();
      if (initData.success && initData.authorization_url) {
        const authUrl = initData.authorization_url;
        setPaystackAuthUrl(authUrl);
        toast.success("Paystack checkout ready! Redirecting 👑...", { duration: 3000 });

        let navigated = false;

        // 1. If inside an iframe (e.g. preview), attempt top-level navigation
        if (window.self !== window.top) {
          try {
            window.top.location.href = authUrl;
            navigated = true;
          } catch (topErr) {
            console.warn("[BookingCodes] Top navigation blocked:", topErr);
          }
        }

        // 2. Open new tab/window
        if (!navigated) {
          try {
            const win = window.open(authUrl, "_blank", "noopener,noreferrer");
            if (win && !win.closed) {
              navigated = true;
            }
          } catch (winErr) {
            console.warn("[BookingCodes] window.open blocked:", winErr);
          }
        }

        // 3. Fallback to direct location assignment
        if (!navigated) {
          window.location.href = authUrl;
        }
      } else {
        throw new Error(initData.error || "Payment could not be initialized. Please try again.");
      }
    } catch (err: any) {
      console.error("[BookingCodes] Payment error:", err);
      toast.error(err.message || "Payment could not be initialized. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "Code") => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text} 📋`, {
      description: "Paste it directly in your official betting app slip loader.",
    });
  };

  return (
    <div id="booking-codes-section" className="space-y-6 sm:space-y-8 py-2 sm:py-4 max-w-7xl mx-auto w-full px-2 sm:px-4">
      {/* 1. HERO BANNER FOR BOOKING CODES */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#111C38] to-[#1C1A35] border border-amber-500/30 p-5 sm:p-8 md:p-10 shadow-2xl text-white">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-inner">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>OFFICIAL BOOKING CODES & SLIPS</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight leading-tight">
              Royal Booking Codes{" "}
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                & Banker Slips
              </span>
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-medium">
              Get instant, verified high-odds booking codes for SportyBet, Betway, 1xBet, Mozzart, 22Bet, and Bet9ja. Handpicked analysis, real-time expiration countdowns, and instant code reveal after payment.
            </p>

            {/* Micro Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instant Auto-Reveal</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>Live Expiration Protection</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Odds</span>
              </div>
            </div>
          </div>

          {/* Action Tabs: Available vs My Codes */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <div className="bg-[#070D1E]/90 p-1.5 rounded-2xl border border-amber-500/20 flex gap-1 shadow-inner w-full">
              <button
                onClick={() => setActiveTab("available")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "available"
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-md scale-[1.02]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Available ({filteredCodes.length})</span>
              </button>

              <button
                onClick={() => {
                  if (!auth.currentUser) {
                    toast.info("Please login to view your purchased booking codes.");
                    if (onOpenAuth) onOpenAuth();
                    else window.dispatchEvent(new CustomEvent("OPEN_AUTH_MODAL"));
                    return;
                  }
                  setActiveTab("my_codes");
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "my_codes"
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-md scale-[1.02]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <History className="w-4 h-4" />
                <span>My Codes ({purchasedCodes.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PLATFORM LOGOS SELECTOR & FILTERS */}
      {activeTab === "available" && (
        <div className="space-y-4">
          {/* Header row with search */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Select Betting Platform
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tap any official bookmaker logo to filter codes
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search odds, league, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-slate-900/80 border-slate-700 text-white rounded-xl placeholder:text-slate-500 text-xs focus-visible:ring-amber-400"
              />
            </div>
          </div>

          {/* OFFICIAL PLATFORM LOGOS GRID (Mobile-First, Responsive, Touch-Friendly) */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
            {platformKeys.map((pKey) => {
              const cfg = PLATFORMS_CONFIG[pKey] || PLATFORMS_CONFIG.SportyBet;
              const isSelected = selectedBookmaker.toLowerCase() === pKey.toLowerCase();

              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setSelectedBookmaker(pKey)}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${cfg.name}`}
                  className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer text-center select-none border min-h-[72px] sm:min-h-[82px] ${
                    isSelected
                      ? "bg-slate-900/90 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]"
                      : "bg-[#0F172A]/70 hover:bg-[#162238] border-slate-700/70 hover:border-slate-500 text-slate-300"
                  }`}
                >
                  {/* Selected Indicator Checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Primary Visual Element: Real Brand Logo */}
                  <div className="w-full flex items-center justify-center h-8 sm:h-9 px-1">
                    <PlatformLogo
                      platform={pKey}
                      className="h-6 sm:h-7 w-auto max-w-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
                    />
                  </div>

                  {/* Platform text label under logo */}
                  <span
                    className={`mt-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-tight truncate max-w-full px-1 ${
                      isSelected ? "text-amber-300" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {pKey === "ALL" ? "All Platforms" : cfg.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 mr-1">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-amber-400 text-slate-950 border-amber-400 font-black shadow-sm"
                    : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-700/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. CONTENT AREA: AVAILABLE CODES GRID */}
      {activeTab === "available" ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredCodes.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-slate-800 bg-[#0B132B]/40 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">No Active Booking Codes Found</h3>
            <p className="text-slate-400 max-w-md mx-auto text-xs sm:text-sm mb-6 leading-relaxed">
              {searchQuery || selectedBookmaker !== "ALL" || selectedCategory !== "ALL"
                ? "No booking codes match your current platform or category filters. Try resetting the filters above."
                : "New daily booking codes and weekend banker slips are being analyzed and will be posted shortly. Check back soon!"}
            </p>
            {(searchQuery || selectedBookmaker !== "ALL" || selectedCategory !== "ALL") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBookmaker("ALL");
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="rounded-xl border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-black text-xs cursor-pointer"
              >
                Reset Platform & Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredCodes.map((code) => {
              const expiry = getRemainingTime(code.expiresAt);
              const pCfg = getPlatformConfig(code.bookmaker);

              return (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex"
                >
                  <Card className="relative overflow-hidden rounded-3xl border-2 border-slate-800 bg-[#0F172A] hover:border-amber-500/50 transition-all hover:shadow-2xl flex flex-col justify-between group w-full">
                    {/* Top Bookmaker Accent Header Banner with Official Brand Logo */}
                    <div
                      className={`px-4 py-2.5 sm:py-3 bg-gradient-to-r ${pCfg.accentGradient} flex items-center justify-between shadow-sm`}
                    >
                      <div className="flex items-center gap-2">
                        <PlatformLogo platform={code.bookmaker} className="h-5 sm:h-6 w-auto max-w-[120px]" />
                      </div>
                      <Badge className="bg-black/50 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-md border border-white/20">
                        {code.category || "VIP Banker"}
                      </Badge>
                    </div>

                    <CardContent className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Title & Sport */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                              {code.sport || "Football / Soccer"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              Verified Slip
                            </span>
                          </div>
                          <h3 className="font-serif font-black text-base sm:text-lg text-white tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                            {code.title}
                          </h3>
                        </div>

                        {/* Slip Preview Image if available */}
                        {code.previewImageUrl && (
                          <div
                            onClick={() => setPreviewSlipCode(code)}
                            className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-black/60 max-h-40 sm:max-h-48 cursor-pointer group/img flex items-center justify-center"
                          >
                            <img
                              src={code.previewImageUrl}
                              alt={`${code.title} betting slip preview`}
                              loading="lazy"
                              className="object-contain max-h-40 sm:max-h-48 w-full group-hover/img:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[2px]">
                              <Eye className="w-4 h-4 text-amber-400" />
                              <span>Click to Preview Slip</span>
                            </div>
                          </div>
                        )}

                        {/* Description / Matches preview */}
                        {code.description && (
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                            {code.description}
                          </p>
                        )}

                        {/* Odds & Expiration Display */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {/* Odds Card */}
                          <div className="bg-[#1E293B]/70 rounded-2xl p-2.5 sm:p-3 border border-slate-700/60 flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Total Odds
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
                                {Number(code.odds).toFixed(2)}x
                              </span>
                            </div>
                          </div>

                          {/* Expiration Countdown */}
                          <div
                            className={`rounded-2xl p-2.5 sm:p-3 border flex flex-col ${
                              expiry.isExpired
                                ? "bg-red-950/40 border-red-500/40 text-red-300"
                                : "bg-[#1E293B]/70 border-slate-700/60 text-slate-300"
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Expiration
                            </span>
                            <span
                              className={`text-xs font-black mt-1 truncate ${
                                expiry.isExpired ? "text-red-400 font-black" : "text-emerald-400"
                              }`}
                            >
                              {expiry.label}
                            </span>
                          </div>
                        </div>

                        {/* Protected Slip Code Box */}
                        <div className="bg-[#111C38] rounded-xl p-2.5 border border-amber-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
                              CODE: ••••••••
                            </span>
                          </div>
                          {code.previewImageUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewSlipCode(code)}
                              className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 mr-1" /> View Slip
                            </Button>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              Instant Reveal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Buy Button */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                            Price
                          </span>
                          <span className="text-lg sm:text-xl font-black text-white">
                            GH₵ {Number(code.price).toFixed(2)}
                          </span>
                        </div>

                        {expiry.isExpired ? (
                          <Button
                            disabled
                            className="rounded-xl bg-slate-800 text-slate-500 font-black text-xs uppercase px-4 h-10 border border-slate-700"
                          >
                            Expired ⚠️
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleOpenCheckout(code)}
                            className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 font-black text-xs uppercase tracking-wider px-4 sm:px-5 h-10 shadow-[0_2px_15px_rgba(245,158,11,0.25)] border border-amber-300/40 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <DollarSign className="w-4 h-4 fill-slate-950" />
                            <span>Buy Code 👑</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* 4. MY PURCHASED BOOKING CODES TAB */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                My Purchased Booking Codes
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                All booking codes you have bought are saved here with one-click copy and official links.
              </p>
            </div>
            <Badge className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-lg">
              {purchasedCodes.length} CODES BOUGHT
            </Badge>
          </div>

          {purchasedCodes.length === 0 ? (
            <Card className="rounded-3xl border-2 border-dashed border-slate-800 bg-[#0B132B]/40 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Ticket className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white mb-2">No Purchased Codes Yet</h4>
              <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6 font-medium">
                When you buy any booking codes, they will automatically appear here with full codes and instructions.
              </p>
              <Button
                onClick={() => setActiveTab("available")}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl px-6 text-xs uppercase cursor-pointer"
              >
                Browse Available Codes 👑
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchasedCodes.map((item) => {
                const pCfg = getPlatformConfig(item.bookmaker);
                return (
                  <Card
                    key={item.id}
                    className="rounded-3xl border-2 border-amber-500/30 bg-[#0F172A] p-4 sm:p-6 shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <PlatformLogo platform={item.bookmaker} className="h-5 w-auto max-w-[100px]" />
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[10px] uppercase">
                            {item.odds}x Odds
                          </Badge>
                        </div>
                        <h4 className="font-serif font-black text-base sm:text-lg text-white mt-2">
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        GH₵ {Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {/* High Contrast Monospace Revealed Code Box */}
                    <div className="bg-[#070D1E] rounded-2xl p-3.5 sm:p-4 border border-amber-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                          {item.bookmaker.toUpperCase()} BOOKING CODE
                        </span>
                        <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest select-all">
                          {item.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(item.code, `${item.bookmaker} Code`)}
                          className="h-10 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-xs flex items-center gap-1.5 cursor-pointer shadow-md flex-1 sm:flex-none justify-center"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </Button>

                        {pCfg.officialUrl && pCfg.officialUrl !== "#" && (
                          <a
                            href={pCfg.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 border border-slate-700"
                            title={`Open official ${item.bookmaker} website`}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Open</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                      <span className="truncate max-w-[180px]">Ref: {item.paymentReference || item.id}</span>
                      <span>
                        {item.createdAt?.seconds
                          ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                          : "Verified Purchase"}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. CHECKOUT & PAYMENT MODAL */}
      <Dialog open={!!checkoutCode} onOpenChange={(open) => !open && setCheckoutCode(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-3xl bg-[#0F172A] border border-slate-700 text-white p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase w-fit">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Purchase Booking Code</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-white">
              {checkoutCode?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Complete your payment to instantly reveal and copy your booking code.
            </DialogDescription>
          </DialogHeader>

          {checkoutCode && (
            <div className="space-y-4 pt-2">
              {/* Slip Summary Info */}
              <div className="bg-[#111C38] rounded-2xl p-4 border border-slate-700/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Platform:</span>
                  <div className="flex items-center gap-1.5">
                    <PlatformLogo platform={checkoutCode.bookmaker} className="h-5 w-auto" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Total Odds:</span>
                  <span className="font-black text-emerald-400">{Number(checkoutCode.odds).toFixed(2)}x Odds</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Expiration:</span>
                  <span className="font-bold text-slate-200">
                    {getRemainingTime(checkoutCode.expiresAt).label}
                  </span>
                </div>
                <div className="border-t border-slate-700/80 pt-2 flex justify-between items-center">
                  <span className="text-xs font-black text-white uppercase">Total Price:</span>
                  <span className="text-xl font-black text-amber-400">
                    GH₵ {Number(checkoutCode.price).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-bold text-slate-300">Email Address (for Code Delivery)</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="mt-1 h-11 bg-slate-900 border-slate-700 text-white rounded-xl text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Your code will be revealed instantly and saved to your account.
                  </span>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-300">
                    MoMo / Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0541234567 (optional)"
                    className="mt-1 h-11 bg-slate-900 border-slate-700 text-white rounded-xl text-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    You can also enter or choose your Mobile Money network directly on Paystack.
                  </span>
                </div>
              </div>

              {/* Action Buttons / Paystack Redirect Fallback */}
              {paystackAuthUrl ? (
                <div className="pt-2 flex flex-col gap-2.5">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1 text-center">
                    <p className="font-bold">Paystack Checkout is ready!</p>
                    <p className="text-[11px] text-slate-300">
                      If your browser did not automatically open Paystack, tap below to proceed:
                    </p>
                  </div>

                  <a
                    href={paystackAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 shadow-lg border border-amber-300/40 cursor-pointer text-center"
                  >
                    <span>Proceed to Paystack 👑 &rarr;</span>
                  </a>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCheckoutCode(null);
                      setPaystackAuthUrl(null);
                      setIsProcessingPayment(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isProcessingPayment}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 shadow-lg border border-amber-300/40 cursor-pointer"
                  >
                    {isProcessingPayment ? "Connecting to Paystack..." : `Pay GH₵ ${Number(checkoutCode.price).toFixed(2)} & Reveal Code 👑`}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCheckoutCode(null);
                      setPaystackAuthUrl(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. REVEALED CODE SUCCESS MODAL */}
      <Dialog open={!!revealedCodeData} onOpenChange={(open) => !open && setRevealedCodeData(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-3xl bg-[#0B132B] border-2 border-amber-400/50 text-white p-5 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-serif font-black text-white">
              Payment Successful! 👑
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs">
              Here is your verified booking code. Copy and load it into your betting app now.
            </DialogDescription>
          </DialogHeader>

          {revealedCodeData && (
            <div className="space-y-4 pt-2">
              {/* Platform Logo & Details */}
              <div className="flex items-center justify-center">
                <PlatformLogo platform={revealedCodeData.bookmaker} className="h-7 w-auto" />
              </div>

              {/* The Big Monospace Code Display */}
              <div className="bg-[#070D1E] rounded-3xl p-5 sm:p-6 border-2 border-amber-400 flex flex-col items-center justify-center text-center space-y-1.5 shadow-inner">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">
                  {revealedCodeData.bookmaker.toUpperCase()} BOOKING CODE
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-[0.2em] select-all py-1">
                  {revealedCodeData.code}
                </span>
                <span className="text-[11px] font-bold text-emerald-400">
                  {revealedCodeData.odds}x Total Odds Verified
                </span>
              </div>

              {/* One-Click Copy Button */}
              <Button
                size="lg"
                onClick={() => copyToClipboard(revealedCodeData.code, `${revealedCodeData.bookmaker} Code`)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                <span>Copy Booking Code</span>
              </Button>

              {/* Official Platform Direct Jump Button */}
              {revealedCodeData.officialUrl && revealedCodeData.officialUrl !== "#" && (
                <a
                  href={revealedCodeData.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-[#111C38] hover:bg-[#1A2A54] border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open {revealedCodeData.bookmaker} Official Platform</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              )}

              {/* Instructions on Loading the code */}
              <div className="bg-[#111C38] rounded-2xl p-4 border border-slate-700/80 text-left space-y-2 text-xs">
                <span className="font-bold text-amber-300 uppercase tracking-wider block">
                  How to Load Code in {revealedCodeData.bookmaker}:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 font-medium">
                  <li>Open your <strong>{revealedCodeData.bookmaker}</strong> App or Website.</li>
                  <li>Click on your Betslip / Tap <strong>"Load Bet"</strong> or <strong>"Booking Code"</strong>.</li>
                  <li>Paste <strong>{revealedCodeData.code}</strong> and tap Load.</li>
                  <li>Enter your stake and place your bet!</li>
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setRevealedCodeData(null);
                  setActiveTab("my_codes");
                }}
                className="w-full rounded-xl border-slate-700 text-slate-300 hover:text-white text-xs font-bold"
              >
                View in My Purchased Codes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. SLIP PREVIEW MODAL */}
      <Dialog open={!!previewSlipCode} onOpenChange={(open) => !open && setPreviewSlipCode(null)}>
        <DialogContent className="max-w-lg w-[95vw] rounded-3xl bg-[#0F172A] border border-slate-700 text-white p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <PlatformLogo platform={previewSlipCode?.bookmaker || ""} className="h-5 w-auto" />
              <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                {previewSlipCode?.odds}x Odds
              </Badge>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black text-white">
              {previewSlipCode?.title} — Slip Preview
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Preview verified slip details. The actual booking code is unlocked upon purchase.
            </DialogDescription>
          </DialogHeader>

          {previewSlipCode && (
            <div className="space-y-4 pt-2">
              {previewSlipCode.previewImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/60 max-h-[350px] flex items-center justify-center">
                  <img
                    src={previewSlipCode.previewImageUrl}
                    alt={previewSlipCode.title}
                    className="object-contain max-h-[350px] w-full"
                  />
                  {/* Subtle security watermark */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <span className="text-white/20 font-black text-2xl sm:text-3xl font-mono -rotate-12 select-none uppercase">
                      KING J DEALS PREVIEW
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
                  <Eye className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Verified match list included in slip: {previewSlipCode.description || "Analysis & predictions verified."}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-base sm:text-lg font-black text-white">
                  GH₵ {Number(previewSlipCode.price).toFixed(2)}
                </span>
                <Button
                  onClick={() => {
                    const c = previewSlipCode;
                    setPreviewSlipCode(null);
                    handleOpenCheckout(c);
                  }}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase px-5 cursor-pointer"
                >
                  Buy Code Now 👑
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
