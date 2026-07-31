import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, X, Trophy, RefreshCw, CheckCircle2, Loader2, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { openPaystackPopup } from '../lib/paystack';
import { getApiUrl } from '../lib/api';

interface FreeDataFloatingWidgetProps {
  // Optional props if needed
}

export default function FreeDataFloatingWidget(_props: FreeDataFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'payment' | 'spinning' | 'won' | 'lost'>('payment');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string>('');
  
  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinCompleted, setSpinCompleted] = useState(false);
  
  // Claim state
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Drag vs Click detection
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
    if (dist > 6) {
      isDraggingRef.current = true;
    }
  };

  const handleWidgetClick = () => {
    if (isDraggingRef.current) return;
    setIsOpen(true);
  };

  // Step 1: Process Paystack Payment of GH₵1
  const handlePaystackPayment = async () => {
    setIsPaying(true);
    try {
      const activeUser = auth.currentUser;
      const userEmail = (activeUser?.email && activeUser.email.includes("@"))
        ? activeUser.email
        : "customer@kingjdeals.com";

      let publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
      try {
        const pkRes = await fetch(getApiUrl("/api/paystack-public-key"));
        const pkData = await pkRes.json();
        if (pkData?.publicKey) {
          publicKey = pkData.publicKey;
        }
      } catch (e) {
        console.warn("Using default Paystack public key:", e);
      }

      const generatedRef = `FREE_DATA_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await openPaystackPopup({
        key: publicKey,
        email: userEmail,
        amount: 100, // 100 pesewas = GH₵1.00
        currency: "GHS",
        ref: generatedRef,
        onSuccess: (ref) => {
          setIsPaying(false);
          setPaymentRef(ref || generatedRef);
          setStep('spinning');
          toast.success("Payment confirmed! Your spin is unlocked 🎉");
        },
        onClose: () => {
          setIsPaying(false);
          toast.info("Payment popup closed.");
        }
      });
    } catch (err) {
      console.error("Paystack error:", err);
      setIsPaying(false);
      toast.error("Failed to start Paystack payment. Please try again.");
    }
  };

  // Step 2: Trigger spin
  const handleSpinWheel = () => {
    if (isSpinning || spinCompleted) return;
    setIsSpinning(true);

    // Truly random outcome (50/50 odds)
    const isWin = Math.random() < 0.5;

    // Wheel segments (8 segments total, alternating Win and Try Again)
    // Even indices (0, 2, 4, 6) = Win 🎉
    // Odd indices (1, 3, 5, 7) = Try again 🥲
    const winSegments = [0, 2, 4, 6];
    const lossSegments = [1, 3, 5, 7];

    const chosenSegmentList = isWin ? winSegments : lossSegments;
    const targetSegment = chosenSegmentList[Math.floor(Math.random() * chosenSegmentList.length)];

    // Calculate rotation: 5 full spins (1800 deg) + target angle offset
    // Segment size = 360 / 8 = 45 deg
    // Segment 0 center is at 22.5 deg. Pointer is at top (270 or 90 deg relative to rotation).
    const segmentAngle = 45;
    const offset = segmentAngle * targetSegment + 22.5;
    const totalRotation = wheelRotation + 1800 + (360 - (offset % 360));

    setWheelRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinCompleted(true);
      if (isWin) {
        setStep('won');
        toast.success("WINNER! You won free data! 🎉");
      } else {
        setStep('lost');
      }
    }, 3800);
  };

  // Step 3: Handle Claim submission for Winners
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 9) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const orderId = doc(collection(db, "orders")).id;
      const cleanPhone = phone.trim();
      const activeUser = auth.currentUser;
      const userEmail = (activeUser?.email && activeUser.email.includes("@"))
        ? activeUser.email
        : `${cleanPhone}@customer.kingjdeals.com`;
      const userName = activeUser?.displayName || `Free Data Winner (${cleanPhone})`;

      await setDoc(doc(db, "orders", orderId), {
        id: orderId,
        bundle: "Free Data Win",
        serviceType: "Free Data Win",
        network: network,
        phone: cleanPhone,
        amount: 1,
        price: 1,
        quantity: 1,
        status: "paid",
        paymentStatus: "success",
        paymentMethod: "paystack",
        reference: paymentRef || `FREE_DATA_${orderId}`,
        customerName: userName,
        email: userEmail,
        createdAt: serverTimestamp(),
        userId: activeUser?.uid || "guest_free_data"
      });

      setClaimSubmitted(true);
      toast.success("Free Data Order submitted to Admin! 👑");
    } catch (err) {
      console.error("Error submitting claim:", err);
      toast.error("Failed to submit claim. Please try again.");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const resetModal = () => {
    setIsOpen(false);
    // Delay resetting steps slightly so closing animation looks smooth
    setTimeout(() => {
      setStep('payment');
      setIsPaying(false);
      setPaymentRef('');
      setIsSpinning(false);
      setSpinCompleted(false);
      setPhone('');
      setClaimSubmitted(false);
    }, 300);
  };

  return (
    <>
      {/* 1. Floating Draggable Widget */}
      <motion.div
        drag
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ right: 24, bottom: 24 }}
        className="fixed z-[9999] touch-none select-none cursor-move"
        style={{ touchAction: 'none' }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={handleWidgetClick}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(11,19,43,0.5)] border-2 border-amber-400 bg-[#0B132B] text-amber-300 hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/20 text-amber-300">
            <Gift className="w-4 h-4 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 group-hover:text-amber-200">
              Get Free Data 🎁
            </span>
            <span className="text-[9px] font-bold text-amber-400/80 -mt-0.5">
              Spin to Win!
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-[#0B132B] text-white shadow-2xl"
            >
              {/* Header bar */}
              <div className="flex items-center justify-between p-5 border-b border-amber-400/20 bg-[#070D1E]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-amber-300 uppercase tracking-wide">
                      Get Free Data Service 🎁
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      Pay GH₵1 Paystack to Spin & Win!
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetModal}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* STEP 1: PAYMENT GATE */}
                {step === 'payment' && (
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                      <Zap className="w-10 h-10 animate-pulse text-amber-400" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-white">
                        Unlock Your Lucky Spin 🎡
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed px-4">
                        Pay a small fee of <span className="text-amber-300 font-bold">GH₵1.00</span> via Paystack to unlock a genuinely random spin wheel for a chance to win free data!
                      </p>
                    </div>

                    <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-amber-400/20 flex items-center justify-between text-left">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Entry Ticket</span>
                        <p className="font-black text-sm text-white">1x Lucky Spin Wheel</p>
                      </div>
                      <span className="text-lg font-black text-amber-300">GH₵ 1.00</span>
                    </div>

                    <button
                      disabled={isPaying}
                      onClick={handlePaystackPayment}
                      className="w-full h-13 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5" /> Pay GH₵1 via Paystack & Spin 👑
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 2: SPIN WHEEL */}
                {step === 'spinning' && (
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        Payment Verified ✅
                      </span>
                      <h4 className="text-xl font-black text-white">
                        Spin the Lucky Wheel! 🎡
                      </h4>
                    </div>

                    {/* Wheel Container */}
                    <div className="relative w-56 h-56 my-2 flex items-center justify-center">
                      {/* Wheel Pointer */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />

                      {/* Rotating Wheel */}
                      <div
                        className="w-full h-full rounded-full border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all duration-[3500ms] cubic-bezier(0.15, 0.9, 0.2, 1) overflow-hidden relative bg-[#070D1E]"
                        style={{ transform: `rotate(${wheelRotation}deg)` }}
                      >
                        {/* 8 Wheel Segments */}
                        {[
                          { text: "Win🎉", bg: "#FBBF24", color: "#0B132B" },
                          { text: "Try again", bg: "#1E293B", color: "#F8FAFC" },
                          { text: "Win🎉", bg: "#FBBF24", color: "#0B132B" },
                          { text: "Try again", bg: "#1E293B", color: "#F8FAFC" },
                          { text: "Win🎉", bg: "#FBBF24", color: "#0B132B" },
                          { text: "Try again", bg: "#1E293B", color: "#F8FAFC" },
                          { text: "Win🎉", bg: "#FBBF24", color: "#0B132B" },
                          { text: "Try again", bg: "#1E293B", color: "#F8FAFC" },
                        ].map((seg, idx) => (
                          <div
                            key={idx}
                            className="absolute top-0 left-0 w-full h-full origin-center flex items-center justify-center"
                            style={{
                              transform: `rotate(${idx * 45}deg)`,
                              clipPath: "polygon(50% 50%, 50% 0%, 85.35% 14.65%)",
                              backgroundColor: seg.bg,
                            }}
                          >
                            <span
                              className="absolute top-6 font-black text-[11px] uppercase tracking-tighter"
                              style={{
                                color: seg.color,
                                transform: "rotate(22.5deg)",
                              }}
                            >
                              {seg.text}
                            </span>
                          </div>
                        ))}

                        {/* Center Hub */}
                        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#0B132B] border-2 border-amber-400 shadow-md flex items-center justify-center z-10">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isSpinning || spinCompleted}
                      onClick={handleSpinWheel}
                      className="w-full h-13 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSpinning ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Spinning Wheel...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" /> SPIN NOW! 🎡
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 3: WON */}
                {step === 'won' && (
                  <div className="space-y-5 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                      <Trophy className="w-9 h-9 animate-bounce" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-amber-300 uppercase tracking-tight">
                        Congratulations! 🎉
                      </h4>
                      <p className="text-xs text-slate-300 font-medium">
                        You won Free Data! Enter your recipient phone number below to claim your prize.
                      </p>
                    </div>

                    {!claimSubmitted ? (
                      <form onSubmit={handleClaimSubmit} className="space-y-4 text-left">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Select Network
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {['MTN', 'Telecel', 'AirtelTigo'].map((net) => (
                              <button
                                key={net}
                                type="button"
                                onClick={() => setNetwork(net)}
                                className={`py-2 rounded-xl text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                                  network === net
                                    ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                              >
                                {net}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 0551234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full h-12 px-4 rounded-xl bg-slate-900 border-2 border-slate-800 text-white font-mono text-sm focus:border-amber-400 focus:outline-none transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingClaim}
                          className="w-full h-13 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingClaim ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting Claim...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Claim Free Data Now 🚀
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="p-5 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/30 text-emerald-300 space-y-3">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <h5 className="font-black text-base uppercase">Order Created!</h5>
                        <p className="text-xs text-emerald-200/80 leading-relaxed">
                          Your Free Data order for <span className="font-bold">{phone}</span> ({network}) has been logged in the admin dashboard and will be fulfilled shortly.
                        </p>
                        <button
                          onClick={resetModal}
                          className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase text-xs tracking-wider hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: LOST */}
                {step === 'lost' && (
                  <div className="flex flex-col items-center text-center space-y-5 py-4">
                    <div className="text-5xl animate-pulse">🥲</div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-amber-300 uppercase tracking-tight">
                        Hard Luck!
                      </h4>
                      <p className="text-sm font-bold text-slate-300">
                        better luck next time bud🥲
                      </p>
                    </div>
                    <button
                      onClick={resetModal}
                      className="w-full h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs tracking-wider transition-all cursor-pointer"
                    >
                      Close
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
}
