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

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);

  // Payment flow steps
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'select_method' | 'momo_pay' | 'momo_sent'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'momo_direct' | 'paystack'>('momo_direct');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');

  const MOMO_NUMBER = agentContext?.momo_number ? agentContext.momo_number.trim() : "0535884851";

  // Real-time listener for Results Checker price settings
  useEffect(() => {
    if (agentContext) {
      if (agentContext.prices && typeof agentContext.prices.results_checker === 'number') {
        setPricePerChecker(agentContext.prices.results_checker);
      } else {
        setPricePerChecker(rcWholesalePrice);
      }
    }

    const unsub = onSnapshot(doc(db, 'settings', 'results_checker'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (!agentContext && typeof data.pricePerChecker === 'number') {
          setPricePerChecker(data.pricePerChecker);
        }
        if (typeof data.wholesalePrice === 'number') {
          setRcWholesalePrice(data.wholesalePrice);
        }
      }
      setLoadingPrice(false);
    }, (error) => {
      console.error("Failed to load results checker settings:", error);
      setLoadingPrice(false);
    });

    return () => unsub();
  }, [agentContext]);

  const totalAmount = quantity * pricePerChecker;

  const handleOpenPurchaseFlow = () => {
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

  const handleFormSubmit = () => {
    if (!auth.currentUser) {
      toast.error("Please log in first to purchase a Results Checker voucher.");
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

    setCheckoutStep('select_method');
  };

  const processMoMoDirectPayment = async () => {
    if (!auth.currentUser) {
      toast.error("Please log in first to purchase a Results Checker voucher.");
      return;
    }

    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    setIsSubmitting(true);

    try {
      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      // Use recipient phone number as the transfer reference code
      const generatedRef = phoneClean;

      const momoOrderData = {
        email: auth.currentUser?.email || "",
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
        userId: auth.currentUser?.uid || "anonymous",
        customerName: auth.currentUser?.displayName || "Royal Customer",
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
        } : {})
      };

      await setDoc(doc(db, "orders", finalOrderId), momoOrderData);

      if (agentContext) {
        const momoAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: auth.currentUser?.displayName || "Royal Customer",
            email: auth.currentUser?.email || "",
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
    if (!auth.currentUser) {
      toast.error("Please log in first to purchase a Results Checker voucher.");
      return;
    }

    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    setIsSubmitting(true);

    try {
      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      const initialOrderData = {
        email: auth.currentUser?.email || "",
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
        userId: auth.currentUser?.uid || "anonymous",
        customerName: auth.currentUser?.displayName || "Royal Customer",
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
        } : {})
      };

      await setDoc(doc(db, "orders", finalOrderId), initialOrderData);

      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: auth.currentUser?.displayName || "Royal Customer",
            email: auth.currentUser?.email || "",
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

      const userEmail = (auth.currentUser?.email && auth.currentUser.email.includes("@"))
        ? auth.currentUser.email
        : "customer@kingjdeals.com";

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
        await openPaystackPopup({
          key: publicKey,
          email: userEmail,
          amount: Math.round(totalAmount * 100),
          currency: "GHS",
          ref: finalOrderId,
          onSuccess: (ref) => {
            toast.success("Payment completed successfully! Verifying... 👑");
            window.location.href = window.location.origin + "/?reference=" + ref;
          },
          onClose: () => {
            toast.warning("Payment window closed.");
            setIsSubmitting(false);
          }
        });
      } catch (popError) {
        console.warn("Paystack Inline popup failed or blocked. Falling back to secure redirect mode:", popError);

        const initResponse = await fetch(getApiUrl("/api/paystack-initialize"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            amount: Math.round(totalAmount * 100),
            reference: finalOrderId,
            callback_url: window.location.origin + "/?reference=" + finalOrderId,
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

  const handleProceedPayment = () => {
    if (selectedPaymentMethod === "momo_direct") {
      processMoMoDirectPayment();
    } else {
      toast.error("Paystack online payment is currently unavailable. Please select Pay Directly with MoMo.");
    }
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
          <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-md">
            WAEC Results Checker Portal
          </h1>
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
          <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider border-b pb-3 flex items-center gap-2">
              <span className="text-primary">Step 1:</span> Choose Exam Type
            </h3>

            {/* Checker Sub-Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(['WASSCE', 'BECE', 'NOVDEC'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCheckerTab(tab)}
                  className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all cursor-pointer text-center select-none ${
                    activeCheckerTab === tab
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-black scale-[1.02]'
                      : 'bg-slate-50/50 dark:bg-slate-900 border-border text-muted-foreground hover:border-indigo-500/40 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="text-xs sm:text-sm tracking-wide font-black uppercase">{tab}</span>
                  <span className="text-[9px] opacity-80 mt-1 uppercase font-bold">Checker</span>
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
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border-2 border-border max-w-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-xl h-10 w-10 text-slate-600 dark:text-slate-300"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center font-black bg-transparent border-none text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-xl h-10 w-10 text-slate-600 dark:text-slate-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Pricing Summary & Buy Button */}
            <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Amount</span>
                <div className="text-3xl font-black text-indigo-600 font-mono">
                  {loadingPrice ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `GHS ${totalAmount.toFixed(2)}`
                  )}
                </div>
              </div>

              <Button
                disabled={quantity < 1 || loadingPrice}
                onClick={handleOpenPurchaseFlow}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Buy for {totalAmount} GHS <ChevronRight className="w-4 h-4" />
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

      {/* Step Flow Instructions Modal & Mobile Input form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && !showSuccessScreen && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-950 rounded-[2.5rem] border-4 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
            >
              {/* Success Screen Overlay */}
              {showSuccessScreen ? (
                <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-950">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-950/50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tight mb-4">
                    Payment Successful ✅
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-sm md:text-base leading-relaxed max-w-sm mx-auto">
                    Your Serial Number and PIN will be sent via SMS shortly.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-[85vh] max-h-[650px]">
                  {checkoutStep === 'form' ? (
                    <>
                      {/* Header */}
                      <div className="p-6 border-b bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                            Instructions & Recipient Details
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Review the steps for purchasing and using your checker below
                          </p>
                        </div>
                        <button
                          disabled={isSubmitting}
                          onClick={() => setIsModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold uppercase transition-colors"
                        >
                          Close
                        </button>
                      </div>

                      {/* Body Content */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                        {/* Instructions List */}
                        <div className="space-y-4">
                          <h4 className="font-black text-xs uppercase tracking-widest text-indigo-600">
                            Follow these steps:
                          </h4>

                          <div className="space-y-4">
                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                                1
                              </span>
                              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <p className="font-black text-slate-900 dark:text-white">Buy the Results Checker Voucher:</p>
                                <p className="mt-0.5">Enter your mobile number so the Serial Number and 12-digit PIN can be sent via SMS.</p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                                2
                              </span>
                              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <p className="font-black text-slate-900 dark:text-white">After receiving:</p>
                                <p className="mt-0.5">Visit WAECDIRECT Ghana.</p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                                3
                              </span>
                              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <p className="font-black text-slate-900 dark:text-white">Enter Candidate Details:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                  <li>Enter 10-digit Index Number.</li>
                                  <li>Select Type of Examination.</li>
                                  <li>Select Examination Year.</li>
                                </ul>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                                4
                              </span>
                              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <p className="font-black text-slate-900 dark:text-white">Enter Voucher Details:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                  <li>Serial Number</li>
                                  <li>12-digit PIN</li>
                                </ul>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                                5
                              </span>
                              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <p className="font-black text-slate-900 dark:text-white">Submit and wait.</p>
                                <p className="mt-0.5 text-[10px] text-amber-600 font-black uppercase">Note: Save screenshot or print result.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Form Section */}
                        <div className="border-t pt-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              Recipient Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="tel"
                              disabled={isSubmitting}
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              placeholder="e.g. 0244123456"
                              className="rounded-xl h-12 border-2 dark:bg-slate-900 dark:border-slate-800 text-foreground text-sm font-bold"
                            />
                          </div>

                          {/* Warning Message */}
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3 items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                              Ensure the mobile number is correct. Your Serial Number and PIN will be sent via SMS.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Price</span>
                          <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{totalAmount.toFixed(2)} GHS</p>
                        </div>

                        <Button
                          disabled={!mobileNumber.trim()}
                          onClick={handleFormSubmit}
                          className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          Confirm & Proceed <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
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
                          Choose how you want to pay GH₵ {totalAmount.toFixed(2)} for Results Checker ({activeCheckerTab} x{quantity})
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Option 1: Pay Directly with MoMo */}
                        <div
                          onClick={() => setSelectedPaymentMethod("momo_direct")}
                          className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            selectedPaymentMethod === "momo_direct"
                              ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-md"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-foreground dark:text-white uppercase tracking-tight">
                                Pay Directly with MoMo 📱
                              </p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Transfer directly using recipient number as reference
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPaymentMethod === "momo_direct"
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {selectedPaymentMethod === "momo_direct" && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Option 2: Paystack Gateway (Unavailable) */}
                        <div
                          onClick={() => {
                            toast.error("Paystack online payment is currently unavailable. Please use Pay Directly with MoMo.");
                          }}
                          className="cursor-not-allowed opacity-60 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/40 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-sm text-foreground/70 dark:text-white/70 uppercase tracking-tight">
                                  Paystack Online Gateway
                                </p>
                                <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  UNAVAILABLE
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Pay with Debit/Credit Card, Bank Account, or Mobile Money via Paystack
                              </p>
                            </div>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                            {selectedPaymentMethod === "paystack" && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      <Button
                        disabled={isSubmitting}
                        onClick={handleProceedPayment}
                        className="w-full h-14 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider text-base"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="w-5 h-5" /> PROCEED TO PAYMENT 👑
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
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
