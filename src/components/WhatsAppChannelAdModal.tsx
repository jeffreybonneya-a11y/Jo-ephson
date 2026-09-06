import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, X, Gift, Zap, Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { WHATSAPP_CHANNEL_URL } from '@/src/constants/links';

interface WhatsAppChannelAdModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function WhatsAppChannelAdModal({ forceOpen, onClose }: WhatsAppChannelAdModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if this modal was explicitly forced open via prop
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Auto-display once when a customer opens the site in their session
    const hasSeenInSession = sessionStorage.getItem('kingj_wa_channel_ad_seen');
    if (!hasSeenInSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('kingj_wa_channel_ad_seen', 'true');
      }, 700);

      return () => clearTimeout(timer);
    }

    // Custom event listener allowing any button or widget to open the ad modal
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('OPEN_WHATSAPP_CHANNEL_AD', handleCustomOpen);

    return () => {
      window.removeEventListener('OPEN_WHATSAPP_CHANNEL_AD', handleCustomOpen);
    };
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('kingj_wa_channel_ad_seen', 'true');
    if (onClose) onClose();
  };

  const handleJoinChannel = () => {
    try {
      window.open(WHATSAPP_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = WHATSAPP_CHANNEL_URL;
    }

    toast.success("Opening King J Deals WhatsApp Channel! 👑", {
      description: "Welcome to the royal community. Enjoy price discounts & exclusive rewards!",
      duration: 4000,
    });

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="whatsapp-channel-ad-overlay"
        className="fixed inset-0 z-[110] flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window: Scaled to fit within initial mobile viewport without requiring scroll */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md bg-[#0F172A] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(37,211,102,0.15)] text-white z-10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-ad-title"
        >
          {/* Top Royal & WhatsApp Dual Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#25D366] to-yellow-400" />

          {/* Close Button */}
          <button
            id="btn-close-wa-ad"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
            aria-label="Close WhatsApp Channel announcement"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Royal Pill Badge */}
          <div className="flex items-center justify-center mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>EXCLUSIVE CHANNEL ANNOUNCEMENT</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          {/* WhatsApp Channel Icon with Royal Crown */}
          <div className="relative flex justify-center items-center my-3">
            <div className="relative">
              {/* Outer Pulse Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-full blur-md animate-pulse" />
              
              {/* WhatsApp Circular Icon Container */}
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#1EBE5D] flex items-center justify-center shadow-[0_8px_25px_rgba(37,211,102,0.45)] border-2 border-white/30">
                {/* Official WhatsApp Logo SVG */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-9 h-9 fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>

                {/* Verified Green Badge */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0F172A] border-2 border-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Heading and Main Catchphrase */}
          <div className="text-center space-y-1.5 mb-3.5">
            <h2 
              id="wa-ad-title"
              className="font-serif text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent tracking-tight leading-tight"
            >
              Join the King J Deals WhatsApp Channel
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
              Get instant updates on <strong className="text-amber-300">discounts on prices</strong> and claim <strong className="text-emerald-300">more rewards at stake</strong>!
            </p>
          </div>

          {/* Feature Perks Box */}
          <div className="bg-[#111C38] border border-amber-500/20 rounded-2xl p-3 sm:p-3.5 space-y-2 mb-4 text-left">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs text-slate-200 leading-snug">
                <strong className="text-amber-300">Price Discount Alerts:</strong> Be first in line when bundle prices drop and flash sales launch.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-200 leading-snug">
                <strong className="text-emerald-300">Rewards at Stake:</strong> Exclusive giveaways, bonus data drops, and member reward contests.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xs text-slate-200 leading-snug">
                <strong className="text-blue-300">Instant Updates:</strong> Direct notifications on fast delivery servers and newly added services.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              id="btn-join-whatsapp-channel-ad"
              onClick={handleJoinChannel}
              size="lg"
              className="w-full h-13 sm:h-14 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 via-[#25D366] to-emerald-600 hover:brightness-110 active:scale-[0.98] text-slate-950 shadow-[0_6px_25px_rgba(37,211,102,0.4)] transition-all flex items-center justify-center gap-2 border border-emerald-300/40 cursor-pointer"
            >
              <span>Join WhatsApp Channel</span>
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </Button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Maybe Later • Continue to King J Deals
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
