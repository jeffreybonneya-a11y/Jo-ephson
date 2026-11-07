import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/src/lib/firebase';
import { syncUserCustomerRecord } from '@/src/lib/userSync';
import { initMonetagInPagePush, cleanupMonetagInPagePush } from '@/src/lib/monetag';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential, 
  signInWithRedirect, 
  getRedirectResult, 
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isNativeApp, isAndroidNative } from '@/src/lib/platform';
import { Crown, Sparkles, ShieldCheck, ExternalLink, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import AppDownloadModal from './AppDownloadModal';
import WhatsAppChannelAdModal from './WhatsAppChannelAdModal';
import BrandWordmark from './BrandWordmark';

interface WelcomePageProps {
  onLoginSuccess?: () => void;
}

export default function WelcomePage({ onLoginSuccess }: WelcomePageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isWhatsAppAdOpen, setIsWhatsAppAdOpen] = useState(false);
  const monetagAdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }
  }, []);

  // Handle returning redirect results if redirect auth flow was used
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result || !result.user) return;
        const user = result.user;
        console.log("[WelcomePage] Google Redirect Sign-In resolved successfully:", user.email);

        try {
          localStorage.setItem('dgn_authenticated_user', 'true');
          localStorage.setItem('dgn_auth_uid', user.uid);
          if (user.email) localStorage.setItem('dgn_auth_email', user.email);
        } catch {}

        syncUserCustomerRecord(user).catch((err) => {
          console.warn("[WelcomePage] Background customer record sync notice:", err);
        });

        const userFullName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
        toast.success(`Welcome to DATAGHANAnow, ${userFullName}!`);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      })
      .catch((redirectErr: any) => {
        if (!isMounted) return;
        if (redirectErr?.code && redirectErr.code !== 'auth/popup-closed-by-user') {
          console.error("[WelcomePage] Redirect sign-in error:", redirectErr);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onLoginSuccess]);

  // Initialize Monetag In-Page Push zone 11767716 ONLY when WelcomePage is active and user is unauthenticated
  useEffect(() => {
    initMonetagInPagePush(monetagAdRef.current);

    // Cleanup immediately when WelcomePage unmounts upon login/navigation
    return () => {
      cleanupMonetagInPagePush();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    // 1. NATIVE ANDROID / CAPACITOR FLOW (Must NOT use signInWithPopup)
    if (isNativeApp() || isAndroidNative()) {
      const envWebClientId = (import.meta as any).env?.VITE_FIREBASE_WEB_CLIENT_ID?.trim();
      const clientOptions = envWebClientId ? { serverClientId: envWebClientId, clientId: envWebClientId } : {};

      try {
        console.log("[WelcomePage Native Auth] Initiating native Google Sign-in...");

        let result;
        try {
          // Attempt modern Credential Manager first
          console.log("[WelcomePage Native Auth] Attempting sign-in with Credential Manager...", clientOptions);
          result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: true, ...clientOptions });
        } catch (cmError: any) {
          console.warn("[WelcomePage Native Auth] Credential Manager returned:", cmError);
          const cmMsg = cmError?.message || String(cmError);

          // If Credential Manager fails, cancelled by system, or unsupported, try Google Play Services standard flow
          console.log("[WelcomePage Native Auth] Trying Google Play Services Sign-In fallback...");
          try {
            result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false, ...clientOptions });
          } catch (fallbackError: any) {
            console.error("[WelcomePage Native Auth] Both Credential Manager and standard Sign-In failed:", fallbackError);
            throw fallbackError || cmError;
          }
        }
        console.log("[WelcomePage Native Auth] Native sign-in result received:", JSON.stringify(result));

        // Extract ID token & access token from native credential
        let idToken = result.credential?.idToken;
        const accessToken = result.credential?.accessToken;

        if (!idToken) {
          try {
            const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
            idToken = tokenResult?.token;
          } catch (tErr) {
            console.warn("[WelcomePage Native Auth] Secondary token fetch:", tErr);
          }
        }

        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken, accessToken || undefined);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          if (user) {
            await syncUserCustomerRecord(user);
            const userFullName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
            try {
              localStorage.setItem('dgn_authenticated_user', 'true');
              localStorage.setItem('dgn_auth_uid', user.uid);
              if (user.email) localStorage.setItem('dgn_auth_email', user.email);
            } catch {}
            toast.success(`Welcome to DATAGHANAnow, ${userFullName}!`);
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          }
        } else if (result.user) {
          if (auth.currentUser) {
            await syncUserCustomerRecord(auth.currentUser);
          }
          const userFullName = result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : 'Customer');
          try {
            localStorage.setItem('dgn_authenticated_user', 'true');
            if (result.user.uid) localStorage.setItem('dgn_auth_uid', result.user.uid);
            if (result.user.email) localStorage.setItem('dgn_auth_email', result.user.email);
          } catch {}
          toast.success(`Welcome to DATAGHANAnow, ${userFullName}!`);
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }
      } catch (nativeError: any) {
        console.error("[WelcomePage Native Auth] Full Login Error:", {
          message: nativeError?.message,
          code: nativeError?.code,
          error: nativeError
        });
        const errMsg = nativeError?.message || String(nativeError);
        const errCode = nativeError?.code;

        // Developer / Configuration / Web Client ID mismatch errors (Code 10 / DEVELOPER_ERROR)
        if (
          errMsg.includes('10:') || 
          errMsg.includes('DEVELOPER_ERROR') || 
          errMsg.includes('developer error') ||
          errMsg.includes('default_web_client_id')
        ) {
          const msg = "Google Sign-In Configuration Error (Code 10 / DEVELOPER_ERROR)\n\n" +
            "• Package ID: com.dataghananow.app\n" +
            "• Release SHA-1: BB:61:07:1E:39:16:FC:C9:9B:1F:0A:20:39:31:4E:72:E3:0E:5C:B4\n" +
            "• Current Web Client ID: " + (envWebClientId || "768663077481-web.apps.googleusercontent.com") + "\n\n" +
            "Action Required in Firebase Console:\n" +
            "Go to Authentication → Sign-in method → Google → Web SDK configuration, copy your real Web client ID (format: 768663077481-xxx...apps.googleusercontent.com), and place it in google-services.json.";
          setErrorMessage(msg);
          toast.error("Google Sign-In configuration error (Code 10 / DEVELOPER_ERROR).", { duration: 9000 });
          return;
        }

        // Credential / OAuth token cancellation or verification failure
        if (
          errMsg.includes('GET_CREDENTIAL_CANCELED') ||
          errMsg.includes('GetCredentialCancellationException') ||
          errMsg.includes('16') ||
          errMsg.includes('12501')
        ) {
          const msg = "Google Sign-In Credential Error (Code 12501 / Canceled by Provider)\n\n" +
            "Google Play Services could not authenticate with the provided client ID. Ensure that the Web Client ID in google-services.json matches your Firebase Console.";
          setErrorMessage(msg);
          toast.error("Google Sign-In could not verify credentials with Google.", { duration: 8000 });
          return;
        }

        if (
          errMsg.includes('network') || 
          errMsg.includes('offline') || 
          errCode === 'auth/network-request-failed'
        ) {
          const msg = "Network connection interrupted. Please check your internet connection and try again.";
          setErrorMessage(msg);
          toast.error(msg, { duration: 5000 });
          return;
        }

        const msg = errMsg || "Google sign-in could not be completed on Android.";
        setErrorMessage(msg);
        toast.error(msg, { duration: 7000 });
      } finally {
        setIsLoading(false);
      }
      return; // CRITICAL: Stop here, never fall through to web signInWithPopup
    }

    // 2. WEB BROWSER FLOW (signInWithPopup with browserPopupRedirectResolver)
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      console.log("[WelcomePage] Initiating Google Sign-In via popup...");
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const user = result.user;

      if (user) {
        // Authentication has succeeded!
        try {
          localStorage.setItem('dgn_authenticated_user', 'true');
          localStorage.setItem('dgn_auth_uid', user.uid);
          if (user.email) localStorage.setItem('dgn_auth_email', user.email);
        } catch {}

        // Non-blocking sync to avoid masking a successful login
        syncUserCustomerRecord(user).catch((syncErr) => {
          console.warn("[WelcomePage] Background customer record sync notice:", syncErr);
        });

        const userFullName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
        toast.success(`Welcome to DATAGHANAnow, ${userFullName}!`);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (error: any) {
      // User closed popup intentionally or opened another request - gently notify without logging a console error
      if (
        error?.code === 'auth/popup-closed-by-user' || 
        error?.message?.includes('popup-closed-by-user') ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('cancelled-popup-request')
      ) {
        toast.info("Google sign-in was closed. Click Continue with Google whenever you're ready!");
        return;
      }

      // Browser popup blocked - handle cleanly and seamlessly fallback to redirect if not in an iframe
      if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup-blocked')) {
        console.warn("[Firebase Auth] Pop-up blocked by browser policy. Attempting redirect fallback...");
        if (!isIframe) {
          try {
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr) {
            console.warn("[Firebase Auth] Redirect fallback notice:", redirectErr);
          }
        }
        const msg = isIframe
          ? "Google Sign-In popup was blocked inside the preview iframe. Click 'Open App in New Tab 🔗' below to log in seamlessly!"
          : "The Google Sign-In pop-up was blocked by your browser. Please allow popups for this site or tap Continue with Google again.";
        setErrorMessage(msg);
        toast.warning(msg, { duration: 6000 });
        return;
      }

      console.error(`[Firebase Auth Error] Code: ${error?.code || 'unknown'} | Message: ${error?.message || error}`);

      let userFriendlyMsg = "Google sign-in could not be completed. Please try again.";

      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'dataghananow.com';
        userFriendlyMsg = `Domain (${currentDomain}) is not authorized in Firebase Console.\nAction required: Add "${currentDomain}" to Authentication → Settings → Authorized domains in Firebase Console.`;
        console.error(`[Firebase Auth] Critical: Add "${currentDomain}" to Authorized domains in Firebase Console (Authentication > Settings > Authorized domains).`);
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        userFriendlyMsg = "Pop-up authentication is not supported in this browser environment. Please open in Chrome or Safari directly.";
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        userFriendlyMsg = "Network connection interrupted. Please check your internet connection and try again.";
      } else if (error.code === 'auth/internal-error' || error.message?.includes('internal-error')) {
        userFriendlyMsg = isIframe 
          ? "Google Sign-In encountered an iframe restriction. Open in a new tab to complete login!"
          : "Authentication encountered an unexpected internal error. Please try again.";
      } else if (error.code === 'auth/configuration-not-found' || error.code === 'auth/app-not-authorized') {
        userFriendlyMsg = "Google Sign-In is not enabled for this project in Firebase Console. Please verify Google provider is active.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        userFriendlyMsg = "An account already exists with this email using a different sign-in method.";
      } else if (error.code) {
        userFriendlyMsg = `Google sign-in failed (${error.code}). Please try again.`;
      }

      setErrorMessage(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="dataghananow-welcome-screen" className="relative min-h-screen w-full bg-[#070D1E] text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 overflow-x-hidden select-none">
      {/* Atmospheric Royal Glow Backdrop (Static & Performance-Optimized) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-[#070D1E]/90 to-[#070D1E] pointer-events-none z-[1]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none z-[1]" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-[1]" />

      {/* 1. TOP BRANDING & WELCOME MESSAGE */}
      <header className="relative z-10 w-full max-w-xl text-center pt-2 sm:pt-4 space-y-3">
        <div className="flex justify-center mb-1">
          <BrandWordmark size="xl" showTagline={false} />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Affordable Data Deals &amp; <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Digital Services in Ghana</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed px-2">
          Access affordable digital services, data bundles, results checkers, entertainment and more.
        </p>
      </header>

      {/* 3. UIVERSE-INSPIRED LOGIN CARD */}
      <main className="relative z-10 w-full flex justify-center items-center my-auto py-6">
        <div
          id="dataghananow-login-card"
          className="relative w-full rounded-3xl p-6 sm:p-8 bg-[#0F172A]/90 border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(245,158,11,0.08)] backdrop-blur-xl transition-all"
          style={{ width: 'min(92vw, 440px)' }}
        >
          {/* Subtle Top Accent Ribbon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />

          {/* Card Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-2">
              <BrandWordmark size="md" />
            </div>

            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome to DATAGHANAnow
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Sign in with your Google account to continue
              </p>
            </div>
          </div>

          {/* Error notice if applicable */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-medium space-y-2">
              <p className="leading-relaxed whitespace-pre-line text-[12px]">{errorMessage}</p>
              {isIframe && (
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-1.5 px-3 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-400/30 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open App in New Tab 🔗
                </button>
              )}
            </div>
          )}

          {/* Google Sign-in Action Button (ONLY GOOGLE LOGIN) */}
          <div className="space-y-4">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full h-14 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-3.5 shadow-lg active:scale-[0.98] ${
                isLoading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-amber-400 font-black tracking-wide">Signing you in...</span>
                </div>
              ) : (
                <>
                  {/* Official Google 'G' Color Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="tracking-tight text-slate-900">Continue with Google</span>
                </>
              )}
            </button>

            {/* Iframe detection notice */}
            {isIframe && !errorMessage && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-200">Preview Mode Notice</p>
                  <p className="text-slate-300 leading-snug">
                    If the popup is blocked by your browser inside this preview frame:
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="mt-1.5 font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
                  >
                    Open App in New Tab 🔗
                  </button>
                </div>
              </div>
            )}

            {/* Trust Badge */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant 1-Click Access • No Password Needed</span>
            </div>

            {/* Android APK Download Option & WhatsApp Channel */}
            <div className="pt-3 border-t border-slate-700/60 space-y-2 text-center">
              <button
                type="button"
                onClick={() => setIsWhatsAppAdOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <span className="text-sm">📢</span>
                <span>Join DATAGHANAnow WhatsApp Channel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>📱 Download DATAGHANAnow Android App</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 4. MONETAG IN-PAGE PUSH AD PLACEMENT (ZONE 11767716) */}
      <section
        id="monetag-inpage-push-wrapper"
        aria-label="Sponsored Ad"
        className="relative z-10 w-full flex flex-col items-center justify-center my-4 sm:my-6 px-4"
      >
        <div
          id="monetag-zone-11767716"
          data-zone="11767716"
          ref={monetagAdRef}
          className="w-full max-w-[440px] min-h-[50px] flex items-center justify-center overflow-visible"
        />
      </section>

      {/* 10. FOOTER TAGLINE */}
      <footer className="relative z-10 w-full text-center pb-2 pt-4 space-y-1">
        <p className="text-xs sm:text-sm font-black tracking-wide text-amber-400">
          Fast &amp; Reliable Data Deals in Ghana
        </p>
        <p className="text-[10px] text-slate-500 font-medium">
          © {new Date().getFullYear()} DATAGHANAnow. All rights reserved.
        </p>
      </footer>

      {/* App Download Modal */}
      <AppDownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />

      {/* Official WhatsApp Channel Ad Modal */}
      <WhatsAppChannelAdModal 
        forceOpen={isWhatsAppAdOpen}
        onClose={() => setIsWhatsAppAdOpen(false)}
      />
    </div>
  );
}
