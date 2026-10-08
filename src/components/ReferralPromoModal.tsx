import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, X, Share2, Copy, Check, Gift, Users, Zap, ExternalLink, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

interface ReferralPromoModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
  user?: any;
  profile?: UserProfile | null;
}

const OFFICIAL_BASE_DOMAIN = 'www.kingjdeals.site';
const OFFICIAL_BASE_URL = 'https://www.kingjdeals.site';

export default function ReferralPromoModal({
  forceOpen = false,
  onClose,
  user,
  profile,
}: ReferralPromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasCopiedBeforeShare, setHasCopiedBeforeShare] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('kingj_referral_link_copied') === 'true';
    }
    return false;
  });
  const [promoDisabled, setPromoDisabled] = useState(false);
  const [customRewardText, setCustomRewardText] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>('KINGJ');
  const [copyFeedbackVisible, setCopyFeedbackVisible] = useState(false);

  // 1. Generate or fetch personal referral code
  useEffect(() => {
    let code = '';

    if (profile?.referralCode) {
      code = profile.referralCode;
    } else if (user?.uid) {
      // Create stable personal code based on user UID or phone
      const savedCode = localStorage.getItem(`kj_ref_code_${user.uid}`);
      if (savedCode) {
        code = savedCode;
      } else {
        const uidSuffix = user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
        code = `KJD-${uidSuffix || 'VIP'}`;
        localStorage.setItem(`kj_ref_code_${user.uid}`, code);
        // Persist non-blockingly to user profile in firestore
        try {
          updateDoc(doc(db, 'users', user.uid), { referralCode: code }).catch(() => {
            // Non-blocking fallback
          });
        } catch {
          // ignore
        }
      }
    } else {
      // Guest customer: create or reuse persistent guest code
      const guestSaved = localStorage.getItem('kj_guest_referral_code');
      if (guestSaved) {
        code = guestSaved;
      } else {
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        code = `KJD-${rand}`;
        localStorage.setItem('kj_guest_referral_code', code);
      }
    }

    setReferralCode(code);
  }, [user, profile]);

  // 2. Listen to Admin Settings in Firestore for Referral Promo status
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'referral_promo'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setPromoDisabled(Boolean(data.disabled));
          if (data.rewardDescription) {
            setCustomRewardText(data.rewardDescription);
          }
        }
      },
      (err) => {
        console.warn('Failed to listen for referral_promo settings:', err);
      }
    );
    return () => unsub();
  }, []);

  // 3. Handle Auto-Display & Custom Trigger Events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen to custom open event triggered by buttons across the site
    const handleTriggerOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('OPEN_REFERRAL_MODAL', handleTriggerOpen);

    // If explicitly forced open via prop
    if (forceOpen) {
      setIsOpen(true);
      return () => {
        window.removeEventListener('OPEN_REFERRAL_MODAL', handleTriggerOpen);
      };
    }

    // Auto-display logic:
    // Only auto-display if promo is enabled by admin
    const checkAndAutoDisplay = () => {
      if (promoDisabled) return;

      // Check if user dismissed it in this browser session
      const sessionDismissed = sessionStorage.getItem('kingj_referral_promo_dismissed');
      if (sessionDismissed === 'true') return;

      // Check if dismissed with 24-hour cooldown
      const dismissedUntil = localStorage.getItem('kingj_referral_promo_dismissed_until');
      if (dismissedUntil) {
        const expiry = parseInt(dismissedUntil, 10);
        if (!isNaN(expiry) && Date.now() < expiry) {
          return;
        }
      }

      // Check if another high-priority checkout or auth modal is active
      const isAuthModalOpen = document.querySelector('[role="dialog"][data-auth-modal="true"]');
      if (isAuthModalOpen) return;

      // Sensible initial delay so user can orient on homepage first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2400);

      return () => clearTimeout(timer);
    };

    const cleanupTimer = checkAndAutoDisplay();

    return () => {
      if (cleanupTimer) cleanupTimer();
      window.removeEventListener('OPEN_REFERRAL_MODAL', handleTriggerOpen);
    };
  }, [forceOpen, promoDisabled]);

  // Construct referral link:
  const personalReferralUrl = `${OFFICIAL_BASE_URL}/?ref=${referralCode}`;

  // WhatsApp pre-formatted share message requested by user:
  // "Looking for affordable data? 👑
  // You can now get 1GB of data for only GH₵4 on King J Deals.
  // Buy affordable data from:
  // https://www.kingjdeals.site/?ref=YOUR_REFERRAL_CODE"
  const whatsappShareMessage = `Looking for affordable data? 👑\nYou can now get 1GB of data for only GH₵4 on King J Deals.\nBuy affordable data from:\n${personalReferralUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareMessage)}`;

  // Close X Button logic:
  // - Closes popup immediately
  // - Does NOT start sharing
  // - Does NOT open WhatsApp
  // - Does NOT copy anything
  // - Does NOT show popup again immediately during same session
  const handleCloseX = () => {
    setIsOpen(false);
    sessionStorage.setItem('kingj_referral_promo_dismissed', 'true');
    // Set 24 hour cooldown so it does not annoy the customer
    localStorage.setItem(
      'kingj_referral_promo_dismissed_until',
      (Date.now() + 24 * 60 * 60 * 1000).toString()
    );
    if (onClose) onClose();
  };

  // "OK, I WILL DO THAT LATER" Button logic:
  // - Closes popup
  // - Does NOT open WhatsApp
  // - Does NOT copy link automatically
  // - Does NOT count customer as having participated
  // - Remembers dismissal appropriately so popup doesn't immediately reappear
  // - Does NOT permanently hide feature (accessible anytime via Refer & Earn button)
  const handleDoLater = () => {
    setIsOpen(false);
    sessionStorage.setItem('kingj_referral_promo_dismissed', 'true');
    // Cooldown of 24 hours so it won't pop up again today
    localStorage.setItem(
      'kingj_referral_promo_dismissed_until',
      (Date.now() + 24 * 60 * 60 * 1000).toString()
    );
    toast.info("No problem! You can access Refer & Earn anytime 👑", {
      description: "Find your referral link in your Orders page or top promo banner.",
      duration: 3500,
    });
    if (onClose) onClose();
  };

  // Copy Link logic:
  // 1. Copy personal referral URL to clipboard
  // 2. Change button temporarily to "✓ Link Copied"
  // 3. Display: "Link copied successfully. Now share it with your friends!"
  // 4. Return button to "Copy Link" after a short period
  // 5. Update internal session state to confirm customer has successfully completed copy action
  // 6. Unlocks WhatsApp share button
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(personalReferralUrl);
      } else {
        // Fallback for older browsers or embedded webviews
        const textArea = document.createElement('textarea');
        textArea.value = personalReferralUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      setHasCopiedBeforeShare(true);
      setCopyFeedbackVisible(true);
      sessionStorage.setItem('kingj_referral_link_copied', 'true');

      toast.success("✓ Link Copied Successfully!", {
        description: "Now share it with your friends on WhatsApp or social media to earn free data 👑",
        duration: 4000,
      });

      // After a short period, revert button back to "Copy Link"
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.warn("Failed to copy link via clipboard API:", err);
      toast.error("Could not copy link automatically. Please select and copy manually.");
    }
  };

  // WhatsApp Share button logic (Enforced: Customer MUST copy referral link first!):
  const handleWhatsAppShare = () => {
    // Check both local component state and sessionStorage
    const isLinkCopied = hasCopiedBeforeShare || sessionStorage.getItem('kingj_referral_link_copied') === 'true';

    if (!isLinkCopied) {
      toast.error("Please copy the referral link first.", {
        description: "Tap the 'Copy Link' button above to unlock WhatsApp sharing.",
        duration: 4000,
      });
      return;
    }

    sessionStorage.setItem('kingj_referral_shared_whatsapp', 'true');
    try {
      window.open(whatsappShareUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = whatsappShareUrl;
    }

    toast.success("Opening WhatsApp! 📲", {
      description: "Send your King J Deals referral link to friends and group chats.",
      duration: 3500,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="referral-promo-modal-overlay"
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="referral-promo-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseX}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window in King J Deals Royal Navy & Brushed Gold Design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#0B132B] border-2 border-amber-500/35 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.2)] text-white z-10 overflow-hidden"
        >
          {/* Top Royal Brushed Gold Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

          {/* Close "X" Button in top-right */}
          <button
            id="btn-close-referral-promo-x"
            type="button"
            onClick={handleCloseX}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer shadow-sm active:scale-90"
            aria-label="Close referral promotion"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Royal Pill Badge */}
          <div className="flex items-center justify-center mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 text-[11px] font-black tracking-wider uppercase shadow-inner">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL REFERRAL PROGRAM</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          {/* Promotional Trophy / Gift Graphic with Royal Glow */}
          <div className="relative flex justify-center items-center my-2.5">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-500/25 rounded-full blur-lg animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_8px_25px_rgba(245,158,11,0.45)] border-2 border-white/25">
                <Gift className="w-9 h-9 text-slate-950 stroke-[2.3] drop-shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0B132B] border-2 border-amber-400 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Title & Catchphrase */}
          <div className="text-center space-y-1.5 mb-4">
            <h2
              id="referral-promo-title"
              className="font-serif text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent tracking-tight leading-tight"
            >
              SHARE & WIN FREE DATA 👑
            </h2>
            <p className="text-sm font-bold text-slate-100 leading-snug max-w-sm mx-auto">
              Invite your friends to buy data from King J Deals and earn <span className="text-amber-400 font-extrabold uppercase">FREE DATA!</span>
            </p>
            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
              The more friends you successfully bring to King J Deals, the more FREE DATA you can earn.
            </p>
          </div>

          {/* Official Website & Explanation Card */}
          <div className="bg-[#101C3D] border border-amber-500/25 rounded-2xl p-3.5 mb-4 space-y-2.5 text-left shadow-inner">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Official Website:</span>
              <span className="font-mono font-black text-amber-300 text-xs tracking-tight flex items-center gap-1">
                {OFFICIAL_BASE_DOMAIN}
                <ExternalLink className="w-3 h-3 text-amber-400/80" />
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Copy your unique referral link below and share it with your friends. Whenever they purchase data on King J Deals through your link, you automatically earn bonus data rewards!
            </p>

            {/* Display Personal Referral Link & Code */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Your Personal Referral Link:</span>
                <span className="text-[10px] font-bold text-slate-400">Code: <strong className="text-white">{referralCode}</strong></span>
              </div>
              <div className="relative flex items-center bg-[#070D1F] border border-amber-500/40 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono break-all select-all shadow-inner">
                <span className="text-amber-300 font-bold mr-1">https://{OFFICIAL_BASE_DOMAIN}/?ref=</span>
                <span className="text-white font-extrabold underline decoration-amber-400">{referralCode}</span>
              </div>
            </div>

            {/* Copy Feedback message */}
            {copyFeedbackVisible && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Link copied successfully. Now share it with your friends!</span>
              </motion.div>
            )}
          </div>

          {/* Prominent Action Buttons */}
          <div className="space-y-2.5">
            {/* 1. Copy Link Button */}
            <Button
              id="btn-copy-referral-link"
              type="button"
              onClick={handleCopyLink}
              size="lg"
              className={`w-full h-12 sm:h-13 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 border cursor-pointer active:scale-[0.98] ${
                copied
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.35)]'
                  : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-110 text-slate-950 border-amber-300/60 shadow-[0_4px_20px_rgba(245,158,11,0.35)]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>✓ Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            {/* 2. WhatsApp Share Button with Copy-Before-Share Enforcement */}
            <div className="relative group">
              <Button
                id="btn-share-referral-whatsapp"
                type="button"
                onClick={handleWhatsAppShare}
                size="lg"
                className={`w-full h-12 sm:h-13 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 border cursor-pointer active:scale-[0.98] ${
                  hasCopiedBeforeShare
                    ? 'bg-gradient-to-r from-emerald-500 via-[#25D366] to-emerald-600 hover:brightness-110 text-slate-950 shadow-[0_6px_25px_rgba(37,211,102,0.35)] border-emerald-300/40 opacity-100'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/80 shadow-none opacity-60 cursor-not-allowed'
                }`}
              >
                {!hasCopiedBeforeShare ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>📲 Share on WhatsApp (Locked)</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">📲</span>
                    <span>Share on WhatsApp</span>
                  </>
                )}
              </Button>
              {!hasCopiedBeforeShare && (
                <p className="text-[11px] text-amber-400/90 text-center font-bold mt-1.5 flex items-center justify-center gap-1">
                  <span>⚠️ Please copy your referral link above to unlock WhatsApp sharing</span>
                </p>
              )}
            </div>

            {/* 3. Secondary Button: OK, I WILL DO THAT LATER */}
            <button
              id="btn-referral-do-later"
              type="button"
              onClick={handleDoLater}
              className="w-full py-2.5 text-center text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-300 transition-colors cursor-pointer rounded-xl hover:bg-white/5 active:scale-95"
            >
              OK, I WILL DO THAT LATER
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
