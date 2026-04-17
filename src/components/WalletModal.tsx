import { auth } from '@/src/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, MessageSquare, Info } from 'lucide-react';
import { UserProfile } from '@/src/types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function WalletModal({ isOpen, onClose, profile }: WalletModalProps) {
  const handleWhatsApp = (target: 'kingj' | 'yhaw') => {
    const phone = target === 'kingj' ? '233535884851' : '233541557530';
    const text = `Hello King J Deals, I want to top up my royal wallet! 👑\n\nName: ${profile?.fullName || 'Customer'}\nEmail: ${auth.currentUser?.email}\nDesired Top-up Amount: GHS `;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
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
            Manage your royal balance for instant data.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Available Balance</span>
            <span className="text-3xl font-black text-primary">GHS {profile?.walletBalance?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-500 mt-4 bg-white/50 p-3 rounded-xl">
            <Info className="w-4 h-4 mt-0.5 text-primary" />
            <p>To add funds, please contact our support team via WhatsApp. We accept MoMo payments and credit your wallet instantly.</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase text-center tracking-widest">Reach out to Top Up</p>
          
          <div className="grid grid-cols-1 gap-3">
             <Button 
              className="h-14 font-black rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white transition-all gap-2 text-lg shadow-lg"
              onClick={() => handleWhatsApp('kingj')}
            >
              <MessageSquare className="w-6 h-6" />
              CONTACT KING J 👑
            </Button>
            
            <Button 
              variant="outline"
              className="h-14 font-black rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2"
              onClick={() => handleWhatsApp('yhaw')}
            >
              <MessageSquare className="w-5 h-5" />
              CONTACT YHAW 👑
            </Button>
          </div>

          <Button variant="ghost" className="w-full text-slate-400 font-bold" onClick={onClose}>
            BACK TO DASHBOARD
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
