import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface WaecPromoCardProps {
  onNavigateToChecker?: () => void;
}

export default function WaecPromoCard({ onNavigateToChecker }: WaecPromoCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (onNavigateToChecker) {
      onNavigateToChecker();
    } else {
      window.dispatchEvent(new CustomEvent('NAVIGATE_TO_RESULT_CHECKER'));
      const tabsElement = document.getElementById('bundle-tabs');
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div id="waec-promo-card" className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111C38] via-[#142247] to-[#111C38] border border-amber-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.25)] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-amber-500/45 group h-full"
      >
        {/* Subtle ambient gold background highlight */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-2xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-xl rounded-full pointer-events-none translate-y-1/2 -translate-x-1/3" />

        {/* Left / Center content */}
        <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          {/* Official WAEC Image / Logo */}
          <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center shadow-inner overflow-hidden">
            {!imgError ? (
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Waec_logo.png"
                alt="Official WAEC Logo"
                className="w-full h-full object-contain filter drop-shadow"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-indigo-600/30 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-7 h-7" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-[#111C38]" />
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                OFFICIAL PORTAL
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Instant PIN
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight leading-tight">
              WAEC Results Checker
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-tight mt-0.5">
              Check your WAEC results easily.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
          <Button
            id="buy-results-checker-promo-btn"
            onClick={handleClick}
            className="w-full sm:w-auto h-11 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 shadow-[0_2px_12px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 border border-amber-300/60 transition-all active:scale-95 cursor-pointer"
          >
            <span>Buy Results Checker</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
