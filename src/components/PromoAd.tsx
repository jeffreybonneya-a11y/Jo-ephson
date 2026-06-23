import React, { useState, useEffect } from 'react';
import { X, Crown, ArrowRight, BadgePercent, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PromoAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const hasClosedAd = sessionStorage.getItem('hasClosedAgentStoreAd');
    if (!hasClosedAd) {
      // Show ad on page load
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    if (timeLeft <= 0) {
      handleClose();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, timeLeft]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasClosedAgentStoreAd', 'true');
  };

  const handleActionClick = () => {
    window.dispatchEvent(new Event('NAVIGATE_TO_AGENT_STORE'));
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-0 left-0 right-0 z-[9999] p-4 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 150 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900/95 backdrop-blur-md text-white shadow-[0_10px_30px_rgba(245,158,11,0.2)] flex flex-col p-5 pointer-events-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 z-50 flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition-all active:scale-90 cursor-pointer"
            aria-label="Close ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Premium Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest">
              <Crown className="w-3 h-3 text-amber-500" />
              ROYAL DEAL
            </span>
            <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full ml-auto">
              closes in {timeLeft}s
            </span>
          </div>

          <h2 className="text-lg font-black uppercase tracking-tight text-white mb-1 flex items-center gap-1.5">
            👑 AGENT WHOLESALE PRICES
          </h2>
          
          <p className="text-[11px] text-slate-300 mb-3.5 leading-normal">
            Start your own reseller business or purchase bundles at direct wholesale prices and keep the profit!
          </p>

          {/* Price details grid - compact */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex flex-col p-2 rounded-xl bg-slate-800/40 border border-slate-800/60">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-tight text-slate-300">MTN DATA</span>
              </div>
              <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/10 w-fit">
                SAVE GHS 2.00
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-xl bg-slate-800/40 border border-slate-800/60">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-tight text-slate-300">TELECEL</span>
              </div>
              <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/10 w-fit">
                SAVE GHS 2.00
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-xl bg-slate-800/40 border border-slate-800/60">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-tight text-slate-300">AIRTELTIGO</span>
              </div>
              <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/10 w-fit">
                SAVE GHS 2.00
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-xl bg-slate-800/40 border border-slate-800/60">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-tight text-slate-300">FC MOBILE</span>
              </div>
              <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/10 w-fit">
                SAVE GHS 1.00
              </span>
            </div>
          </div>

          {/* Action Area */}
          <div className="space-y-3">
            <button
              onClick={handleActionClick}
              className="w-full h-10 text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 border-none cursor-pointer"
            >
              Activate Agent Prices Now
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Progress countdown */}
            <div className="space-y-1">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 60, ease: 'linear' }}
                  className="h-full bg-amber-500"
                />
              </div>
              <div className="flex items-center justify-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                Verified Agent Discounts Active
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PromoAd;
