import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Gift, ArrowRight, Sparkles, Trophy, Zap } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FreeDataPromoCardProps {
  onOpenModal?: () => void;
}

export default function FreeDataPromoCard({ onOpenModal }: FreeDataPromoCardProps) {
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(1);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "free_data"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsDisabled(!!data.disabled);
          if (data.price !== undefined && data.price !== null) {
            setPrice(Number(data.price));
          }
        }
      },
      (err) => {
        console.warn("Failed to listen for free_data in promo card:", err);
      }
    );
    return () => unsub();
  }, []);

  if (isDisabled) return null;

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      window.dispatchEvent(new CustomEvent('OPEN_FREE_DATA_MODAL'));
    }
  };

  return (
    <div id="free-data-promo-card" className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111C38] via-[#1A1A40] to-[#111C38] border border-amber-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.25)] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-amber-500/45 group h-full"
      >
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 blur-2xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-xl rounded-full pointer-events-none translate-y-1/2 -translate-x-1/3" />

        {/* Content */}
        <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          {/* Visual Icon Badge */}
          <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 p-1.5 flex items-center justify-center shadow-[0_4px_16px_rgba(245,158,11,0.35)] overflow-hidden">
            <Gift className="w-7 h-7 stroke-[2.5] animate-bounce" style={{ animationDuration: '2.5s' }} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-[#111C38]" />
          </div>

          {/* Text Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                LUCKY SPIN & WIN
              </span>
              <span className="text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                {price <= 0 ? "100% Free" : `GH₵${price.toFixed(2)} Entry`}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight leading-tight">
              Get Free Data Promo
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-tight mt-0.5">
              Spin the lucky wheel & win data instantly.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
          <Button
            id="claim-free-data-promo-btn"
            onClick={handleClick}
            className="w-full sm:w-auto h-11 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 shadow-[0_2px_12px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 border border-amber-300/60 transition-all active:scale-95 cursor-pointer"
          >
            <span>Claim Free Data 🎁</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
