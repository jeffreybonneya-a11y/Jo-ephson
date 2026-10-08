import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
    toast.info("You can access Refer & Earn anytime", {
      description: "Find your referral link in your Orders page or top promo banner.",
      duration: 3500,
    });
    if (onClose) onClose();
  };

  // Copy Link logic:
  // 1. Copy personal referral URL to clipboard
  // 2. Change button temporarily to "Link Copied"
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

      toast.success("Link copied successfully", {
        description: "Now share it with your friends on WhatsApp or social media to earn free data.",
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

    toast.success("Opening WhatsApp", {
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
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#0B132B] border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl text-white z-10 overflow-hidden"
        >
          {/* Top Subtle Brushed Gold Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/70 via-amber-400 to-amber-500/70" />

          {/* Close "X" Button in top-right */}
          <button
            id="btn-close-referral-promo-x"
            type="button"
            onClick={handleCloseX}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60 cursor-pointer"
            aria-label="Close referral promotion"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Official Referral Program Label */}
          <div className="text-center mb-2.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400/90">
              OFFICIAL REFERRAL PROGRAM
            </span>
          </div>

          {/* Main Title & Catchphrase */}
          <div className="text-center space-y-1.5 mb-5">
            <h2
              id="referral-promo-title"
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight"
            >
              SHARE & WIN FREE DATA
            </h2>
            <p className="text-sm font-medium text-slate-200 leading-snug max-w-sm mx-auto">
              Invite your friends to buy data from King J Deals and earn <span className="text-amber-400 font-bold uppercase">FREE DATA</span>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              The more friends you successfully bring to King J Deals, the more free data you can earn.
            </p>
          </div>

          {/* Official Website & Explanation Card */}
          <div className="bg-[#101C3D] border border-slate-800/90 rounded-2xl p-4 mb-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-slate-400 font-medium text-[11px]">Official Website:</span>
              <span className="font-mono font-medium text-amber-300 text-xs">
                {OFFICIAL_BASE_DOMAIN}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Copy your unique referral link below and share it with your friends. Whenever they purchase data on King J Deals through your link, you automatically earn bonus data rewards.
            </p>

            {/* Display Personal Referral Link & Code */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Your Personal Referral Link:</span>
                <span className="text-slate-400 font-medium">Code: <strong className="text-white font-semibold">{referralCode}</strong></span>
              </div>
              <div className="flex items-center bg-[#070D1F] border border-slate-700/70 rounded-xl px-3 py-2.5 text-slate-200 text-xs font-mono break-all select-all">
                <span className="text-amber-400/90 font-medium mr-1">https://{OFFICIAL_BASE_DOMAIN}/?ref=</span>
                <span className="text-white font-semibold">{referralCode}</span>
              </div>
            </div>

            {/* Copy Feedback message */}
            {copyFeedbackVisible && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Link copied successfully. Now share it with your friends!</span>
              </motion.div>
            )}
          </div>

          {/* Prominent Action Buttons */}
          <div className="space-y-3">
            {/* 1. Copy Link Button */}
            <Button
              id="btn-copy-referral-link"
              type="button"
              onClick={handleCopyLink}
              size="lg"
              className={`w-full h-11 sm:h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400 shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            {/* 2. WhatsApp Share Button with Copy-Before-Share Enforcement */}
            <div className="space-y-1.5">
              <Button
                id="btn-share-referral-whatsapp"
                type="button"
                onClick={handleWhatsAppShare}
                size="lg"
                className={`w-full h-11 sm:h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                  hasCopiedBeforeShare
                    ? 'bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 border-[#25D366] cursor-pointer'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/80 cursor-not-allowed opacity-75'
                }`}
              >
                {!hasCopiedBeforeShare ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Share on WhatsApp (Locked)</span>
                  </>
                ) : (
                  <span>Share on WhatsApp</span>
                )}
              </Button>
              {!hasCopiedBeforeShare && (
                <p className="text-[11px] text-slate-400 text-center font-normal">
                  Please copy your referral link above to unlock WhatsApp sharing
                </p>
              )}
            </div>

            {/* 3. Secondary Button: OK, I WILL DO THAT LATER */}
            <button
              id="btn-referral-do-later"
              type="button"
              onClick={handleDoLater}
              className="w-full py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-white/5"
            >
              OK, I WILL DO THAT LATER
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
