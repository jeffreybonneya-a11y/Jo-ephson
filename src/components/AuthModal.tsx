import { useState, useEffect } from 'react';
import { auth } from '@/src/lib/firebase';
import { syncUserCustomerRecord } from '@/src/lib/userSync';
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isNativeApp } from '@/src/lib/platform';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Chrome, Crown, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Detect if running inside an iframe
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    // 1. Native Android Authentication Flow
    if (isNativeApp()) {
      try {
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        // Retrieve ID token from credential
        let idToken = result.credential?.idToken;

        if (!idToken) {
          // If no token in credential directly, check if user exists or fetch token
          if (!result.user) {
            toast.info("Google sign-in cancelled.");
            return;
          }
          try {
            const tokenResult = await FirebaseAuthentication.getIdToken();
            idToken = tokenResult?.token;
          } catch (tErr) {
            console.warn("[Native Auth] Could not fetch secondary ID token:", tErr);
          }
        }

        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          if (user) {
            await syncUserCustomerRecord(user);
          }
        } else if (result.user?.uid) {
          // In case native auth signed in without raw ID token, verify current Firebase user
          if (auth.currentUser) {
            await syncUserCustomerRecord(auth.currentUser);
          }
        }

        toast.success("Logged in with Google! 👑");
        onClose();
      } catch (nativeError: any) {
        console.error("[Native Auth] Login Error:", nativeError);
        const errMsg = nativeError?.message || String(nativeError);
        const errCode = nativeError?.code;

        // User cancellation (Google Play services code 12501 or 16)
        if (
          errCode === '12501' || 
          errCode === '16' ||
          errMsg.includes('canceled') || 
          errMsg.includes('cancelled') || 
          errMsg.includes('closed') ||
          errMsg.includes('Sign in action cancelled')
        ) {
          toast.info("Google sign-in cancelled.");
          return;
        }

        // Developer / Configuration errors
        if (
          errMsg.includes('10:') || 
          errMsg.includes('DEVELOPER_ERROR') || 
          errMsg.includes('developer error')
        ) {
          toast.error(
            "Google sign-in configuration pending. Please ensure SHA-1 fingerprint and google-services.json are configured in Firebase.",
            { duration: 7000 }
          );
          return;
        }

        // Network / Connectivity errors
        if (
          errMsg.includes('network') || 
          errMsg.includes('offline') || 
          errCode === 'auth/network-request-failed'
        ) {
          toast.error("Network connection error. Please check your internet connection.", { duration: 5000 });
          return;
        }

        toast.error("Unable to sign in with Google. Please try again.", { duration: 5000 });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Web Authentication Flow (signInWithPopup)
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        // Safely synchronize user customer record with Firebase Auth
        await syncUserCustomerRecord(user);
      }
      
      toast.success("Logged in with Google!");
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user')) {
        // User closed the popup intentionally - notify gently without triggering error logs
        toast.info("Google sign-in cancelled.");
        return;
      }

      if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
        toast.warning(
          isIframe 
            ? "Google Sign-In pop-up was blocked inside the preview frame. Click 'Open App in New Tab 🔗' below to log in!"
            : "Login pop-up was blocked by your browser. Please allow popups or click 'Open App in New Tab 🔗' below!",
          { duration: 7000 }
        );
        return;
      }

      console.error("Login Error:", error);
      let errorMessage = error.message || "Google login failed";
      
      if (error.code === 'auth/internal-error' || error.message?.includes('internal-error')) {
        errorMessage = "Google login encountered an iframe restriction. Please click 'Open App in New Tab 🔗' below to sign in!";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized in Firebase. Please add it to Authorized Domains in Firebase Console.";
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        errorMessage = "Google login was blocked inside the iframe by your browser. Please open the app in a new tab!";
      } else if (error.code === 'auth/invalid-credential' || error.message?.includes('invalid-credential')) {
        errorMessage = "Invalid or expired Google credential. Please try again!";
      }
      
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none bg-white dark:bg-slate-950 max-h-[90vh] overflow-y-auto">
        <div className="bg-secondary p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
                <Crown className="w-8 h-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-black text-center tracking-tight">
              WELCOME TO ROYALTY 👑
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 text-xs mt-1">
              Join King J Deals today for the fastest and most affordable data bundles in Ghana.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center space-y-2 py-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">SIGN IN WITH GOOGLE 👑</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">One-click secure and instant login experience. No passwords required!</p>
          </div>

          <Button 
            className="w-full h-14 font-black text-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3" 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Chrome className="h-6 w-6 text-blue-500" />
                Continue with Google
              </>
            )}
          </Button>

          {isIframe && !isNativeApp() ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-200">
              <p className="font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                Running in Preview IFrame
              </p>
              <p className="leading-relaxed text-[11px]">
                Google sign-in popups are often blocked by browser privacy restrictions inside iframes.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 text-xs font-black border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 bg-transparent"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  Open App in New Tab 🔗
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                Your data is safe with us. We only use your Google account to verify your identity and manage your royal wallet.
              </p>
            </div>
          )}

          <p className="text-center text-[9px] text-slate-400 mt-4 px-4">
            By continuing, you agree to King J Deals' Terms of Service and Privacy Policy. 👑
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

