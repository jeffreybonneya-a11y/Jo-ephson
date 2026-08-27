import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, X, Loader2, Trophy, Frown, CheckCircle2, ChevronRight, Crown } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { openPaystackPopup } from '../lib/paystack';
import { getApiUrl } from '../lib/api';
import { toast } from 'sonner';

export const GetFreeDataWidget: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [servicePrice, setServicePrice] = useState<number>(1);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Listen for Auth changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubAuth();
  }, []);

  // Listen for external open trigger
  useEffect(() => {
    const handleTrigger = () => {
      handleOpenModal();
    };
    window.addEventListener('OPEN_FREE_DATA_MODAL', handleTrigger);
    return () => window.removeEventListener('OPEN_FREE_DATA_MODAL', handleTrigger);
  }, [currentUser, servicePrice]);
  
  // Modal Stages: 'pay' | 'spin' | 'win_form' | 'win_success' | 'loss'
  const [stage, setStage] = useState<'pay' | 'spin' | 'win_form' | 'win_success' | 'loss'>('pay');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [network, setNetwork] = useState<string>('MTN');
  
  // Spin state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [hasSpun, setHasSpun] = useState<boolean>(false);

  const isDraggingRef = useRef<boolean>(false);

  // Check URL parameters for return from Paystack redirect payment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    const isFdWin = params.get('fd_win') === 'true' || (ref && (ref.startsWith('FD_') || ref.startsWith('FREE_DATA_')));

    if (ref && isFdWin) {
      if (!auth.currentUser && !currentUser) {
        toast.error("Please login to claim your Free Data spin! 🎁");
        window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
        return;
      }
      setPaymentRef(ref);
      setStage('spin');
      setIsOpen(true);
      toast.success("Payment confirmed! Spin the wheel to claim your Free Data 🎡");
    }
  }, [currentUser]);

  // 1. Listen for persistent admin toggle state and price
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "free_data"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsDisabled(!!data.disabled);
          if (data.price !== undefined && data.price !== null) {
            setServicePrice(Number(data.price));
          } else {
            setServicePrice(1);
          }
        } else {
          setIsDisabled(false);
          setServicePrice(1);
        }
      },
      (err) => {
        console.warn("Failed to listen for free_data settings:", err);
      }
    );
    return () => unsub();
  }, []);

  // Do not render floating widget if service is disabled by Admin
  if (isDisabled) return null;

  const resetModalState = () => {
    setIsOpen(false);
    setStage(servicePrice <= 0 ? 'spin' : 'pay');
    setPaymentRef('');
    setPhone('');
    setNetwork('MTN');
    setIsSpinning(false);
    setWheelRotation(0);
    setHasSpun(false);
    setIsSubmitting(false);
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    if (servicePrice <= 0) {
      setStage('spin');
    } else {
      setStage('pay');
    }
  };

  // 2. Step 1: Handle Payment / Free Spin Entry
  const handleInitiatePayment = async () => {
    const activeUser = currentUser || auth.currentUser;

    if (servicePrice <= 0) {
      setStage('spin');
      toast.success("Spin unlocked for FREE! 🎁");
      return;
    }

    setIsSubmitting(true);
    const generatedRef = `FD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
    const pesewas = Math.round(servicePrice * 100);

    const userEmail = activeUser?.email && activeUser.email.includes("@")
      ? activeUser.email
      : "customer@kingjdeals.com";

    try {
      toast.info("Launching secure Paystack payment... 💳");
      await openPaystackPopup({
        key: publicKey,
        email: userEmail,
        amount: pesewas,
        currency: "GHS",
        ref: generatedRef,
        onSuccess: (ref) => {
          setIsSubmitting(false);
          setPaymentRef(ref || generatedRef);
          setStage('spin');
          toast.success(`Payment of GH₵${servicePrice.toFixed(2)} Confirmed! Spin the wheel now 🎡`);
        },
        onClose: () => {
          setIsSubmitting(false);
          toast.warning("Payment cancelled. Complete payment to spin.");
        }
      });
    } catch (err: any) {
      console.warn("Paystack Inline popup blocked or failed. Launching Paystack payment fallback:", err);
      try {
        const redirectTarget = (typeof window !== 'undefined' && window.location.origin)
          ? window.location.origin
          : 'https://king-j-deals.onrender.com';
        
        const initResponse = await fetch(getApiUrl("/api/paystack-initialize"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            amount: pesewas,
            reference: generatedRef,
            callback_url: `${redirectTarget}/?reference=${generatedRef}&fd_win=true`,
            currency: "GHS",
          }),
        });

        if (!initResponse.ok) {
          throw new Error("Failed to initialize Paystack transaction on server.");
        }

        const initData = await initResponse.json();
        if (initData.success && initData.authorization_url) {
          toast.success("Redirecting to Paystack payment gateway... 💳");
          if (window.self !== window.top) {
            try {
              window.top.location.href = initData.authorization_url;
            } catch {
              window.location.href = initData.authorization_url;
            }
          } else {
            window.location.href = initData.authorization_url;
          }
        } else {
          throw new Error(initData.error || "Could not generate Paystack checkout link.");
        }
      } catch (fallbackErr: any) {
        setIsSubmitting(false);
        console.error("Paystack payment initialization failed:", fallbackErr);
        toast.error("Could not launch Paystack payment screen. Please try again.");
      }
    }
  };

  // 3. Step 2: Trigger Genuinely Random Spin
  const handleTriggerSpin = () => {
    if (isSpinning || hasSpun) return;
    
    setIsSpinning(true);
    setHasSpun(true);

    // Standard 50/50 truly random outcome
    const isWin = Math.random() < 0.5;

    // 5 full rotations (1800 deg) + offset for segment
    // Segment 1 (Win): 0deg to 180deg (center ~90deg) -> 1800 + 90 = 1890deg
    // Segment 2 (Try again): 180deg to 360deg (center ~270deg) -> 1800 + 270 = 2070deg
    const targetDegree = isWin ? 1890 : 2070;
    setWheelRotation(targetDegree);

    setTimeout(() => {
      setIsSpinning(false);
      if (isWin) {
        setStage('win_form');
        toast.success("🎉 WINNER! You won Free Data!");
      } else {
        setStage('loss');
      }
    }, 3500);
  };

  // 4. Step 3: Handle Claim Submission for Winner (Only after winning spin)
  const handleClaimFreeData = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = currentUser || auth.currentUser;

    const phoneClean = phone.trim().replace(/\s/g, '');
    if (!phoneClean || phoneClean.length < 9) {
      toast.error("Please enter a valid phone number (at least 9 digits).");
      return;
    }

    if (!network) {
      toast.error("Please select your mobile network.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        email: activeUser?.email || `${phoneClean}@customer.kingjdeals.com`,
        serviceType: "Free Data Win",
        orderType: "Free Data Win",
        isFreeDataWin: true,
        network: network,
        bundle: `1GB ${network} Free Data Win`,
        bundleName: `1GB ${network} Free Data Win`,
        phone: phoneClean,
        amount: Number(servicePrice || 0),
        quantity: 1,
        status: "pending",
        paymentStatus: servicePrice > 0 ? "paid" : "free_promo",
        paymentMethod: servicePrice > 0 ? "paystack" : "free_promo",
        reference: paymentRef || `FD_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        createdAt: serverTimestamp(),
        userId: activeUser?.uid || "free_data_winner",
        customerName: activeUser?.displayName || (phoneClean ? `Customer (${phoneClean})` : "Royal Winner"),
      };

      await addDoc(collection(db, "orders"), orderData);
      setIsSubmitting(false);
      setStage('win_success');
      toast.success("Order submitted successfully to Admin! 🚀");
    } catch (err: any) {
      setIsSubmitting(false);
      console.error("Error creating Free Data Win order:", err);
      toast.error("Failed to submit claim. Please try again.");
    }
  };

  return (
    <>
      {/* Floating Draggable Widget Button */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.05}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 150);
        }}
        onClick={() => {
          if (!isDraggingRef.current) {
            handleOpenModal();
          }
        }}
        initial={{ scale: 0, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
        transition={{
          y: {
            duration: 2.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          },
          scale: { duration: 0.3 },
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-28 right-4 md:bottom-32 md:right-8 z-[999] cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <div className="relative group">
          {/* Outer glowing pulsing aura */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-80 blur-md animate-pulse group-hover:opacity-100 transition-opacity" />

          {/* Main button pill */}
          <div className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0B132B] text-amber-300 border-2 border-amber-400 shadow-[0_12px_30px_rgba(11,19,43,0.7),0_0_20px_rgba(251,191,36,0.5)] backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
              <Gift className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400/90">
                PROMO
              </span>
              <span className="font-black text-xs uppercase tracking-wider text-amber-300 drop-shadow-sm flex items-center gap-1">
                Get free data
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin ml-0.5" style={{ animationDuration: '4s' }} />
          </div>
        </div>
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-[#0B132B] border-2 border-amber-400 rounded-3xl p-4 sm:p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(251,191,36,0.25)] my-auto max-h-[95vh] flex flex-col"
            >
              {/* Top ambient gold glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-2xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

              {/* Close Button */}
              <button
                type="button"
                onClick={resetModalState}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all z-10 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto overflow-x-hidden scrollbar-hide flex-1">
                {/* Stage 1: Pay / Free Entry Gate */}
                {stage === 'pay' && (
                  <div className="flex flex-col items-center text-center space-y-3 py-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
                      <Gift className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-black uppercase tracking-wider mb-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        Free Data Lucky Spin
                      </div>
                      <h3 className="text-lg sm:text-xl font-black uppercase text-slate-100 tracking-tight leading-tight">
                        Get Free Data Promo 🎁
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium leading-snug px-2">
                        {servicePrice <= 0 ? (
                          <>Spin the Lucky Data Wheel for <span className="font-extrabold text-amber-300 uppercase">100% FREE</span> & win instant data!</>
                        ) : (
                          <>Pay <span className="font-extrabold text-amber-300">GH₵{servicePrice.toFixed(2)}</span> to unlock 1 spin on the Lucky Data Wheel!</>
                        )}
                      </p>
                    </div>

                    {/* Checkout summary breakdown */}
                    <div className="w-full bg-slate-900/90 border border-amber-400/30 rounded-2xl p-3 space-y-1.5 text-left shrink-0">
                      <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                        <span className="text-slate-400 font-medium">Service Package</span>
                        <span className="font-bold text-slate-200">1x Wheel Spin (Win 1GB Data)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                        <span className="text-slate-400 font-medium">Supported</span>
                        <span className="font-bold text-amber-400">MTN • Telecel • AT</span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] uppercase font-extrabold text-slate-300">Amount Due</span>
                        <span className="text-xl font-black text-amber-400 font-mono leading-none">
                          {servicePrice <= 0 ? "FREE" : `GH₵ ${servicePrice.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    {/* Direct Pay Action Button */}
                    <div className="w-full pt-1 shrink-0">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleInitiatePayment}
                        className="w-full h-11 sm:h-12 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(245,158,11,0.3)] uppercase tracking-wider text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Launching...
                          </>
                        ) : servicePrice <= 0 ? (
                          <>
                            SPIN FOR FREE NOW 🎡 <ChevronRight className="w-4 h-4 stroke-[3]" />
                          </>
                        ) : (
                          <>
                            Pay GH₵{servicePrice.toFixed(2)} to Spin <ChevronRight className="w-4 h-4 stroke-[3]" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[9px] text-slate-400 flex items-center justify-center gap-1 shrink-0 m-0">
                      <span>🔒 Secured by Paystack (MoMo & Card)</span>
                    </p>
                  </div>
                )}

              {/* Stage 2: Spin Wheel */}
              {stage === 'spin' && (
                <div className="flex flex-col items-center text-center space-y-6 py-2">
                  <h3 className="text-2xl font-black uppercase text-amber-400 tracking-tight">
                    Lucky Wheel 🎡
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Payment verified! Tap <span className="text-amber-300 font-bold">SPIN THE WHEEL</span> to test your luck.
                  </p>

                  {/* Wheel Container */}
                  <div className="relative w-64 h-64 my-2 flex items-center justify-center">
                    {/* Top Pointer Arrow */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md" />

                    {/* Rotating Wheel Canvas/SVG */}
                    <div
                      className="w-full h-full rounded-full border-4 border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.4)] overflow-hidden relative"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.85, 0.35, 1)' : 'none',
                      }}
                    >
                      {/* Top Half: Win */}
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-yellow-400 flex items-start justify-center pt-8 text-slate-950 font-black text-lg uppercase tracking-wider">
                        Win 🎉
                      </div>
                      {/* Bottom Half: Try Again */}
                      <div 
                        className="absolute inset-0 bg-slate-900 flex items-end justify-center pb-8 text-slate-300 font-black text-lg uppercase tracking-wider border-t-2 border-amber-400/40"
                        style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}
                      >
                        Try again
                      </div>

                      {/* Center Hub */}
                      <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#0B132B] border-2 border-amber-400 text-amber-300 flex items-center justify-center font-black text-xs shadow-lg z-10">
                        KING-J
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSpinning || hasSpun}
                    onClick={handleTriggerSpin}
                    className="w-full h-14 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSpinning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> SPINNING...
                      </>
                    ) : (
                      <>
                        SPIN THE WHEEL 🎡
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Stage 3: Winner Claim Form (Number and network type taken here after winning spin) */}
              {stage === 'win_form' && (
                <div className="flex flex-col items-center text-center space-y-4 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-amber-400 tracking-tight">
                      🎉 CONGRATULATIONS! YOU WON!
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      Select your network and enter your phone number to receive your free data bundle.
                    </p>
                  </div>

                  <form onSubmit={handleClaimFreeData} className="w-full space-y-3.5 text-left">
                    {/* 1. Select Network */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                        1. Select Mobile Network
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'MTN', name: 'MTN', color: 'border-yellow-400 bg-yellow-400/10 text-yellow-400' },
                          { id: 'Telecel', name: 'Telecel', color: 'border-red-500 bg-red-500/10 text-red-400' },
                          { id: 'AT', name: 'AT', color: 'border-blue-400 bg-blue-400/10 text-blue-400' },
                        ].map((net) => {
                          const isSelected = network === net.id;
                          return (
                            <button
                              key={net.id}
                              type="button"
                              onClick={() => setNetwork(net.id)}
                              className={`h-11 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? `${net.color} shadow-md ring-2 ring-amber-400/50 scale-[1.02]`
                                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              {net.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Recipient Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                        2. Phone Number for Data Delivery
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0244123456"
                        className="w-full h-12 px-3.5 rounded-xl bg-slate-900 border-2 border-amber-400/50 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all text-sm"
                      />
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-13 sm:h-14 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.35)] uppercase tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> SUBMITTING CLAIM...
                        </>
                      ) : (
                        <>
                          CLAIM FREE {network} DATA 🚀
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Stage 4: Win Success Confirmation */}
              {stage === 'win_success' && (
                <div className="flex flex-col items-center text-center space-y-5 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase text-emerald-400 tracking-tight">
                      Claim Submitted! 👑
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">
                      Your Free Data claim for <span className="font-bold text-amber-300">{network}</span> (<span className="font-mono text-amber-300 font-bold">{phone}</span>) has been logged in the admin dashboard. You will receive your data shortly!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetModalState}
                    className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl uppercase tracking-wider text-xs transition-all"
                  >
                    CLOSE
                  </button>
                </div>
              )}

              {/* Stage 5: Loss Message */}
              {stage === 'loss' && (
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Frown className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-200 tracking-tight">
                      Try again
                    </h3>
                    <p className="text-lg font-bold text-amber-300 mt-2">
                      better luck next time bud🥲
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetModalState}
                    className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl uppercase tracking-wider text-xs transition-all"
                  >
                    CLOSE
                  </button>
                </div>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GetFreeDataWidget;
