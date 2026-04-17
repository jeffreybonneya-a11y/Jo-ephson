import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PaystackPop from '@paystack/inline-js';
import { Bundle, Network, UserProfile } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Smartphone, CreditCard, MessageSquare, Info } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  recipientPhone: z.string().regex(/^233\d{9}$/, "Phone must start with 233 and be 12 digits total"),
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

  const handleTopUp = async (amount: number) => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: publicKey,
      email: auth.currentUser?.email || 'customer@kingjdeals.com',
      amount: Math.round(amount * 100),
      currency: 'GHS',
      metadata: {
        mode: 'topup',
        userId: auth.currentUser?.uid
      },
      onSuccess: () => {
        toast.success("Top-up successful! Your balance will reflect shortly. 👑");
      }
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!bundle || !auth.currentUser || !profile) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    if (profile.walletBalance < bundle.price) {
        toast.error("Insufficient balance. Please top up your wallet.");
        return;
    }

    setIsSubmitting(true);
    try {
        const response = await fetch('/api/wallet/pay', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userId: auth.currentUser.uid,
                bundleId: bundle.id,
                bundleName: bundle.name,
                dataAmount: bundle.dataAmount,
                recipientPhone: data.recipientPhone,
                recipientNetwork: data.recipientNetwork,
                amount: bundle.price,
                volume: bundle.volume,
                offerSlug: bundle.offerSlug
            })
        });

        if(!response.ok) throw new Error("Payment failed");
        
        const result = await response.json();
        setOrderId(result.orderId);
        setOrderStatus('success');
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error("Failed to place order: " + err.message);
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl">
        {orderStatus === 'idle' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                ROYAL CHECKOUT 👑
              </DialogTitle>
              <DialogDescription className="text-lg">
                Automated delivery powered by King J Deals.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 space-y-2">
              <h3 className="font-black text-primary text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                SECURE PAYMENT
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                You will be redirected to Paystack to complete your purchase. Once payment is confirmed, GigsHub will automatically deliver your data.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Product Details</p>
                  <p className="font-black text-slate-900">{bundle.name}</p>
                  <p className="text-sm font-medium text-primary">GHS {bundle.price.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Recipient Phone (233...)</Label>
                    <Input id="recipientPhone" placeholder="233XXXXXXXXX" {...register('recipientPhone')} className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:ring-primary" />
                    {errors.recipientPhone && <p className="text-[10px] text-destructive font-bold">{errors.recipientPhone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientNetwork" className="text-xs font-bold uppercase tracking-wider text-slate-500">Network</Label>
                    <Select defaultValue={bundle.network} onValueChange={(v) => setValue('recipientNetwork', v as Network)}>
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="Telecel">Telecel</SelectItem>
                        <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-black gap-2 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-primary" disabled={isSubmitting || (profile?.walletBalance || 0) < bundle.price}>
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <>BUY NOW (Balance: GHS {(profile?.walletBalance || 0).toFixed(2)}) 👑</>}
              </Button>
              
              {(profile?.walletBalance || 0) < bundle.price && (
                <div className="space-y-3 pt-4 border-t-2 border-dashed">
                  <p className="text-center font-bold text-red-500">Insufficient Funds! Select a top-up amount:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 50].map(amt => (
                      <Button key={amt} type="button" variant="outline" onClick={() => handleTopUp(amt)} className="font-black border-2">GHS {amt}</Button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-in animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">Payment Success! 👑</h2>
              <p className="text-slate-600 font-medium">Your order #<span className="text-primary">{orderId.slice(-6).toUpperCase()}</span> is being delivered automatically.</p>
              
              <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 mt-6 text-left">
                <p className="text-sm font-black text-primary uppercase mb-3 text-center underline underline-offset-4">Automatic Fulfillment</p>
                <p className="text-xs font-medium text-slate-700 leading-relaxed text-center">
                  Our system has notified GigsHub. You will receive your data within 5-15 minutes. No further action is required!
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 text-xl font-black rounded-2xl bg-secondary text-white" onClick={onClose}>
                AWESOME 👑
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-14 font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2"
                  onClick={() => handleWhatsApp('kingj')}
                >
                  <MessageSquare className="w-5 h-5" />
                  KING J
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2"
                  onClick={() => handleWhatsApp('yhaw')}
                >
                  <MessageSquare className="w-5 h-5" />
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
