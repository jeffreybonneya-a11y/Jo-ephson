import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, db } from '@/src/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, Chrome, Phone, Crown, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Valid phone number is required (min 10 digits)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "User",
          role: 'user',
          walletBalance: 0,
          topupReference: 'KJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        });
      }
      
      toast.success("Logged in with Google!");
      onClose();
    } catch (error: any) {
      console.error("Login Error:", error);
      const errorMessage = error.code === 'auth/unauthorized-domain' 
        ? "This domain is not authorized in Firebase. Please add it to Authorized Domains in Firebase Console."
        : error.message || "Google login failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-slate-50">
        <div className="bg-secondary p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
                <Crown className="w-10 h-10 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-3xl font-black text-center tracking-tight">
              WELCOME TO ROYALTY 👑
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 mt-2">
              Join King J Deals today for the fastest and most affordable data bundles in Ghana.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          <div className="mb-8 grid grid-cols-3 gap-4">
            {[
              { icon: Zap, label: "Instant" },
              { icon: ShieldCheck, label: "Secure" },
              { icon: Crown, label: "Royal" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <item.icon className="w-6 h-6 text-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-tighter">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900">SIGN IN TO CONTINUE 👑</h3>
              <p className="text-sm text-slate-500">We use Google for a secure and instant login experience. No passwords required!</p>
            </div>

            <Button 
              className="w-full h-16 font-black text-xl bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-4" 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Chrome className="h-8 w-8 text-blue-500" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Your data is safe with us. We only use your Google account to verify your identity and manage your royal wallet.
              </p>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-8 px-4">
            By continuing, you agree to King J Deals' Terms of Service and Privacy Policy. 👑
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
