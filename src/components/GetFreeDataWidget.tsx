import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, X, Loader2, Trophy, Frown, CheckCircle2, ChevronRight, Crown } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { openPaystackPopup } from '../lib/paystack';
import { getApiUrl } from '../lib/api';
import { toast } from 'sonner';

export const GetFreeDataWidget: React.FC = () => {
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Modal Stages: 'pay' | 'spin' | 'win_form' | 'win_success' | 'loss'
  const [stage, setStage] = useState<'pay' | 'spin' | 'win_form' | 'win_success' | 'loss'>('pay');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  
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
      setPaymentRef(ref);
      setStage('spin');
      setIsOpen(true);
      toast.success("Payment confirmed! Spin the wheel to claim your Free Data 🎡");
    }
  }, []);

  // 1. Listen for persistent admin toggle state
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "free_data"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsDisabled(!!data.disabled);
        } else {
          setIsDisabled(false);
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
    setStage('pay');
    setPaymentRef('');
    setPhone('');
    setIsSpinning(false);
    setWheelRotation(0);
    setHasSpun(false);
    setIsSubmitting(false);
  };

  // 2. Step 1: Handle Paystack Payment GH₵1
  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    const generatedRef = `FD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";

    const userEmail = (auth.currentUser?.email && auth.currentUser.email.includes("@"))
      ? auth.currentUser.email
      : "customer@kingjdeals.com";

    try {
      toast.info("Launching secure Paystack payment... 💳");
      await openPaystackPopup({
        key: publicKey,
        email: userEmail,
        amount: 100, // GH₵ 1.00 (100 pesewas)
        currency: "GHS",
        ref: generatedRef,
        onSuccess: (ref) => {
          setIsSubmitting(false);
          setPaymentRef(ref || generatedRef);
          setStage('spin');
          toast.success("Payment of GH₵1 Confirmed! Spin the wheel now 🎡");
        },
        onClose: () => {
          setIsSubmitting(false);
          toast.warning("Payment cancelled. You must complete payment to spin.");
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
            amount: 100,
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

  // 4. Step 3: Handle Claim Submission for Winner
  const handleClaimFreeData = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneClean = phone.trim().replace(/\s/g, '');
    if (!phoneClean || phoneClean.length < 9) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        email: auth.currentUser?.email || `${phoneClean}@customer.kingjdeals.com`,
        serviceType: "Free Data Win",
        orderType: "Free Data Win",
        isFreeDataWin: true,
        network: "Free Data",
        bundleName: "1GB Free Data Win",
        phone: phoneClean,
        amount: 1,
        quantity: 1,
        status: "pending",
        paymentStatus: "paid",
        paymentMethod: "paystack",
        reference: paymentRef || `FD_${Date.now()}`,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || "anonymous",
        customerName: auth.currentUser?.displayName || (phoneClean ? `Customer (${phoneClean})` : "Royal Customer"),
      };

      await addDoc(collection(db, "orders"), orderData);
      setIsSubmitting(false);
      setStage('win_success');
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
            setIsOpen(true);
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0B132B] border-2 border-amber-400/80 rounded-3xl p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(251,191,36,0.2)] overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={resetModalState}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Stage 1: Pay GH₵1 Gate */}
              {stage === 'pay' && (
                <div className="flex flex-col items-center text-center space-y-5 py-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg">
                    <Gift className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase text-amber-400 tracking-tight">
                      Get Free Data Promo 🎁
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed px-2">
                      Pay <span className="font-extrabold text-amber-300">GH₵1.00</span> via Paystack to unlock 1 spin on the Lucky Data Wheel! Win free data instantly!
                    </p>
                  </div>

                  <div className="w-full bg-slate-900/90 border border-amber-400/30 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-slate-300">Spin Gate Entry Fee</span>
                    <span className="text-xl font-black text-amber-400 font-mono">GH₵ 1.00</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleInitiatePayment}
                    className="w-full h-14 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Launching Paystack...
                      </>
                    ) : (
                      <>
                        Pay GH₵1 to Spin <ChevronRight className="w-5 h-5 stroke-[3]" />
                      </>
                    )}
                  </button>
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

              {/* Stage 3: Winner Claim Form */}
              {stage === 'win_form' && (
                <div className="flex flex-col items-center text-center space-y-5 py-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
                    <Trophy className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase text-amber-400 tracking-tight">
                      Win🎉 CONGRATULATIONS!
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      You won free data! Enter your phone number below to receive your bundle.
                    </p>
                  </div>

                  <form onSubmit={handleClaimFreeData} className="w-full space-y-4">
                    <div className="text-left space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Phone Number for Data
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 024XXXXXXX"
                        className="w-full h-13 px-4 rounded-xl bg-slate-900 border-2 border-amber-400/50 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> SUBMITTING CLAIM...
                        </>
                      ) : (
                        <>
                          CLAIM FREE DATA 🚀
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
                      Your Free Data claim for <span className="font-mono text-amber-300 font-bold">{phone}</span> has been logged in the admin dashboard. You will receive your data shortly!
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GetFreeDataWidget;
