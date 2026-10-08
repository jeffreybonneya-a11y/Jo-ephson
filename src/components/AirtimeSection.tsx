import React, { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  CreditCard,
  Crown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { getApiUrl } from "@/src/lib/api";
import { openPaystackPopup } from "@/src/lib/paystack";

interface AirtimeSectionProps {
  profile?: any;
  agentContext?: any;
}

const MTN_PREFIXES = ["024", "025", "053", "054", "055", "059"];
const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200];

export default function AirtimeSection({ profile, agentContext }: AirtimeSectionProps) {
  const [airtimeSettings, setAirtimeSettings] = useState<{
    enabled: boolean;
    serviceCharge: number;
  }>({
    enabled: true,
    serviceCharge: 1.0,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form State
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [airtimeAmount, setAirtimeAmount] = useState<number>(10);
  const [customAmountInput, setCustomAmountInput] = useState<string>("10");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Listen for real-time Airtime Settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "airtime"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAirtimeSettings({
            enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
            serviceCharge:
              typeof data.serviceCharge === "number" && data.serviceCharge >= 0
                ? data.serviceCharge
                : 1.0,
          });
        } else {
          setAirtimeSettings({
            enabled: true,
            serviceCharge: 1.0,
          });
        }
        setLoadingSettings(false);
      },
      (err) => {
        console.warn("Notice: settings/airtime listener error:", err);
        setLoadingSettings(false);
      }
    );

    return () => unsub();
  }, []);

  // Pre-fill phone number from local storage or profile if available
  useEffect(() => {
    if (!recipientPhone) {
      const savedPhone = localStorage.getItem("last_recipient_phone") || profile?.phone;
      if (savedPhone) {
        const cleaned = savedPhone.replace(/\s+/g, "").replace(/^\+233/, "0");
        if (cleaned.length === 10) {
          setRecipientPhone(cleaned);
        }
      }
    }
  }, [profile]);

  const cleanPhone = recipientPhone.replace(/\s+/g, "").replace(/^\+233/, "0");
  const isTenDigits = cleanPhone.length === 10;
  const prefix = cleanPhone.substring(0, 3);
  const isMtnPrefix = MTN_PREFIXES.includes(prefix);
  const isPhoneValid = isTenDigits && isMtnPrefix;

  const handleAmountSelect = (val: number) => {
    setAirtimeAmount(val);
    setCustomAmountInput(String(val));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomAmountInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setAirtimeAmount(parsed);
    }
  };

  const serviceFee = airtimeSettings.serviceCharge;
  const totalAmountToPay = Number((airtimeAmount + serviceFee).toFixed(2));

  const handleInitiatePayment = async () => {
    if (!airtimeSettings.enabled) {
      toast.error("Airtime service is currently offline for maintenance.");
      return;
    }

    if (!isPhoneValid) {
      if (!isTenDigits) {
        toast.error("Please enter a valid 10-digit phone number (e.g. 0244123456).");
      } else if (!isMtnPrefix) {
        toast.error(
          "Airtime is currently available exclusively for MTN numbers (024, 025, 053, 054, 055, 059)."
        );
      }
      return;
    }

    if (!airtimeAmount || airtimeAmount < 1) {
      toast.error("Please enter a valid airtime amount of at least GH₵1.00.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please log in to purchase airtime!", {
        description: "You must be signed in with your Google account to order.",
      });
      window.dispatchEvent(new CustomEvent("OPEN_AUTH_MODAL"));
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem("last_recipient_phone", cleanPhone);

    const generatedRef = `KJD-AIRTIME-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;
    const userEmail =
      currentUser.email ||
      profile?.email ||
      `${cleanPhone}@customer.kingjdeals.com`;
    const customerDisplayName =
      profile?.fullName || currentUser.displayName || `Customer (${cleanPhone})`;

    try {
      // 1. Pre-save pending order in Firestore
      const orderPayload = {
        id: generatedRef,
        reference: generatedRef,
        referenceCode: generatedRef,
        paystackReference: generatedRef,
        userId: currentUser.uid,
        customerName: customerDisplayName,
        email: userEmail,
        customerEmail: userEmail,
        phone: cleanPhone,
        customerPhone: cleanPhone,
        recipientPhone: cleanPhone,
        network: "MTN",
        recipientNetwork: "MTN",
        bundle: `MTN Airtime - GH₵${airtimeAmount.toFixed(2)}`,
        bundleName: `MTN Airtime - GH₵${airtimeAmount.toFixed(2)}`,
        category: "Airtime",
        serviceType: "airtime",
        airtimeAmount: airtimeAmount,
        serviceFee: serviceFee,
        amount: totalAmountToPay,
        amountSent: totalAmountToPay,
        currency: "GHS",
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "Paystack",
        payment_provider: "paystack",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "orders", generatedRef), orderPayload);
      console.log("[Airtime] Pre-saved pending order:", generatedRef);

      // 2. Fetch Paystack Public Key
      let publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
      try {
        const pkRes = await fetch(getApiUrl("/api/paystack-public-key"));
        if (pkRes.ok) {
          const pkData = await pkRes.json();
          if (pkData.publicKey) publicKey = pkData.publicKey;
        }
      } catch (pkErr) {
        console.warn("Could not retrieve Paystack public key dynamically:", pkErr);
      }

      // 3. Open Paystack Inline Checkout
      const redirectTarget =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://kingjdeals.site";

      try {
        toast.info("Opening secure payment window...");
        await openPaystackPopup({
          key: publicKey,
          email: userEmail,
          amount: Math.round(totalAmountToPay * 100),
          currency: "GHS",
          ref: generatedRef,
          metadata: {
            service: "airtime",
            serviceType: "airtime",
            recipientPhone: cleanPhone,
            airtimeAmount: airtimeAmount,
            serviceFee: serviceFee,
            network: "MTN",
          },
          onSuccess: (verifiedRef) => {
            toast.success("Payment received! Processing your MTN Airtime...");
            setCompletedOrder({
              id: verifiedRef || generatedRef,
              recipientPhone: cleanPhone,
              airtimeAmount,
              serviceFee,
              totalAmount: totalAmountToPay,
            });
            setIsSubmitting(false);

            // Trigger background verification
            fetch(getApiUrl("/api/verify-payment"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: verifiedRef || generatedRef }),
            }).catch((err) => console.warn("Airtime verify-payment background:", err));
          },
          onClose: () => {
            toast.warning("Payment window closed.");
            setIsSubmitting(false);
          },
        });
      } catch (popupErr) {
        console.warn(
          "Paystack Inline popup blocked or failed. Using secure server redirect:",
          popupErr
        );

        const initRes = await fetch(getApiUrl("/api/paystack-initialize"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            amount: Math.round(totalAmountToPay * 100),
            reference: generatedRef,
            callback_url: `${redirectTarget}/?reference=${generatedRef}&method=paystack`,
            currency: "GHS",
            serviceType: "airtime",
            recipientPhone: cleanPhone,
            airtimeAmount: airtimeAmount,
            customerPhone: cleanPhone,
            customerName: customerDisplayName,
            metadata: {
              service: "airtime",
              serviceType: "airtime",
              recipientPhone: cleanPhone,
              airtimeAmount: airtimeAmount,
              serviceFee: serviceFee,
              network: "MTN",
            },
          }),
        });

        if (!initRes.ok) {
          throw new Error("Failed to initialize airtime payment gateway.");
        }

        const initData = await initRes.json();
        if (initData.success && initData.authorization_url) {
          toast.success("Redirecting to secure payment page...");
          window.location.href = initData.authorization_url;
        } else {
          throw new Error(initData.error || "Unable to retrieve payment URL.");
        }
      }
    } catch (err: any) {
      console.error("Airtime Order Initiation Error:", err);
      toast.error(err.message || "Could not start payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div id="airtime-service-container" className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] border-2 border-amber-500/30 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              MTN GHANA EXCLUSIVE 🇬🇭
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>BUY AIRTIME</span>
              <Crown className="w-6 h-6 text-amber-400" />
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-lg font-medium leading-relaxed">
              Top up any MTN Ghana phone number instantly with any amount. Manual royal processing delivered within 5–15 minutes.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Service Fee:
            </span>
            <div className="text-xl font-black text-amber-400 flex items-center gap-1 font-mono">
              GH₵{serviceFee.toFixed(2)}
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              Per Transaction
            </span>
          </div>
        </div>
      </div>

      {/* Offline Alert if Admin Disabled Service */}
      {!loadingSettings && !airtimeSettings.enabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-xs font-bold">
            Airtime service is currently paused for maintenance. Please check back shortly or explore our data bundles!
          </div>
        </div>
      )}

      {/* Success Modal / Screen */}
      <AnimatePresence>
        {completedOrder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 md:p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 text-slate-900 dark:text-white shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-emerald-800 dark:text-emerald-300">
                  Airtime Order Received!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Reference: <span className="font-mono font-black">{completedOrder.id}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Recipient:</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">{completedOrder.recipientPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Airtime:</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">GH₵{completedOrder.airtimeAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Service Fee:</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">GH₵{completedOrder.serviceFee.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Total Paid:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">GH₵{completedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Our dispatch team has queued your MTN Airtime transfer. You can track progress in your{" "}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("NAVIGATE_TO_MY_ORDERS"));
                }}
                className="text-amber-500 font-black underline underline-offset-2 hover:text-amber-600"
              >
                My Orders
              </button>{" "}
              page.
            </div>

            <Button
              id="airtime-order-another-btn"
              onClick={() => {
                setCompletedOrder(null);
                setAirtimeAmount(10);
                setCustomAmountInput("10");
              }}
              className="bg-[#0B132B] hover:bg-slate-800 text-amber-400 font-black rounded-xl text-xs h-10 uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Order Another Airtime
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!completedOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Purchase Card */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-6">
                {/* Step 1: Recipient Phone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="airtime-phone-input" className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                      1. MTN Phone Number
                    </Label>
                    {recipientPhone && (
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPhoneValid
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {isPhoneValid ? "Valid MTN Number ✓" : "Invalid MTN Number"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      id="airtime-phone-input"
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="e.g. 0244123456 or 0541557530"
                      className="h-12 text-base font-mono font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-visible:ring-amber-500 pl-4 pr-10 bg-slate-50/50 dark:bg-slate-900/50"
                    />
                    {isPhoneValid && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Allowed MTN prefixes:{" "}
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      024, 025, 053, 054, 055, 059
                    </span>
                  </p>
                </div>

                {/* Step 2: Airtime Amount */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <Label htmlFor="airtime-custom-amount" className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    2. Choose Airtime Amount (GH₵)
                  </Label>

                  {/* Quick Select Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {QUICK_AMOUNTS.map((amt) => {
                      const isSelected = airtimeAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          id={`airtime-chip-${amt}`}
                          onClick={() => handleAmountSelect(amt)}
                          className={`h-11 rounded-2xl font-black text-xs font-mono transition-all flex items-center justify-center cursor-pointer border-2 ${
                            isSelected
                              ? "bg-amber-400 text-slate-950 border-amber-500 shadow-md scale-105"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400/50"
                          }`}
                        >
                          GH₵{amt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Manual Amount Input */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Or Enter Custom Amount:
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                        GH₵
                      </span>
                      <Input
                        id="airtime-custom-amount"
                        type="number"
                        min="1"
                        step="0.5"
                        value={customAmountInput}
                        onChange={handleCustomAmountChange}
                        placeholder="Enter any amount"
                        className="h-12 pl-12 text-base font-mono font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-visible:ring-amber-500 bg-slate-50/50 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown & Payment Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-[#0B132B]/5 via-white to-white dark:from-[#0B132B]/40 dark:via-slate-950 dark:to-slate-950 shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    Order Summary
                  </h3>
                  <Badge className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5">
                    MTN GHANA
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Airtime Value:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      GH₵{airtimeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Processing Service Charge:</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      GH₵{serviceFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Recipient Number:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {isPhoneValid ? cleanPhone : "—"}
                    </span>
                  </div>

                  <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800 pt-3 flex items-baseline justify-between">
                    <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Total To Pay:
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-amber-500">
                        GH₵{totalAmountToPay.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Royal Fast Fulfillment
                  </div>
                  <p>
                    Admin processes and credits your airtime directly to your SIM. Status is live in your account dashboard.
                  </p>
                </div>

                <Button
                  id="airtime-submit-pay-btn"
                  disabled={isSubmitting || !airtimeSettings.enabled || !isPhoneValid || airtimeAmount < 1}
                  onClick={handleInitiatePayment}
                  className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SECURE CHECKOUT...
                    </>
                  ) : (
                    <>
                      PAY GH₵{totalAmountToPay.toFixed(2)} WITH PAYSTACK
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
