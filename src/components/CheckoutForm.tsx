import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PaystackPop from '@paystack/inline-js';
import { Bundle, Network, UserProfile } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Smartphone, CreditCard, MessageSquare, Info, ShieldCheck, Crown } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  recipientPhone: z.string().regex(/^0\d{9}$/, "Phone must start with 0 and be 10 digits total (e.g., 05XXXXXXXX)"),
  recipientNetwork: z.enum(['MTN', 'Telecel', 'AirtelTigo']),
  amountSent: z.number().min(1, "Amount must be greater than 0"),
});

interface CheckoutFormProps {
  bundle: Bundle | null;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function CheckoutForm({ bundle, onClose, profile }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [orderId, setOrderId] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientNetwork: bundle?.network || 'MTN',
      amountSent: bundle?.price || 0,
    }
  });

  useEffect(() => {
    if (bundle) {
      setValue('recipientNetwork', bundle.network);
      setValue('amountSent', bundle.price);
    }
  }, [bundle, setValue]);

  useEffect(() => {
    if (profile?.phoneNumber) {
      setValue('recipientPhone', profile.phoneNumber);
    }
  }, [profile, setValue]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!bundle || !auth.currentUser) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Paystack Public Key is missing! Please set VITE_PAYSTACK_PUBLIC_KEY in settings. 👑");
      console.error("Paystack Public Key (VITE_PAYSTACK_PUBLIC_KEY) is not defined in environment variables.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 0. Generate ID synchronously
      const preOrderRef = doc(collection(db, 'orders'));
      const preOrderId = preOrderRef.id;

      // Create pre-order record
      await setDoc(preOrderRef, {
        email: auth.currentUser.email,
        phone: data.recipientPhone,
        network: data.recipientNetwork,
        bundle: `${data.recipientNetwork} ${bundle.dataAmount}`,
        amount: bundle.price,
        status: "pending",
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        customerName: profile?.fullName || auth.currentUser.displayName || 'Royal Customer'
      });

      // Notify admin immediately
      fetch('/api/notifyOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.currentUser.email,
          phone: data.recipientPhone,
          network: data.recipientNetwork,
          bundle: `${data.recipientNetwork} ${bundle.dataAmount}`,
          amount: bundle.price,
          reference: 'PAYMENT INITIATED'
        })
      });

      // 1. Initiate Payment
      const handler = PaystackPop.setup({
        key: publicKey,
        email: auth.currentUser.email || '',
        amount: Math.round(data.amountSent * 100),
        currency: 'GHS',
        metadata: {
          custom_fields: [
            { display_name: "Order ID", variable_name: "order_id", value: preOrderId },
            { display_name: "Recipient Phone", variable_name: "phone", value: data.recipientPhone },
            { display_name: "Network", variable_name: "network", value: data.recipientNetwork }
          ]
        },
        callback: async (response: any) => {
          setOrderStatus('processing');
          try {
            // Verify payment
            const res = await fetch('/api/verifyPayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: response.reference,
                metadata: {
                  internalOrderId: preOrderId,
                  phone: data.recipientPhone,
                  network: data.recipientNetwork,
                  bundle: `${data.recipientNetwork} ${bundle.dataAmount}`
                }
              })
            });
            const verifyData = await res.json();
            
            if (verifyData.success) {
              setOrderId(preOrderId);
              setOrderStatus('success');
            } else {
              // Silently close without showing an error popup
              setIsSubmitting(false);
              onClose();
            }
          } catch (err) {
            console.error("Verification error:", err);
            // Silently close without showing an error popup
            setIsSubmitting(false);
            onClose();
          }
        },
        onClose: () => {
          setIsSubmitting(false);
        }
      });
      
      handler.openIframe();
    } catch (err: any) {
      console.error("Checkout Error:", err);
      toast.error("Failed to start checkout. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = (target: 'kingj' | 'yhaw') => {
    const phone = target === 'kingj' ? '233535884851' : '233541557530';
    const text = `Hello, I just placed an order on King J Deals! 👑\n\nOrder ID: #${orderId.slice(-6).toUpperCase()}\nRef: ${orderDetails?.referenceCode || ''}\n\nPlease check my order status.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Mock orderDetails for WhatsApp if needed
  const orderDetails = { referenceCode: orderId.slice(-8).toUpperCase() };

  if (!bundle) return null;

  return (
    <Dialog open={!!bundle} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[95vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] border-2 sm:border-4 border-slate-100 shadow-2xl p-0">
        {orderStatus === 'processing' ? (
          <div className="py-16 sm:py-24 text-center space-y-6 sm:space-y-8 px-6 bg-slate-50/50">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary/20 animate-pulse">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">Verifying Royalty... 👑</h2>
              <p className="text-slate-500 font-bold max-w-xs mx-auto text-xs sm:text-sm leading-relaxed lowercase italic opacity-80">Confirming your payment. Stay on this screen.</p>
            </div>
          </div>
        ) : orderStatus === 'idle' ? (
          <div className="p-4 sm:p-10 space-y-4 sm:space-y-8">
            <DialogHeader className="text-center">
              <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 bg-primary text-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl mb-2 sm:mb-4 rotate-3">
                <Smartphone className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              <DialogTitle className="text-xl sm:text-3xl font-black tracking-tighter text-slate-900 uppercase">
                ROYAL CHECKOUT 👑
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-[10px] sm:text-sm">
                Instant delivery for all data bundles.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-3xl p-3 sm:p-6 space-y-1 sm:space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
              <h3 className="font-black text-primary text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-2 tracking-widest uppercase">
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                SECURE TRANSACTION
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-bold lowercase opacity-70 relative z-10">
                You will be redirected to paystack for payment.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-8">
              <div className="space-y-3 sm:space-y-6">
                <div className="bg-primary/5 p-3 sm:p-6 rounded-xl sm:rounded-[2.5rem] border-2 border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Bundle</p>
                    <p className="font-black text-slate-900 text-sm sm:text-lg leading-none">{bundle.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                    <p className="text-lg sm:text-2xl font-black text-primary">GHS {bundle.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="recipientPhone" className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        id="recipientPhone" 
                        placeholder="0XXXXXXXXX" 
                        {...register('recipientPhone')} 
                        className="rounded-lg sm:rounded-[1.25rem] h-11 sm:h-14 pl-10 bg-slate-50 border-2 border-slate-100 focus:border-primary/50 font-black text-sm sm:text-lg tracking-wider" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="recipientNetwork" className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Network</Label>
                    <Select defaultValue={bundle.network} onValueChange={(v) => setValue('recipientNetwork', v as Network)}>
                      <SelectTrigger className="rounded-lg sm:rounded-[1.25rem] h-11 sm:h-14 bg-slate-50 border-2 border-slate-100 focus:border-primary/50 font-black text-sm sm:text-lg">
                        <SelectValue placeholder="Network" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        <SelectItem value="MTN" className="font-black">MTN 👑</SelectItem>
                        <SelectItem value="Telecel" className="font-black">Telecel 👑</SelectItem>
                        <SelectItem value="AirtelTigo" className="font-black">AirtelTigo 👑</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 sm:h-16 text-base sm:text-xl font-black gap-2 sm:gap-3 rounded-xl sm:rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all bg-primary text-secondary mb-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span>PREPARING...</span>
                  </div>
                ) : (
                  <>
                    <Crown className="w-4 h-4 sm:w-6 sm:h-6" />
                    PURCHASE NOW 👑
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="text-center bg-white h-full flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 text-white rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 shadow-2xl rotate-12 scale-110 animate-bounce">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 leading-none">ORDER RECEIVED! 👑</h2>
              <p className="text-slate-500 font-medium text-base sm:text-lg leading-relaxed lowercase italic">
                Payment confirmed for <span className="text-primary font-black uppercase not-italic">{bundle.dataAmount}</span>.
              </p>
            </div>

            <div className="w-full bg-slate-50 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-4 mb-8 sm:mb-10 border-2 border-slate-100 text-left relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-500/5 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
               <p className="text-[9px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> SUCCESSFUL VERIFICATION
               </p>
               <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed font-mono">
                  Verified. Agents are processing delivery. Usually 2-5 minutes.
               </p>
               <div className="pt-3 sm:pt-4 border-t border-slate-200 mt-3 sm:mt-4 flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</span>
                  <span className="font-mono font-black text-primary text-xs sm:text-sm">#{orderId.slice(-6).toUpperCase()}</span>
               </div>
            </div>

            <div className="w-full flex flex-col gap-3 sm:gap-4">
               <Button 
                variant="default"
                className="w-full h-14 sm:h-16 text-lg sm:text-xl font-black rounded-xl sm:rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-black transition-all" 
                onClick={onClose}
               >
                 ROYAL DISMISSAL 👑
               </Button>
               
               <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-12 sm:h-14 font-black rounded-xl sm:rounded-2xl border-4 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2 text-[10px] sm:text-xs"
                    onClick={() => handleWhatsApp('kingj')}
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    KING J
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 sm:h-14 font-black rounded-xl sm:rounded-2xl border-4 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2 text-[10px] sm:text-xs"
                    onClick={() => handleWhatsApp('yhaw')}
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    YHAW
                  </Button>
               </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
