import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PaystackPop from '@paystack/inline-js';
import { auth, db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Loader2, CreditCard, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/src/types';

const topUpSchema = z.object({
  amount: z.number().min(0.01, "Enter a valid amount over 0"),
});

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function WalletModal({ isOpen, onClose, profile }: WalletModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      amount: 1,
    }
  });

  const onSubmit = async (data: z.infer<typeof topUpSchema>) => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Payment system is currently unavailable.");
      return;
    }

    setIsSubmitting(true);
    const reference = 'TOPUP-' + Math.random().toString(36).substring(7).toUpperCase();

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: publicKey,
      email: auth.currentUser?.email || 'customer@kingjdeals.com',
      amount: Math.round((data.amount + 0.20) * 100),
      reference: reference,
      currency: 'GHS',
      metadata: {
        userId: auth.currentUser?.uid,
        type: 'topup',
        amount: data.amount
      },
      onSuccess: async (transaction: any) => {
        setStatus('processing');
        try {
          const res = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              reference: transaction.reference, 
              orderId: auth.currentUser?.uid,
              type: 'topup'
            })
          });
          
          if (!res.ok) {
            throw new Error(`Server returned status: ${res.status}`);
          }
          
          const verifyData = await res.json();
          if (verifyData.success) {
            setStatus('success');
            toast.success("Wallet topped up successfully!");
          } else {
            setStatus('failed');
            toast.error(verifyData.message || "Verification failed");
          }
        } catch (error) {
          setStatus('failed');
          toast.error("Failed to verify top-up");
        } finally {
          setIsSubmitting(false);
        }
      },
      onCancel: () => {
        setIsSubmitting(false);
        toast.error("Top-up cancelled");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        {status === 'idle' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                TOP UP WALLET 👑
              </DialogTitle>
              <DialogDescription>
                Add funds to your royal wallet for instant data purchases.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-500">Current Balance</span>
                <span className="text-xl font-black text-primary">GHS {profile?.walletBalance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500">
                <Info className="w-3 h-3 mt-0.5" />
                <p>Funds are added instantly after payment.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Top Up (GHS)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">GHS</span>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01"
                    className="pl-14 h-14 text-xl font-black rounded-2xl" 
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && <p className="text-xs text-destructive font-bold">{errors.amount.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[20, 50, 100].map((amt) => (
                  <Button 
                    key={amt}
                    type="button"
                    variant="outline"
                    className="h-12 font-black rounded-xl border-2"
                    onClick={() => {
                      const input = document.getElementById('amount') as HTMLInputElement;
                      if (input) {
                        input.value = amt.toString();
                        // Trigger react-hook-form update
                        const event = new Event('input', { bubbles: true });
                        input.dispatchEvent(event);
                      }
                    }}
                  >
                    GHS {amt}
                  </Button>
                ))}
              </div>

              <Button type="submit" className="w-full h-14 text-xl font-black gap-2 rounded-2xl shadow-xl" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                PAY WITH PAYSTACK 👑
              </Button>
            </form>
          </>
        )}

        {status === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">VERIFYING TOP-UP...</h2>
            <p className="text-slate-600">Please wait while we confirm your payment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">TOP-UP SUCCESSFUL! 👑</h2>
              <p className="text-slate-600">Your royal wallet has been credited.</p>
            </div>
            <Button className="w-full h-14 text-xl font-black rounded-2xl" onClick={onClose}>
              AWESOME 👑
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-2">TOP-UP FAILED</h2>
            <p className="text-slate-600 mb-6">We couldn't verify your payment. If you were charged, please contact support.</p>
            <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setStatus('idle')}>Try Again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
