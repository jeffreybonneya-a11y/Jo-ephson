import { auth } from '@/src/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Info, Loader2 } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { useState } from 'react';
import { toast } from 'sonner';
import PaystackPop from '@paystack/inline-js';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function WalletModal({ isOpen, onClose, profile }: WalletModalProps) {
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handlePaystackTopUp = async (amount: number) => {
    if (amount < 1) {
      toast.error("Minimum top-up is GHS 1");
      return;
    }
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Payment system unavailable.");
      return;
    }

    setIsTopUpLoading(true);
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
        toast.success("Wallet top-up successful! Balance updating... 👑");
        onClose();
        setIsTopUpLoading(false);
        setCustomAmount('');
      },
      onCancel: () => {
        setIsTopUpLoading(false);
        toast.info("Top-up cancelled.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            WALLET TOP-UP 👑
          </DialogTitle>
          <DialogDescription>
            Securely load your royal balance with Paystack.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Available Balance</span>
            <span className="text-3xl font-black text-primary">GHS {profile?.walletBalance?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-500 mt-4 bg-white/50 p-3 rounded-xl">
            <Info className="w-4 h-4 mt-0.5 text-primary" />
            <p>Enter any amount or select a quick option to top up via Paystack.</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase text-center tracking-widest">Enter Custom Amount</p>
          
          <div className="flex gap-2">
            <input 
              type="number"
              placeholder="Enter amount (GHS)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 h-14 px-4 rounded-2xl border-2 border-slate-200 focus:ring-primary focus:border-primary font-black"
            />
            <Button 
                disabled={isTopUpLoading || !customAmount}
                className="h-14 px-6 font-black rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all shadow-lg"
                onClick={() => handlePaystackTopUp(parseFloat(customAmount))}
              >
                {isTopUpLoading ? <Loader2 className="animate-spin w-5 h-5"/> : 'TOP UP 👑'}
              </Button>
          </div>

          <p className="text-xs font-black text-slate-400 uppercase text-center tracking-widest">Quick Options</p>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map((amt) => (
              <Button 
                key={amt}
                variant="outline"
                disabled={isTopUpLoading}
                className="h-12 font-black rounded-xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                onClick={() => handlePaystackTopUp(amt)}
              >
                {amt}
              </Button>
            ))}
          </div>

          <Button variant="ghost" className="w-full text-slate-400 font-bold" onClick={onClose}>
            BACK TO DASHBOARD
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
