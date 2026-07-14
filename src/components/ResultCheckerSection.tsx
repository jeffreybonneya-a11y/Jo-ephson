import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, CheckCircle2, AlertTriangle, Loader2, Minus, Plus, ChevronRight, Play } from 'lucide-react';
import waecBannerBg from '../assets/images/waec_banner_bg_1782934507804.jpg';
import { getApiUrl } from '../lib/api';

interface ResultCheckerSectionProps {
  agentContext?: any;
  isAgentUser?: boolean;
}

export default function ResultCheckerSection({ agentContext, isAgentUser }: ResultCheckerSectionProps) {
  const [activeCheckerTab, setActiveCheckerTab] = useState<'WASSCE' | 'BECE' | 'NOVDEC'>('WASSCE');
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerChecker, setPricePerChecker] = useState<number>(25);
  const [loadingPrice, setLoadingPrice] = useState<boolean>(true);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);

  // Real-time listener for Results Checker price settings
  useEffect(() => {
    if (agentContext) {
      if (agentContext.prices && typeof agentContext.prices.results_checker === 'number') {
        setPricePerChecker(agentContext.prices.results_checker);
      } else {
        // Fallback to the wholesale price of 19 GHC if the agent hasn't set one yet
        setPricePerChecker(19);
      }
      setLoadingPrice(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'settings', 'results_checker'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.pricePerChecker === 'number') {
          setPricePerChecker(data.pricePerChecker);
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
    setIsModalOpen(true);
  };

  const handlePay = async () => {
    if (!auth.currentUser) {
      toast.error("Please log in first to purchase a Results Checker voucher.");
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error("Mobile number is required.");
      return;
    }
    
    // Simple Ghana phone validation (10 digits starting with 0 or standard international)
    const phoneClean = mobileNumber.trim().replace(/\s/g, '');
    if (!/^\d{10,15}$/.test(phoneClean)) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    setIsSubmitting(true);

    let publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      try {
        const res = await fetch(getApiUrl("/api/paystack-public-key"));
        const resData = await res.json();
        publicKey = resData.publicKey;
      } catch (err) {
        console.error("Failed to fetch Paystack Public Key:", err);
      }
    }

    if (!publicKey) {
      toast.error("Paystack configuration is currently missing. Please contact support.");
      setIsSubmitting(false);
      return;
    }

    try {
      const finalOrderId = doc(collection(db, "orders")).id;

      // Pre-save order to Firestore with paymentStatus "pending" and status "pending" so the Admin can see it immediately!
      const initialOrderData = {
        email: auth.currentUser?.email || "no-email@example.com",
        serviceType: "Results Checker",
        examType: activeCheckerTab,
        quantity: quantity,
        amount: totalAmount,
        customerPhone: phoneClean,
        phone: phoneClean, // standard field
        network: "Result Checker", // standard field
        bundle: `Results Checker (${activeCheckerTab}) x${quantity}`, // standard field
        status: "pending",
        paymentStatus: "pending",
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
          wholesalePrice: 19 * quantity,
          wholesale_price: 19 * quantity,
          agentPrice: pricePerChecker * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - 19) * quantity,
          agent_profit: (pricePerChecker - 19) * quantity,
          profit_credited: false,
          profitAwarded: false,
        } : {})
      };

      await setDoc(doc(db, "orders", finalOrderId), initialOrderData);

      // If buyer is via an agent store, pre-create agent_orders entry too
      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: auth.currentUser?.displayName || "Royal Customer",
            email: auth.currentUser?.email || "no-email@example.com",
            phone: phoneClean,
            network: "Result Checker",
          },
          wholesale_price: 19 * quantity,
          agent_price: pricePerChecker * quantity,
          profit: (pricePerChecker - 19) * quantity,
          status: "pending",
          created_at: serverTimestamp(),
          paymentReference: finalOrderId,
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), initialAgentOrderData);
      }

      const mod = await import("@paystack/inline-js");
      let PaystackCtor: any = mod.default || mod;
      if (typeof PaystackCtor !== "function" && PaystackCtor.default) {
        PaystackCtor = PaystackCtor.default;
      }

      const paystack = new PaystackCtor();

      const userEmail = auth.currentUser?.email || "royal-results-checker@kingjdeals.com";

      paystack.newTransaction({
        key: publicKey,
        email: userEmail,
        amount: Math.round(totalAmount * 100), // GHS to pesewas
        currency: "GHS",
        reference: finalOrderId,
        callback_url: window.location.origin + "/?reference=" + finalOrderId,
        onSuccess: async (response: any) => {
          setIsSubmitting(true);
          try {
            // Update the existing order's paymentStatus and references
            const updateFields: any = {
              paymentStatus: "success",
              reference: response.reference
            };
            if (agentContext) {
              updateFields.profitAwarded = true;
              updateFields.profit_credited = true;
            }
            await updateDoc(doc(db, "orders", finalOrderId), updateFields);

            // Trigger success screen for 4 seconds
            setShowSuccessScreen(true);
            setIsSubmitting(false);

            setTimeout(() => {
              // State Reset after 4 seconds
              setShowSuccessScreen(false);
              setIsModalOpen(false);
              setQuantity(1);
              setMobileNumber('');
            }, 4000);

          } catch (orderErr: any) {
            console.error("Failed to update order in Firestore:", orderErr);
            toast.error(`Order saved locally but Firestore error: ${orderErr.message}`);
            setIsSubmitting(false);
          }
        },
        onClose: async () => {
          console.log("Paystack payment cancelled by user. Cleaning up pending order.");
          try {
            await deleteDoc(doc(db, "orders", finalOrderId));
            if (agentContext) {
              await deleteDoc(doc(db, "agent_orders", finalOrderId));
            }
          } catch (err) {
            console.error("Failed to delete cancelled order:", err);
          }
          toast.error("Payment session closed.");
          setIsSubmitting(false);
        }
      });

    } catch (error: any) {
      console.error("Failed to launch payment flow:", error);
      toast.error(`Payment initiation error: ${error.message}`);
      setIsSubmitting(false);
    }
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
                <div className="flex flex-col h-[85vh] max-h-[600px]">
                  {/* Header */}
                  <div className="p-6 border-b bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                        Instructions & Payment
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
                      <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{totalAmount} GHS</p>
                    </div>

                    <Button
                      disabled={isSubmitting || !mobileNumber.trim()}
                      onClick={handlePay}
                      className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Confirm & Pay`
                      )}
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
