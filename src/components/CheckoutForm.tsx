import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import emailjs from '@emailjs/browser';
import PaystackPop from '@paystack/inline-js';
import { Bundle, Network, UserProfile } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Smartphone, CreditCard, MessageSquare, Wallet } from 'lucide-react';
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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [orderId, setOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const pollOrder = async (reference: string) => {
    let attempts = 0;
    const maxAttempts = 10; // 50 seconds total
    const interval = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) clearInterval(interval);

      try {
        const res = await fetch(`/api/orders?reference=${reference}`);
        if (res.ok) {
          const data = await res.json();
          setOrderDetails(data);
          if (data.status === 'delivered' || data.status === 'failed' || data.status === 'cancelled') {
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 5000);
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<z.infer<typeof formSchema>>({
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

  const handlePaystackSuccess = async (transaction: any, data: z.infer<typeof formSchema>) => {
    // Redirect to homepage with reference to trigger SuccessPage verification
    window.location.href = `/?reference=${transaction.reference}`;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!bundle || !auth.currentUser) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Payment system is currently unavailable (Missing Public Key).");
      return;
    }

    const volume = bundle.volume || bundle.dataAmount.replace(/[^0-9.]/g, '');
    const offerSlug = bundle.offerSlug || '';
    const phone = data.recipientPhone;
    const network = data.recipientNetwork;

    console.log("Validating Metadata:", { phone, network, volume, offerSlug });

    if (!phone || !network || !volume || !offerSlug) {
      toast.error("Missing critical order information. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. PRE-CREATE THE ORDER IN FIRESTORE (Crucial for reliability)
      const uniqueRef = 'KJD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || 'Customer',
        userEmail: auth.currentUser.email || '',
        recipientPhone: phone,
        recipientNetwork: network,
        bundleId: bundle.id,
        bundleName: bundle.name,
        dataAmount: bundle.dataAmount,
        amountSent: data.amountSent,
        referenceCode: uniqueRef,
        status: 'pending',
        paymentStatus: 'pending_payment',
        createdAt: serverTimestamp(),
        volume: volume,
        offerSlug: offerSlug
      });

      setOrderId(orderRef.id);

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email: auth.currentUser.email || 'customer@kingjdeals.com',
        amount: Math.round((data.amountSent + 0.20) * 100),
        reference: uniqueRef,
        currency: 'GHS',
        metadata: {
          orderId: orderRef.id,
          userId: auth.currentUser.uid,
          recipientPhone: data.recipientPhone,
          recipientNetwork: data.recipientNetwork,
          volume: bundle.volume || bundle.dataAmount.replace(/[^0-9.]/g, ''),
          offerSlug: bundle.offerSlug || ''
        },
        onSuccess: (transaction: any) => {
          handlePaystackSuccess(transaction, data);
        },
        onCancel: () => {
          setIsSubmitting(false);
          toast.error("Transaction was cancelled.");
        }
      });
    } catch (err) {
      console.error("Order initiation error:", err);
      toast.error("Failed to initiate order.");
      setIsSubmitting(false);
    }
  };

  if (!bundle) return null;

  return (
    <Dialog open={!!bundle} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {paymentStatus === 'idle' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">COMPLETE YOUR PURCHASE 👑</DialogTitle>
              <DialogDescription className="text-lg">
                {bundle.id === 'football-stream' 
                  ? `Buying Lifetime football streaming apk for GHS ${bundle.price.toFixed(2)}`
                  : `Buying ${bundle.dataAmount} {bundle.network} Data for GHS ${bundle.price.toFixed(2)}`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg text-secondary">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="font-black text-xl">PAYMENT METHOD</h3>
              </div>
              
              <div className="space-y-3 text-slate-700">
                <p className="text-sm font-medium">
                  You will be redirected to Paystack to complete your payment securely.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Recipient Number (Data Number)</Label>
                  <Input id="recipientPhone" placeholder="024XXXXXXX" {...register('recipientPhone')} className={errors.recipientPhone ? "border-destructive" : "rounded-xl h-12"} />
                  {errors.recipientPhone && <p className="text-xs text-destructive">{errors.recipientPhone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientNetwork">Recipient Network</Label>
                  <Select defaultValue={bundle.network} onValueChange={(v) => setValue('recipientNetwork', v as Network)}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select Network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN</SelectItem>
                      <SelectItem value="Telecel">Telecel</SelectItem>
                      <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-xl font-black gap-2 rounded-2xl shadow-xl hover:scale-[1.02] transition-all" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                PAY GHS {bundle.price.toFixed(2)} WITH PAYSTACK 👑
              </Button>
            </form>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2 tracking-tight">VERIFYING PAYMENT...</h2>
            <p className="text-slate-600">Please wait while we confirm your transaction with Paystack.</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="py-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse ${orderDetails?.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              {orderDetails?.status === 'delivered' ? <CheckCircle2 className="w-12 h-12" /> : <Loader2 className="w-12 h-12 animate-spin" />}
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">
                {orderDetails?.status === 'delivered' ? 'Order Fulfilled! 👑' : 'Order Processing... 👑'}
              </h2>
              
              {orderDetails?.status === 'delivered' ? (
                <p className="text-xl font-bold text-green-600 animate-bounce">
                  ✅ ROYAL, YOUR DATA HAS BEEN SENT!
                </p>
              ) : (
                <p className="text-xl font-bold text-red-600">
                  🔴 ROYAL, PLEASE WAIT SECONDS... DATA COMING SOON!
                </p>
              )}
              
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4 space-y-2 text-left">
                <p className="text-sm font-bold flex justify-between">
                  <span>ORDER ID:</span>
                  <span className="font-mono text-primary">#{orderId.slice(-6).toUpperCase()}</span>
                </p>
                <p className="text-sm font-bold flex justify-between">
                  <span>STATUS:</span>
                  <span className={`uppercase ${orderDetails?.status === 'delivered' ? 'text-green-600' : 'text-blue-600'}`}>
                    {orderDetails?.status || 'Processing'}
                  </span>
                </p>
                {orderDetails?.externalReference && (
                  <p className="text-xs font-mono text-slate-500 break-all text-center pt-2">
                    REF: {orderDetails.externalReference}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 text-xl font-black rounded-2xl" onClick={onClose}>
                BACK TO HOME 👑
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-14 text-xs font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-1"
                  onClick={() => {
                    window.open(`https://wa.me/233535884851?text=Hello King J, I have just placed an order on King J Deals Site. Order ID: ${orderId.slice(-6).toUpperCase()}`, '_blank');
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  TEXT KING J 👑
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 text-xs font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-1"
                  onClick={() => {
                    window.open(`https://wa.me/233541557530?text=Hello Yhaw, I have just placed an order on King J Deals Site. Order ID: ${orderId.slice(-6).toUpperCase()}`, '_blank');
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  TEXT YHAW 👑
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
