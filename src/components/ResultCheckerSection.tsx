import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Smartphone, 
  Check, 
  Copy, 
  ArrowLeft, 
  Crown, 
  MessageSquare, 
  PhoneCall, 
  CreditCard,
  Minus,
  Plus,
  ChevronRight
} from 'lucide-react';
import waecBannerBg from '../assets/images/waec_banner_bg_1782934507804.jpg';
import { getApiUrl } from '../lib/api';
import { openPaystackPopup } from "../lib/paystack";

interface ResultCheckerSectionProps {
  agentContext?: any;
  isAgentUser?: boolean;
}

export default function ResultCheckerSection({ agentContext, isAgentUser }: ResultCheckerSectionProps) {
  const [activeCheckerTab, setActiveCheckerTab] = useState<'WASSCE' | 'BECE' | 'NOVDEC'>('WASSCE');
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerChecker, setPricePerChecker] = useState<number>(25);
  const [rcWholesalePrice, setRcWholesalePrice] = useState<number>(19);
  const [loadingPrice, setLoadingPrice] = useState<boolean>(true);
  const [isOutOfStock, setIsOutOfStock] = useState<boolean>(true);
  const [chargeSettings, setChargeSettings] = useState<{
    agentStoreCharge: number;
    retailResultsCheckerCharge: number;
    wholesaleResultsCheckerCharge: number;
  }>({
    agentStoreCharge: 0,
    retailResultsCheckerCharge: 0,
    wholesaleResultsCheckerCharge: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [showDetailedSteps, setShowDetailedSteps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);

  // Payment flow steps
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'select_method' | 'momo_pay' | 'momo_sent'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paystack'>('paystack');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');

  const MOMO_NUMBER = agentContext?.momo_number ? agentContext.momo_number.trim() : "0535884851";

  // Pre-load saved phone number if available
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('last_recipient_phone');
      if (savedPhone && !mobileNumber) {
        setMobileNumber(savedPhone);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const handlePhoneChange = (val: string) => {
    setMobileNumber(val);
    try {
      localStorage.setItem('last_recipient_phone', val);
    } catch (e) {}
  };

  // Real-time listener for Results Checker price settings and hidden charges
  useEffect(() => {
    if (agentContext) {
      if (agentContext.prices && typeof agentContext.prices.results_checker === 'number') {
        setPricePerChecker(agentContext.prices.results_checker);
      } else {
        setPricePerChecker(rcWholesalePrice);
      }
    }

    const unsubPrice = onSnapshot(doc(db, 'settings', 'results_checker'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (!agentContext && typeof data.pricePerChecker === 'number') {
          setPricePerChecker(data.pricePerChecker);
        }
        if (typeof data.wholesalePrice === 'number') {
          setRcWholesalePrice(data.wholesalePrice);
        }
        if (typeof data.inStock === 'boolean') {
          setIsOutOfStock(!data.inStock);
        } else if (typeof data.isOutOfStock === 'boolean') {
          setIsOutOfStock(data.isOutOfStock);
        } else if (typeof data.outOfStock === 'boolean') {
          setIsOutOfStock(data.outOfStock);
        } else {
          setIsOutOfStock(true);
        }
      } else {
        setIsOutOfStock(true);
      }
      setLoadingPrice(false);
    }, (error) => {
      console.error("Failed to load results checker settings:", error);
      setIsOutOfStock(true);
      setLoadingPrice(false);
    });

    const unsubCharges = onSnapshot(doc(db, 'settings', 'hidden_charges'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setChargeSettings({
          agentStoreCharge: typeof data.agentStoreCharge === 'number' ? data.agentStoreCharge : 0,
          retailResultsCheckerCharge: typeof data.retailResultsCheckerCharge === 'number' ? data.retailResultsCheckerCharge : (typeof data.resultsCheckerCharge === 'number' ? data.resultsCheckerCharge : 0),
          wholesaleResultsCheckerCharge: typeof data.wholesaleResultsCheckerCharge === 'number' ? data.wholesaleResultsCheckerCharge : 0,
        });
      }
    });

    return () => {
      unsubPrice();
      unsubCharges();
    };
  }, [agentContext]);

  const isWholesaleRC = !!(agentContext || isAgentUser);
  const rcUnitCharge = isWholesaleRC
    ? (Number(chargeSettings.wholesaleResultsCheckerCharge) || 0)
    : (Number(chargeSettings.retailResultsCheckerCharge) || 0);

  const totalAmount = quantity * pricePerChecker;
  const rcSurcharge = rcUnitCharge * quantity;
  const agentStoreSurcharge = agentContext ? (Number(chargeSettings.agentStoreCharge) || 0) : 0;
  const finalAmountToCharge = totalAmount + rcSurcharge + agentStoreSurcharge;

  const ensureUser = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      return auth.currentUser;
    }
    return null;
  };

  const handleOpenPurchaseFlow = () => {
    if (isOutOfStock) {
      toast.error("WAEC Results Checker is currently out of stock. Please check back soon! ⏳", {
        description: "New vouchers are being restocked.",
      });
      return;
    }
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      toast.error("Please log in before you can purchase any service! 👑", {
        description: "You must be signed in with your Google account to purchase Results Checkers.",
      });
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      return;
    }
    if (quantity < 1) {
      toast.error("Please select a quantity of 1 or more.");
      return;
    }
    setCheckoutStep('form');
    setIsModalOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard! 📋`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFormSubmit = async () => {
    if (isOutOfStock) {
      toast.error("WAEC Results Checker is currently out of stock.");
      return;
    }
    const activeUser = await ensureUser();
    if (!activeUser) {
      toast.error("Please log in before you can purchase any service! 👑", {
        description: "You must be signed in with your Google account to order.",
      });
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error("Mobile number is required.");
      return;
    }
    
    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    if (!/^\d{10,15}$/.test(phoneClean)) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    processPaystackPayment();
  };

  const processMoMoDirectPayment = async () => {
    const activeUser = await ensureUser();
    if (!activeUser) {
      toast.error("Please log in before you can purchase any service! 👑");
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      setIsSubmitting(false);
      return;
    }
    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    setIsSubmitting(true);

    const userEmail = activeUser.email || (phoneClean ? `${phoneClean}@customer.kingjdeals.com` : "customer@kingjdeals.com");
    const userName = activeUser.displayName || (phoneClean ? `Customer (${phoneClean})` : "Royal Customer");
    const userUid = activeUser.uid;

    try {
      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      // Use recipient phone number as the transfer reference code
      const generatedRef = phoneClean;

      const momoOrderData = {
        email: userEmail,
        serviceType: "Results Checker",
        examType: activeCheckerTab,
        quantity: quantity,
        amount: totalAmount,
        customerPhone: phoneClean,
        phone: phoneClean,
        network: "Result Checker",
        bundle: `Results Checker (${activeCheckerTab}) x${quantity}`,
        status: "pending_verification",
        paymentStatus: "pending_verification",
        paymentMethod: "momo_direct",
        createdAt: serverTimestamp(),
        userId: userUid,
        customerName: userName,
        reference: generatedRef,
        momoRefCode: generatedRef,
        momoNumber: MOMO_NUMBER,
        ...(isAgentUser ? { isAgentOrder: true } : {}),
        ...(agentContext ? {
          agentId: agentContext.id,
          agent_id: agentContext.id,
          agentName: agentContext.agent_name,
          agent_name: agentContext.agent_name,
          wholesalePrice: rcWholesalePrice * quantity,
          wholesale_price: rcWholesalePrice * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          agent_profit: (pricePerChecker - rcWholesalePrice) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : (isAgentUser && userUid ? {
          agentId: userUid,
          agent_id: userUid,
          agentName: userName,
          agent_name: userName,
          wholesalePrice: rcWholesalePrice * quantity,
          wholesale_price: rcWholesalePrice * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          agent_profit: (pricePerChecker - rcWholesalePrice) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : {}))
      };

      await setDoc(doc(db, "orders", finalOrderId), momoOrderData);

      if (agentContext) {
        const momoAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: userName,
            email: userEmail,
            phone: phoneClean,
            network: "Result Checker",
          },
          wholesale_price: rcWholesalePrice * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          status: "pending_verification",
          created_at: serverTimestamp(),
          paymentReference: generatedRef,
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), momoAgentOrderData);
      }

      setIsSubmitting(false);
      setCheckoutStep("momo_pay");
    } catch (err: any) {
      console.error("Result Checker MoMo Error:", err);
      toast.error("Could not generate MoMo details. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processPaystackPayment = async () => {
    const activeUser = await ensureUser();
    if (!activeUser) {
      toast.error("Please log in before you can purchase any service! 👑");
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      setIsSubmitting(false);
      return;
    }
    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    setIsSubmitting(true);

    const userEmail = activeUser.email || (phoneClean ? `${phoneClean}@customer.kingjdeals.com` : "customer@kingjdeals.com");
    const userName = activeUser.displayName || (phoneClean ? `Customer (${phoneClean})` : "Royal Customer");
    const userUid = activeUser.uid;

    try {
      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      const initialOrderData = {
        email: userEmail,
        serviceType: "Results Checker",
        examType: activeCheckerTab,
        quantity: quantity,
        amount: totalAmount,
        customerPhone: phoneClean,
        phone: phoneClean,
        network: "Result Checker",
        bundle: `Results Checker (${activeCheckerTab}) x${quantity}`,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "paystack",
        createdAt: serverTimestamp(),
        userId: userUid,
        customerName: userName,
        reference: finalOrderId,
        ...(isAgentUser ? { isAgentOrder: true } : {}),
        ...(agentContext ? {
          agentId: agentContext.id,
          agent_id: agentContext.id,
          agentName: agentContext.agent_name,
          agent_name: agentContext.agent_name,
          wholesalePrice: rcWholesalePrice * quantity,
          wholesale_price: rcWholesalePrice * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          agent_profit: (pricePerChecker - rcWholesalePrice) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : (isAgentUser && userUid ? {
          agentId: userUid,
          agent_id: userUid,
          agentName: userName,
          agent_name: userName,
          wholesalePrice: rcWholesalePrice * quantity,
          wholesale_price: rcWholesalePrice * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          agent_profit: (pricePerChecker - rcWholesalePrice) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : {}))
      };

      await setDoc(doc(db, "orders", finalOrderId), initialOrderData);

      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: userName,
            email: userEmail,
            phone: phoneClean,
            network: "Result Checker",
          },
          wholesale_price: rcWholesalePrice * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          status: "pending",
          created_at: serverTimestamp(),
          paymentReference: finalOrderId,
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), initialAgentOrderData);
      }

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
        console.warn("Could not retrieve Paystack public key dynamically:", pkErr);
      }

      try {
        toast.info("Launching secure checkout... 👑");
        const redirectTarget = (typeof window !== 'undefined' && window.location.origin && window.location.origin.includes('king-j-deals.onrender.com'))
          ? window.location.origin
          : 'https://king-j-deals.onrender.com';

        await openPaystackPopup({
          key: publicKey,
          email: userEmail,
          amount: Math.round(finalAmountToCharge * 100),
          currency: "GHS",
          ref: finalOrderId,
          onSuccess: (ref) => {
            toast.success("Payment completed successfully! Verifying... 👑");
            window.location.href = redirectTarget + "/?reference=" + ref;
          },
          onClose: () => {
            toast.warning("Payment window closed.");
            setIsSubmitting(false);
          }
        });
      } catch (popError) {
        console.warn("Paystack Inline popup failed or blocked. Falling back to secure redirect mode:", popError);
        const redirectTarget = (typeof window !== 'undefined' && window.location.origin && window.location.origin.includes('king-j-deals.onrender.com'))
          ? window.location.origin
          : 'https://king-j-deals.onrender.com';

        const initResponse = await fetch(getApiUrl("/api/paystack-initialize"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            amount: Math.round(finalAmountToCharge * 100),
            reference: finalOrderId,
            callback_url: redirectTarget + "/?reference=" + finalOrderId,
            currency: "GHS",
          }),
        });

        if (!initResponse.ok) {
          throw new Error("Failed to initialize payment gateway on server");
        }

        const initData = await initResponse.json();
        if (initData.success && initData.authorization_url) {
          toast.success("Redirecting to secure payment page... 👑");
          if (window.self !== window.top) {
            try {
              window.top.location.href = initData.authorization_url;
            } catch (redirectError) {
              window.location.href = initData.authorization_url;
            }
          } else {
            window.location.href = initData.authorization_url;
          }
        } else {
          throw new Error(initData.error || "Failed to retrieve redirection URL");
        }
      }
    } catch (error: any) {
      console.error("Failed to launch payment flow:", error);
      toast.error(`Payment initiation error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const processKorapayPayment = async () => {
    const activeUser = await ensureUser();
    if (!activeUser) {
      toast.error("Please log in before you can purchase any service! 👑");
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      setIsSubmitting(false);
      return;
    }
    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    setIsSubmitting(true);

    const userEmail = activeUser.email || (phoneClean ? `${phoneClean}@customer.kingjdeals.com` : "customer@kingjdeals.com");
    const userName = activeUser.displayName || (phoneClean ? `Customer (${phoneClean})` : "Royal Customer");
    const userUid = activeUser.uid;

    try {
      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      const orderData = {
        email: userEmail,
        serviceType: "Results Checker",
        examType: activeCheckerTab,
        quantity: quantity,
        amount: totalAmount,
        customerPhone: phoneClean,
        phone: phoneClean,
        network: "Result Checker",
        bundle: `Results Checker (${activeCheckerTab}) x${quantity}`,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "korapay",
        createdAt: serverTimestamp(),
        userId: userUid,
        customerName: userName,
        reference: finalOrderId,
        ...(isAgentUser ? { isAgentOrder: true } : {}),
        ...(agentContext ? {
          agentId: agentContext.id,
          agent_id: agentContext.id,
          agentName: agentContext.agent_name,
          agent_name: agentContext.agent_name,
          wholesalePrice: rcWholesalePrice * quantity,
          wholesale_price: rcWholesalePrice * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          agent_profit: (pricePerChecker - rcWholesalePrice) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : (isAgentUser && userUid ? {
          agentId: userUid,
          agent_id: userUid,
          agentName: userName,
          agent_name: userName,
          wholesalePrice: rcWholesalePrice * quantity,
          wholesale_price: rcWholesalePrice * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          agent_profit: (pricePerChecker - rcWholesalePrice) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : {}))
      };

      await setDoc(doc(db, "orders", finalOrderId), orderData);

      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: userName,
            email: userEmail,
            phone: phoneClean,
            network: "Result Checker",
          },
          wholesale_price: rcWholesalePrice * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - rcWholesalePrice) * quantity,
          status: "pending",
          created_at: serverTimestamp(),
          paymentReference: finalOrderId,
          paymentMethod: "korapay",
          payment_provider: "korapay",
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), initialAgentOrderData);
      }

      const initResponse = await fetch(getApiUrl("/api/korapay-initialize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "GHS",
          reference: finalOrderId,
          customer: {
            email: userEmail,
            name: userName
          },
          callback_url: window.location.origin + "/?reference=" + finalOrderId,
        }),
      });

      const initData = await initResponse.json();
      if (initData.success && initData.authorization_url) {
        toast.success("Redirecting to secure payment page... 👑");
        window.location.href = initData.authorization_url;
      } else {
        throw new Error(initData.error || "Failed to initialize Korapay");
      }
    } catch (error: any) {
      console.error("Korapay initiation error:", error);
      toast.error(`Korapay error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedPayment = () => {
    processPaystackPayment();
  };

  const handleWhatsAppContact = () => {
    const adminNum = agentContext?.momo_number || "233535884851";
    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    const text = encodeURIComponent(`Hello, I paid for Results Checker (${activeCheckerTab} x${quantity}) with reference ${phoneClean}. Please verify my order.`);
    window.open(`https://wa.me/${adminNum}?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Cover Banner Image */}
      <div 
        className="relative overflow-hidden rounded-3xl min-h-[220px] md:min-h-[280px] flex flex-col justify-center items-center text-center p-6 md:p-12 shadow-md border border-border bg-cover bg-center"
        style={{ backgroundImage: `url(${waecBannerBg})` }}
      >
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-slate-950/50" />

        {/* Banner Content */}
        <div className="relative z-10 space-y-3 max-w-2xl px-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
            <GraduationCap className="w-3.5 h-3.5 text-yellow-400" />
            Official WAEC Ghana
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-md">
            WAEC Results Checker Portal
          </h2>
          <p className="text-yellow-400 font-black tracking-widest text-xs md:text-sm uppercase drop-shadow-sm">
            WASSCE • BECE • NOVDEC
          </p>
          <p className="text-slate-300 font-bold text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Get your genuine serial numbers and PINs instantly via automated SMS. Safe, reliable, and swift.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Category Tabs & Purchase Selector */}
        <div className="md:col-span-7 space-y-6">
          {/* Out of Stock Alert Notice */}
          {isOutOfStock && (
            <div className="rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 p-5 sm:p-6 flex items-start gap-4 text-amber-950 dark:text-amber-200 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black uppercase tracking-wide text-amber-900 dark:text-amber-300">
                    Results Checker Out of Stock
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500 text-white tracking-wider">
                    Sold Out
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 font-medium leading-relaxed">
                  WAEC Results Checker vouchers (WASSCE, BECE, NOVDEC) are temporarily out of stock. Our inventory is currently being replenished. Purchases will reopen as soon as new stock arrives.
                </p>
              </div>
            </div>
          )}

          <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-primary">Step 1:</span> Choose Exam Type
              </h3>
              {isOutOfStock && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 tracking-wider">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Checker Sub-Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(['WASSCE', 'BECE', 'NOVDEC'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCheckerTab(tab)}
                  className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all cursor-pointer text-center select-none ${
                    activeCheckerTab === tab
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-black scale-[1.02]'
                      : 'bg-slate-50/50 dark:bg-slate-900 border-border text-muted-foreground hover:border-indigo-500/40 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="text-xs sm:text-sm tracking-wide font-black uppercase">{tab}</span>
                  <span className="text-[9px] opacity-80 mt-1 uppercase font-bold">Checker</span>
                  {isOutOfStock && (
                    <span className="mt-1 text-[8px] font-black text-amber-300 dark:text-amber-400 uppercase tracking-tighter">
                      No Stock
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Quantity of Vouchers
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {quantity} x {pricePerChecker} GHS
                </span>
              </div>
              <div className={`flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border-2 border-border max-w-sm ${isOutOfStock ? 'opacity-60' : ''}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-xl h-10 w-10 text-slate-600 dark:text-slate-300"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <input
                  type="number"
                  min="1"
                  disabled={isOutOfStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center font-black bg-transparent border-none text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-0 disabled:opacity-70"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-xl h-10 w-10 text-slate-600 dark:text-slate-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Recipient Phone Input (Quick Fill) */}
            <div className="space-y-1.5 pt-4 border-t border-dashed">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-amber-400" />
                  Recipient Mobile Number
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  SMS Voucher Delivery
                </span>
              </div>
              <Input
                type="tel"
                disabled={isOutOfStock}
                value={mobileNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="e.g. 0244123456"
                className="rounded-xl h-11 border-2 dark:bg-slate-900 dark:border-slate-800 text-foreground text-sm font-bold disabled:opacity-60"
              />
            </div>

            {/* Pricing Summary & Buy Button */}
            <div className="pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Amount</span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-amber-400 font-mono">
                  {loadingPrice ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `GHS ${totalAmount.toFixed(2)}`
                  )}
                </div>
              </div>

              <Button
                disabled={isOutOfStock || quantity < 1 || loadingPrice}
                onClick={handleOpenPurchaseFlow}
                className={`w-full sm:w-auto h-13 px-8 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isOutOfStock
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 cursor-pointer'
                }`}
              >
                {isOutOfStock ? (
                  <span>🚫 Out of Stock</span>
                ) : (
                  <>
                    <span>Buy for {totalAmount} GHS</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Simple Service Cards Info */}
        <div className="md:col-span-5 space-y-4">
          <Card className="rounded-3xl border border-border/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b p-5">
              <CardTitle className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-indigo-600 text-lg">💡</span> Official Checker Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs font-medium text-slate-500 leading-relaxed">
              <p>
                Each results checker voucher is valid for checking a single candidate's results up to 3 times on the official WAEC online portal.
              </p>
              <div className="border-l-2 border-indigo-500 pl-3 py-1 space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300">Supported Examinations:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>WASSCE (School & Private Candidates)</li>
                  <li>BECE (School & Private Candidates)</li>
                  <li>NOVDEC (Private Candidates)</li>
                </ul>
              </div>
              <p>
                Our server queries real-time databases and delivers valid login pins directly via SMS to your recipient mobile number.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ONE-TAP INSTRUCTIONS & RECIPIENT DETAILS MODAL (NO SCROLLING) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && !showSuccessScreen && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card - Single Screen Compact Layout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0B132B] rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-2xl z-10 p-5 sm:p-6 space-y-4 max-h-[95vh] overflow-y-auto"
            >
              {/* Success Screen Overlay */}
              {showSuccessScreen ? (
                <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-green-100 dark:bg-green-950/50 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-2">
                    Payment Successful ✅
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                    Your Serial Number and PIN will be sent via SMS to <span className="font-mono text-indigo-600 dark:text-amber-400">{mobileNumber}</span> shortly.
                  </p>
                </div>
              ) : checkoutStep === 'form' ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                          Instructions & Recipient Details
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          Direct SMS voucher delivery to recipient phone
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Summary & Price Banner */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-xs uppercase tracking-wide">
                        {activeCheckerTab}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Qty: <strong className="text-slate-900 dark:text-white">{quantity}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Total Due</span>
                      <span className="text-base font-black text-indigo-600 dark:text-amber-400 font-mono">
                        GH₵ {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Recipient Phone Input (Front & Center) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-amber-400" />
                        Recipient Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ⚡ Instant SMS delivery
                      </span>
                    </div>
                    <Input
                      type="tel"
                      autoFocus
                      disabled={isSubmitting}
                      value={mobileNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="e.g. 0244123456"
                      className="rounded-2xl h-12 text-sm sm:text-base font-black border-2 border-indigo-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-amber-400 dark:bg-slate-900 text-foreground"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Your Serial Number & 12-digit PIN will be sent via SMS to this phone.
                    </p>
                  </div>

                  {/* Quick 3-Step Instant Instructions Strip (Zero Scroll Required) */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                      <div className="w-5 h-5 mx-auto rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                        1
                      </div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">Instant SMS</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">PIN & Serial sent instantly</p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                      <div className="w-5 h-5 mx-auto rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                        2
                      </div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">WAEC Portal</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">ghana.waecdirect.org</p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                      <div className="w-5 h-5 mx-auto rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                        3
                      </div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">3 Checks</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">Check 1 student up to 3x</p>
                    </div>
                  </div>

                  {/* Optional Collapsible Detail Toggle */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowDetailedSteps(!showDetailedSteps)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {showDetailedSteps ? "▲ Hide detailed portal guide" : "▼ View full step-by-step portal instructions"}
                    </button>
                    {showDetailedSteps && (
                      <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-left text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                        <p>1. Enter 10-digit Index Number & Examination Year on WAECDIRECT.</p>
                        <p>2. Enter the Serial Number and 12-digit PIN received via SMS.</p>
                        <p>3. Click Submit and save/screenshot your results.</p>
                      </div>
                    )}
                  </div>

                  {/* One-Tap Action Button */}
                  <div className="pt-2">
                    <Button
                      disabled={!mobileNumber.trim() || isSubmitting}
                      onClick={handleFormSubmit}
                      className="w-full h-12 sm:h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs sm:text-sm tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <span>Pay GH₵ {totalAmount.toFixed(2)} Now</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : checkoutStep === 'select_method' ? (
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCheckoutStep("form")}
                          className="h-8 px-2 font-black text-xs text-slate-500 hover:text-foreground cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" /> BACK
                        </Button>
                      </div>

                      <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-amber-400/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-md">
                          <Crown className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                          SELECT PAYMENT METHOD 👑
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs max-w-sm mx-auto">
                          Choose how you want to pay GH₵ {finalAmountToCharge.toFixed(2)} for Results Checker ({activeCheckerTab} x{quantity})
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Option: Paystack Gateway */}
                        <div
                          onClick={() => processPaystackPayment()}
                          className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-md hover:scale-[1.01]`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-foreground dark:text-white uppercase tracking-tight">
                                Paystack Online Gateway
                              </p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Pay instantly with Mobile Money, Card, or Bank
                              </p>
                            </div>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-amber-500 bg-amber-500 text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        {/* Option: MoMo Direct */}
                        <div
                          onClick={() => processMoMoDirectPayment()}
                          className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between border-slate-200 dark:border-slate-800 hover:border-amber-500/50 bg-slate-50 dark:bg-slate-900 shadow-sm hover:scale-[1.01]`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-foreground dark:text-white uppercase tracking-tight">
                                Manual MoMo Transfer
                              </p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Direct mobile money transfer to admin
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        disabled={isSubmitting}
                        onClick={() => processPaystackPayment()}
                        className="w-full h-14 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider text-base"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="w-5 h-5" /> PROCEED WITH PAYSTACK 👑
                          </>
                        )}
                      </Button>
                    </div>
                  ) : checkoutStep === 'momo_pay' ? (
                    <div className="p-6 md:p-8 space-y-5 overflow-y-auto">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCheckoutStep("select_method")}
                          className="h-8 px-2 font-black text-xs text-slate-500 hover:text-foreground cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" /> BACK
                        </Button>
                      </div>

                      <div className="text-center space-y-1">
                        <div className="mx-auto w-12 h-12 bg-amber-400/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-md mb-2">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                          PAY DIRECTLY WITH MOMO 📱
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                          Transfer exact amount to the MoMo number below with reference code
                        </p>
                      </div>

                      {/* MoMo Details Card */}
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                        {/* 1. Total Amount */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              Order Total
                            </p>
                            <p className="text-lg font-black text-primary font-mono">
                              GH₵ {totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(totalAmount.toFixed(2), "Amount")}
                            className="h-9 px-3 gap-1.5 font-bold text-xs rounded-lg border-2"
                          >
                            {copiedField === "Amount" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-600" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </>
                            )}
                          </Button>
                        </div>

                        {/* 2. MoMo Number */}
                        <div className="flex items-center justify-between p-4 bg-yellow-400/20 dark:bg-yellow-500/20 rounded-2xl border-2 border-yellow-500 dark:border-yellow-400 shadow-md ring-2 ring-yellow-400/30">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-black uppercase bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                                MTN MoMo Number 📲
                              </span>
                              <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 animate-pulse">
                                (Send Payment Here)
                              </span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-yellow-300 font-mono tracking-wider">
                              {MOMO_NUMBER}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCopy(MOMO_NUMBER, "MoMo Number")}
                            className="h-10 px-4 gap-1.5 font-black text-xs rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 border-2 border-yellow-500 shadow-sm"
                          >
                            {copiedField === "MoMo Number" ? (
                              <>
                                <Check className="w-4 h-4 text-slate-950" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" /> Copy Number
                              </>
                            )}
                          </Button>
                        </div>

                        {/* 3. Generated Transfer Reference (Recipient Phone Number) */}
                        <div className="flex items-center justify-between p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl border-2 border-amber-500/30">
                          <div>
                            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                              Your Transfer Reference
                            </p>
                            <p className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                              {mobileNumber.trim().replace(/\s/g, '')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCopy(mobileNumber.trim().replace(/\s/g, ''), "Reference Code")}
                            className="h-9 px-3 gap-1.5 font-bold text-xs rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600"
                          >
                            {copiedField === "Reference Code" ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Dial Button */}
                      <a
                        href="tel:*170%23"
                        target="_self"
                        rel="noopener noreferrer"
                        onClick={() => setCheckoutStep("momo_sent")}
                        className="w-full h-12 sm:h-14 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm uppercase tracking-wider border-2 border-amber-500"
                      >
                        <PhoneCall className="w-5 h-5" /> DIAL *170#
                      </a>

                      {/* Instructions */}
                      <div className="bg-slate-100 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                          Step-by-step Instructions:
                        </p>
                        <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-semibold list-none pl-1">
                          <li>1. Select Transfer Money → MTN User.</li>
                          <li>2. Enter the MoMo number above (<span className="font-mono font-bold">{MOMO_NUMBER}</span>).</li>
                          <li>3. Enter GH₵ {totalAmount.toFixed(2)}.</li>
                          <li>4. Enter your phone number (<span className="font-mono font-bold text-amber-600 dark:text-amber-400">{mobileNumber.trim().replace(/\s/g, '')}</span>) as your transfer reference.</li>
                          <li>5. Confirm with your PIN.</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    /* momo_sent step */
                    <div className="text-center bg-white dark:bg-slate-950 h-full flex flex-col items-center justify-center p-6 md:p-8 space-y-6">
                      <div className="w-20 h-20 bg-amber-500 text-white rounded-3xl flex items-center justify-center shadow-2xl rotate-6 animate-bounce">
                        <Crown className="w-10 h-10" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                          ORDER AWAITING VERIFICATION 👑
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                          Thank you! Your payment for reference <span className="font-mono font-black text-amber-600 dark:text-amber-400 uppercase">{mobileNumber.trim().replace(/\s/g, '')}</span> has been logged and marked for verification.
                        </p>
                      </div>

                      <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-100 dark:border-slate-800 text-left space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 uppercase font-black">Reference</span>
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{mobileNumber.trim().replace(/\s/g, '')}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 uppercase font-black">Total Amount</span>
                          <span className="font-black text-primary text-sm">GH₵ {totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 uppercase font-black">Status</span>
                          <span className="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded uppercase text-[10px]">Awaiting Verification</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                        Our admin team will cross-check your reference against our MoMo records and send your Results Checker PIN via SMS shortly.
                      </p>

                      <div className="w-full flex flex-col gap-3 pt-2">
                        <Button
                          variant="default"
                          className="w-full h-12 text-sm font-black rounded-xl bg-slate-900 dark:bg-primary text-white dark:text-secondary shadow-lg hover:bg-black"
                          onClick={() => setIsModalOpen(false)}
                        >
                          CLOSE WINDOW 👑
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-12 text-xs font-black rounded-xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2"
                          onClick={handleWhatsAppContact}
                        >
                          <MessageSquare className="w-4 h-4" /> CONTACT ADMIN ON WHATSAPP
                        </Button>
                      </div>
                    </div>
                  )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
