import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  Loader2, 
  Coins, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  Smartphone,
  Monitor,
  Apple
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { EFootballProduct } from '../types';
import KonamiIdGuideModal from './KonamiIdGuideModal';
import { openPaystackPopup } from '../lib/paystack';
import { getApiUrl } from '../lib/api';
import { toast } from 'sonner';

interface EFootballOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: EFootballProduct | null;
  platformLabel: string;
  onOpenAuthModal?: () => void;
  profile?: any;
}

export default function EFootballOrderModal({
  isOpen,
  onClose,
  product,
  platformLabel,
  onOpenAuthModal,
  profile,
}: EFootballOrderModalProps) {
  // Customer input: KONAMI ID or associated eFootball account email
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isConfirmedCorrect, setIsConfirmedCorrect] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'confirmation'>('details');

  const currentUser = auth.currentUser;
  const userEmail = (currentUser?.email || profile?.email || profile?.gmail || '').trim();
  const userName = currentUser?.displayName || profile?.fullName || profile?.username || 'Customer';

  // Initialize phone from profile if available
  useEffect(() => {
    if (profile?.phone && !customerPhone) {
      setCustomerPhone(profile.phone);
    }
  }, [profile]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAccountIdentifier('');
      setIsConfirmedCorrect(false);
      setIsSubmitting(false);
      setStep('details');
    }
  }, [isOpen]);

  if (!product) return null;

  // Determine accountIdentifierType: email or konami_id
  const trimmedId = accountIdentifier.trim();
  const isEmailType = trimmedId.includes('@') && trimmedId.includes('.');
  const accountIdentifierType = isEmailType ? 'email' : 'konami_id';

  // Normalized Platform Name
  const normalizedPlatform =
    platformLabel === 'iOS' || product.platform === 'ios'
      ? 'iOS'
      : platformLabel === 'Steam' || product.platform === 'steam'
      ? 'Steam'
      : 'Android';

  const handleContinueToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedId) {
      toast.error('Please enter your KONAMI ID or the email associated with your eFootball account.');
      return;
    }
    if (trimmedId.length < 3) {
      toast.error('Please enter a valid KONAMI ID or eFootball account email.');
      return;
    }
    if (isEmailType) {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedId)) {
        toast.error('Please enter a valid eFootball email address.');
        return;
      }
    }
    setStep('confirmation');
  };

  const handleConfirmAndPay = async () => {
    if (!currentUser || !userEmail) {
      toast.error('Please sign in with your Google or account email before purchasing.');
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!trimmedId) {
      toast.error('Please enter your KONAMI ID or eFootball account email.');
      return;
    }

    if (!isConfirmedCorrect) {
      toast.error('Please check the confirmation box verifying your account information.');
      return;
    }

    setIsSubmitting(true);

    // 1. Generate Order ID and unique Paystack Reference
    const orderNumber = Math.floor(10000 + Math.random() * 90000);
    const orderId = `EF-${orderNumber}`;
    const reference = `EF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 2. Prepare Order Payload
    // Strictly preserve:
    // customerEmail = authenticated Firebase user email (website Gmail)
    // accountIdentifier = customer provided KONAMI ID or eFootball account email
    const orderPayload = {
      id: reference,
      orderId: orderId,
      customerId: currentUser.uid,
      userId: currentUser.uid,
      customerName: userName,
      customerEmail: userEmail, // Authenticated website email (source of truth)
      email: userEmail,
      customerPhone: customerPhone.trim() || profile?.phone || '',
      phone: customerPhone.trim() || profile?.phone || '',
      productId: product.id,
      productName: product.name,
      bundle: `${product.name} (${normalizedPlatform})`,
      bundleName: product.name,
      coinAmount: product.coinAmount,
      platform: normalizedPlatform, // "iOS", "Android", or "Steam"
      accountIdentifier: trimmedId,
      accountIdentifierType: accountIdentifierType,
      konamiId: trimmedId, // Kept in sync with accountIdentifier
      amount: product.price,
      currency: product.currency || 'GHS',
      paymentStatus: 'PAYMENT_PENDING',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      adminStatus: 'AWAITING_FULFILLMENT',
      status: 'pending',
      serviceType: 'efootball',
      network: 'Game Coins',
      category: 'eFootball Coins',
      paystackReference: reference,
      reference: reference,
      paymentMethod: 'Paystack',
      payment_provider: 'paystack',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paidAt: null,
      acceptedAt: null,
      acceptedBy: null,
      deliveredAt: null,
      deliveredBy: null,
      deliveryNote: null,
    };

    try {
      // 3. FIRST save order into Firestore BEFORE Paystack redirect
      await setDoc(doc(db, 'efootballOrders', reference), orderPayload);
      await setDoc(doc(db, 'orders', reference), orderPayload);
      console.log(`[eFootball Order] Successfully pre-created order ${orderId} (${reference}) for ${userEmail} with platform ${normalizedPlatform}.`);

      // 4. Initialize Paystack through backend
      const redirectTarget = window.location.origin;
      const callbackUrl = `${redirectTarget}/?reference=${reference}&method=paystack`;

      // Try Paystack inline popup first
      let initializedViaPopup = false;
      try {
        const pkRes = await fetch(getApiUrl('/api/paystack-public-key'));
        const pkData = await pkRes.json();
        const paystackPublicKey = pkData?.publicKey;

        if (paystackPublicKey && typeof window !== 'undefined') {
          await openPaystackPopup({
            key: paystackPublicKey,
            email: userEmail,
            amount: Math.round(product.price * 100), // in pesewas
            currency: 'GHS',
            ref: reference,
            metadata: {
              orderId,
              efootballOrderId: orderId,
              efootballProductId: product.id,
              service: 'efootball',
              accountIdentifier: trimmedId,
              accountIdentifierType: accountIdentifierType,
              konamiId: trimmedId,
              platform: normalizedPlatform,
              coinAmount: product.coinAmount,
              customerEmail: userEmail,
              customerName: userName,
              customerPhone: customerPhone.trim(),
            },
            onSuccess: async () => {
              toast.success(`Payment Received for Order #${orderId}! Your coins are awaiting delivery 👑`);
              onClose();
              window.location.href = `${redirectTarget}/?reference=${reference}&method=paystack`;
            },
            onClose: () => {
              toast.info('Payment window closed. Your order is recorded in your dashboard.');
              setIsSubmitting(false);
            },
          });
          initializedViaPopup = true;
          return;
        }
      } catch (inlineErr) {
        console.warn('[eFootball Paystack] Inline popup notice, falling back to server initialize:', inlineErr);
      }

      // 5. Fallback: Call backend /api/paystack-initialize
      if (!initializedViaPopup) {
        const initResponse = await fetch(getApiUrl('/api/paystack-initialize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            amount: Math.round(product.price * 100),
            reference,
            callback_url: callbackUrl,
            currency: 'GHS',
            efootballProductId: product.id,
            efootballOrderId: orderId,
            platform: normalizedPlatform,
            accountIdentifier: trimmedId,
            accountIdentifierType: accountIdentifierType,
            konamiId: trimmedId,
            userId: currentUser.uid,
            customerName: userName,
            customerPhone: customerPhone.trim(),
            metadata: {
              orderId,
              efootballOrderId: orderId,
              efootballProductId: product.id,
              service: 'efootball',
              platform: normalizedPlatform,
              accountIdentifier: trimmedId,
              accountIdentifierType: accountIdentifierType,
              konamiId: trimmedId,
              coinAmount: product.coinAmount,
              customerEmail: userEmail,
            },
          }),
        });

        const initData = await initResponse.json();
        if (initData?.success && initData?.authorization_url) {
          window.location.href = initData.authorization_url;
        } else {
          throw new Error(initData?.error || 'Payment gateway initialization failed.');
        }
      }
    } catch (err: any) {
      console.error('[eFootball Payment Error]:', err);
      try {
        await updateDoc(doc(db, 'efootballOrders', reference), {
          paymentStatus: 'PAYMENT_INITIALIZATION_FAILED',
          status: 'failed',
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'orders', reference), {
          paymentStatus: 'PAYMENT_INITIALIZATION_FAILED',
          status: 'failed',
          updatedAt: serverTimestamp(),
        });
      } catch (updateErr) {
        console.warn('[eFootball Error Record Notice]:', updateErr);
      }

      toast.error(`Payment initialization notice: ${err.message || 'Please try again'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto bg-gradient-to-b from-[#091533] via-[#0B1A3D] to-[#060E24] text-white border-2 border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left border-b border-blue-500/20 pb-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider rounded-md">
                eFootball™ Coins
              </Badge>
              <Badge variant="outline" className="border-blue-400/40 text-yellow-300 bg-blue-950/60 text-[10px] font-black uppercase flex items-center gap-1">
                {normalizedPlatform === 'iOS' ? (
                  <Apple className="w-3 h-3" />
                ) : normalizedPlatform === 'Steam' ? (
                  <Monitor className="w-3 h-3" />
                ) : (
                  <Smartphone className="w-3 h-3" />
                )}
                Platform: {normalizedPlatform}
              </Badge>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              EFOOTBALL COINS
            </DialogTitle>
            <DialogDescription className="text-blue-200 text-xs">
              Fast, legitimate manual delivery for your {normalizedPlatform} account.
            </DialogDescription>
          </DialogHeader>

          {/* Package Details Box */}
          <div className="p-4 rounded-2xl bg-[#0e224e] border border-blue-500/30 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Platform
                </span>
                <p className="text-sm font-black text-white flex items-center gap-1.5">
                  {normalizedPlatform === 'iOS' ? (
                    <Apple className="w-4 h-4 text-white" />
                  ) : normalizedPlatform === 'Steam' ? (
                    <Monitor className="w-4 h-4 text-blue-300" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  )}
                  {normalizedPlatform}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Price
                </span>
                <p className="text-xl sm:text-2xl font-black text-yellow-400">
                  GH¢ {product.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Package
                </span>
                <p className="text-xs font-bold text-white">{product.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {product.coinAmount.toLocaleString()} eFootball Coins
                </p>
              </div>
            </div>
          </div>

          {/* Authentication Check */}
          {!currentUser || !userEmail ? (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 my-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto text-yellow-400">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-yellow-300 uppercase tracking-wide">
                  Sign In Required For eFootball Orders
                </h4>
                <p className="text-xs text-blue-200 leading-relaxed max-w-sm mx-auto">
                  To ensure your coins order is securely attached to your verified Google/account email, please sign in before ordering.
                </p>
              </div>
              <Button
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="w-full h-11 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Sign In with Google / Account 👑
              </Button>
            </div>
          ) : (
            <>
              {/* Authenticated Customer Email Box */}
              <div className="p-3.5 rounded-2xl bg-[#061026] border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Website Customer Account
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Gmail
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white">{userName}</span>
                  <span className="font-mono text-yellow-300 font-semibold flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-400" />
                    {userEmail}
                  </span>
                </div>
                <p className="text-[10px] text-blue-300/80 italic">
                  This website email will receive your payment receipt & fulfillment notification.
                </p>
              </div>

              {step === 'details' ? (
                /* STEP 1: Enter Account Identifier */
                <form onSubmit={handleContinueToConfirm} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accountIdentifier" className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        eFootball Account Identifier <span className="text-red-400">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="text-[11px] font-bold text-blue-300 hover:text-yellow-400 underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        HOW TO FIND MY KONAMI ID?
                      </button>
                    </div>

                    <p className="text-[11px] text-blue-200">
                      Enter your KONAMI ID or the email address associated with your eFootball account.
                    </p>

                    <Input
                      id="accountIdentifier"
                      type="text"
                      placeholder="KONAMI ID or eFootball account email"
                      value={accountIdentifier}
                      onChange={(e) => setAccountIdentifier(e.target.value)}
                      required
                      className="bg-[#061026] border-blue-500/30 text-white placeholder:text-blue-300/40 rounded-xl h-11 text-sm font-semibold focus:border-yellow-400"
                    />

                    {/* STRICT PASSWORD SECURITY NOTICE */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-yellow-200 leading-relaxed font-semibold">
                          Never enter or share your KONAMI/eFootball password. We only require your KONAMI ID or the email associated with your eFootball account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone" className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      Phone / WhatsApp Number (Optional)
                    </Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="e.g. 0541234567 (for order updates)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-[#061026] border-blue-500/30 text-white placeholder:text-blue-300/40 rounded-xl h-11 text-sm font-semibold focus:border-yellow-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!trimmedId}
                    className="w-full h-12 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Continue to Confirmation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                /* STEP 2: Review and Confirm */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#061026] border border-blue-500/30 space-y-3 text-xs">
                    <h4 className="font-black text-xs uppercase tracking-wider text-yellow-400 border-b border-blue-500/20 pb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ORDER CONFIRMATION
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-blue-500/10">
                        <span className="text-[11px] text-blue-300 uppercase font-bold">Platform:</span>
                        <span className="font-black text-white text-sm">{normalizedPlatform}</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-blue-500/10">
                        <span className="text-[11px] text-blue-300 uppercase font-bold">Package:</span>
                        <span className="font-bold text-white">{product.coinAmount.toLocaleString()} Coins</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-blue-500/10">
                        <span className="text-[11px] text-blue-300 uppercase font-bold">Amount:</span>
                        <span className="font-black text-yellow-400 text-sm">GH¢ {product.price.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-start py-1 border-b border-blue-500/10">
                        <span className="text-[11px] text-blue-300 uppercase font-bold">
                          {isEmailType ? 'Account Email:' : 'KONAMI ID:'}
                        </span>
                        <span className="font-mono font-black text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 text-xs">
                          {trimmedId}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-[11px] text-blue-300 uppercase font-bold">Website Customer Gmail:</span>
                        <span className="font-mono text-blue-200 text-[11px]">{userEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30">
                    <input
                      type="checkbox"
                      id="confirmCorrect"
                      checked={isConfirmedCorrect}
                      onChange={(e) => setIsConfirmedCorrect(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-yellow-400 text-yellow-400 focus:ring-yellow-400 bg-slate-900 cursor-pointer accent-yellow-400"
                    />
                    <label
                      htmlFor="confirmCorrect"
                      className="text-xs text-blue-100 font-semibold cursor-pointer leading-tight select-none"
                    >
                      I confirm that the account information entered above is correct.
                    </label>
                  </div>

                  {/* Warning message */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-200/90 leading-relaxed font-medium">
                      ⚠️ Please double check your {isEmailType ? 'eFootball account email' : 'KONAMI ID'}. An incorrect account identifier will delay manual delivery.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setStep('details')}
                      className="h-12 border-blue-500/40 text-blue-200 hover:bg-blue-900/40 rounded-xl text-xs font-bold"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmAndPay}
                      disabled={!trimmedId || !isConfirmedCorrect || isSubmitting}
                      className="flex-1 h-12 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Order & Connecting Paystack...
                        </>
                      ) : (
                        <>
                          CONFIRM PURCHASE 👑
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Guide Modal */}
      <KonamiIdGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        defaultPlatform={normalizedPlatform}
      />
    </>
  );
}
