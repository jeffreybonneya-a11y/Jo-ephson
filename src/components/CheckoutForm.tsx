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
import { CheckCircle2, Loader2, Smartphone, CreditCard, AlertCircle, MessageSquare, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  recipientPhone: z.string().min(10, "Invalid phone number").max(15),
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
  const [royalRef] = useState(() => 'ROYAL-' + Math.random().toString(36).substring(7).toUpperCase());

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
    try {
      // 1. Create order as pending verification
      const docRef = await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser!.uid,
        customerName: auth.currentUser!.displayName || 'Customer',
        userEmail: auth.currentUser!.email || '',
        recipientPhone: data.recipientPhone,
        recipientNetwork: data.recipientNetwork,
        bundleId: bundle!.id,
        bundleName: bundle!.name,
        amountSent: data.amountSent,
        referenceCode: transaction.reference,
        status: 'pending', // Will be updated by backend webhook or verify call
        paymentStatus: 'verifying',
        createdAt: serverTimestamp(),
      });

      setOrderId(docRef.id);
      setPaymentStatus('processing');

      // 2. Call backend to verify transaction
      const verifyRes = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: transaction.reference, orderId: docRef.id })
      });
      
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setPaymentStatus('success');
        toast.success("Payment verified successfully! Order is now processing.");

        // 3. Send "THANK YOU" Message to Customer in their Portal
        await addDoc(collection(db, 'messages'), {
          userId: auth.currentUser!.uid,
          userEmail: 'admin@kingjdeals.com',
          userName: 'King J Deals 👑',
          subject: '👑 THANK YOU FOR YOUR ORDER! 👑',
          message: `Royal ${auth.currentUser!.displayName || 'Customer'}, 
  
  Thank you for choosing King J Deals! We have received your payment for ${bundle!.name}. 
  
  Your data will be delivered instantly. 
  
  We appreciate your business! 👑`,
          status: 'unread',
          createdAt: serverTimestamp(),
        });

        // 4. Send Email Notification to Admins via EmailJS
        const emailParams = {
          to_name: "Admins (King J & Yhaw)",
          customer_name: auth.currentUser!.displayName || 'Customer',
          order_id: docRef.id,
          service_name: bundle!.name,
          amount: `GHS ${data.amountSent.toFixed(2)}`,
          reference: transaction.reference,
          recipient_info: `${data.recipientPhone} (${data.recipientNetwork})`,
          customer_email: auth.currentUser!.email,
          site_name: "King J Deals Site 👑",
          admin_emails: "jeffreybonneya@gmail.com, emmagyapong62@gmail.com"
        };

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          emailjs.send(serviceId, templateId, emailParams, publicKey)
            .catch((err) => console.error('EmailJS Error:', err));
        }

      } else {
        setPaymentStatus('failed');
        toast.error("Payment verification failed. Please contact support.");
      }

    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("Failed to process order: " + (error.message || "Unknown error"));
      setPaymentStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
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

    setIsSubmitting(true);

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: publicKey,
      email: auth.currentUser.email || 'customer@kingjdeals.com',
      amount: Math.round(data.amountSent * 100), // Paystack expects amount in pesewas
      reference: royalRef,
      currency: 'GHS',
      onSuccess: (transaction: any) => {
        handlePaystackSuccess(transaction, data);
      },
      onCancel: () => {
        setIsSubmitting(false);
        toast.error("Transaction was cancelled.");
      }
    });
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
                <h3 className="font-black text-xl">PAYMENT INSTRUCTIONS</h3>
              </div>
              <div className="space-y-3 text-slate-700">
                <p className="text-sm font-medium">
                  You will be redirected to Paystack to complete your payment securely. 
                  Once payment is successful, your order will be processed automatically.
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
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">ORDER RECEIVED! 👑</h2>
              <p className="text-xl font-bold text-red-600">
                🔴 Royal, please wait while the admin confirms your payment.
              </p>
              <p className="text-slate-600">
                Order ID: <strong className="font-mono">#{orderId.slice(-6).toUpperCase()}</strong>
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500">
                You will be notified once your payment is verified. You can track your order in the history section.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 text-xl font-black rounded-2xl" onClick={() => {
                onClose();
                window.location.href = '/';
              }}>
                BACK TO HOME 👑
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-14 text-xs font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-1"
                  onClick={() => {
                    window.open(`https://wa.me/233535884851?text=Hello King J, I have just placed an order on King J Deals Site. Order ID: ${orderId.slice(-6).toUpperCase()}. Reference: ${royalRef}`, '_blank');
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  TEXT KING J 👑
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 text-xs font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-1"
                  onClick={() => {
                    window.open(`https://wa.me/233541557530?text=Hello Yhaw, I have just placed an order on King J Deals Site. Order ID: ${orderId.slice(-6).toUpperCase()}. Reference: ${royalRef}`, '_blank');
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  TEXT YHAW 👑
                </Button>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-2">SUBMISSION FAILED</h2>
            <p className="text-slate-600 mb-6">We couldn't record your order. Please try again or contact support.</p>
            <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setPaymentStatus('idle')}>Try Again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
