import React, { useState, useEffect } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Crown, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomePageProps {
  onLoginSuccess?: () => void;
}

export default function WelcomePage({ onLoginSuccess }: WelcomePageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        // Ensure user profile in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userFullName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
        const userUsername = user.displayName
          ? user.displayName.toLowerCase().replace(/\s+/g, '_')
          : user.email ? user.email.split('@')[0] : 'customer';
        const adminEmails = ['kingjdeals@gmail.com', 'jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
        const isEmailAdmin = adminEmails.includes(user.email?.toLowerCase() || '');

        const rawProvider = user.providerData?.[0]?.providerId || '';
        const authProvider = rawProvider === 'google.com' || user.email?.toLowerCase().endsWith('@gmail.com')
          ? 'Google'
          : rawProvider === 'password'
          ? 'Email/Password'
          : rawProvider || 'Google';

        const creationTime = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toISOString() : new Date().toISOString();
        const lastSignIn = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString() : new Date().toISOString();

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            id: user.uid,
            email: user.email || '',
            gmail: user.email || '',
            fullName: userFullName,
            displayName: user.displayName || userFullName,
            username: userUsername,
            role: isEmailAdmin ? 'admin' : 'user',
            walletBalance: 0,
            photoURL: user.photoURL || '',
            authProvider: authProvider,
            providerId: rawProvider || 'google.com',
            createdAt: creationTime,
            lastLoginAt: lastSignIn,
            lastSignInTime: lastSignIn,
            topupReference: 'KJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          }, { merge: true });
        } else {
          const existingData = userDoc.data();
          const updates: any = {
            lastLoginAt: lastSignIn,
            lastSignInTime: lastSignIn,
          };
          if (!existingData.email && user.email) updates.email = user.email;
          if (!existingData.gmail && user.email) updates.gmail = user.email;
          if (!existingData.fullName && userFullName) updates.fullName = userFullName;
          if (!existingData.displayName && user.displayName) updates.displayName = user.displayName;
          if (!existingData.username && userUsername) updates.username = userUsername;
          if (!existingData.id) updates.id = user.uid;
          if (!existingData.uid) updates.uid = user.uid;
          if (!existingData.createdAt) updates.createdAt = creationTime;
          if (!existingData.authProvider) updates.authProvider = authProvider;
          if (!existingData.providerId && rawProvider) updates.providerId = rawProvider;
          if (user.photoURL && !existingData.photoURL) updates.photoURL = user.photoURL;
          if (user.phoneNumber && !existingData.phoneNumber) updates.phoneNumber = user.phoneNumber;
          if (isEmailAdmin && existingData.role !== 'admin') updates.role = 'admin';
          await setDoc(userRef, updates, { merge: true });
        }

        localStorage.setItem('kj_session_last_active_at', Date.now().toString());
        toast.success(`Welcome to King J Deals, ${userFullName}! 👑`);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user')) {
        toast.info("Google sign-in was cancelled. Click below when you're ready! 👑");
        return;
      }

      if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
        const msg = isIframe
          ? "Google Sign-In popup was blocked inside the preview iframe. Click 'Open App in New Tab' to log in seamlessly!"
          : "Login pop-up was blocked by your browser. Please allow popups or open in a new tab.";
        setErrorMessage(msg);
        toast.warning(msg, { duration: 6000 });
        return;
      }

      let userFriendlyMsg = "Google sign-in could not be completed. Please try again.";
      if (error.code === 'auth/internal-error' || error.message?.includes('internal-error')) {
        userFriendlyMsg = "Sign-in encountered an environment restriction. Open in a new tab to complete login!";
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        userFriendlyMsg = "Network connection interrupted. Please check your connection and try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        userFriendlyMsg = "This domain is awaiting Firebase domain verification.";
      }

      setErrorMessage(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="kingj-welcome-screen" className="relative min-h-screen w-full bg-[#070D1E] text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 overflow-x-hidden select-none">
      {/* SCOPED SPEEDER LOADER STYLES */}
      <style>{`
        .kingj-speeder-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .kingj-speeder-canvas .loader {
          position: absolute;
          top: 30%;
          left: 50%;
          margin-left: -75px;
          margin-top: -30px;
          opacity: 0.35;
          transform: scale(0.85);
        }

        @media (min-width: 640px) {
          .kingj-speeder-canvas .loader {
            top: 25%;
            margin-left: -90px;
            transform: scale(1.1);
            opacity: 0.45;
          }
        }

        .kingj-speeder-canvas .speeder {
          animation: kj_speeder 0.45s linear infinite;
        }

        .kingj-speeder-canvas .speeder > span {
          height: 4px;
          width: 32px;
          background: #f59e0b;
          position: absolute;
          top: -17px;
          left: 55px;
          border-radius: 2px 10px 1px 0;
        }

        .kingj-speeder-canvas .base span {
          position: absolute;
          width: 0;
          height: 0;
          border-top: 6px solid transparent;
          border-right: 90px solid #f59e0b;
          border-bottom: 6px solid transparent;
        }

        .kingj-speeder-canvas .base span:before {
          content: "";
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f59e0b;
          position: absolute;
          right: -98px;
          top: -15px;
        }

        .kingj-speeder-canvas .base span:after {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border-top: 0 solid transparent;
          border-right: 48px solid #1e293b;
          border-bottom: 15px solid transparent;
          top: -15px;
          right: -88px;
        }

        .kingj-speeder-canvas .face {
          position: absolute;
          height: 11px;
          width: 18px;
          background: #f59e0b;
          border-radius: 20px 20px 0 0;
          transform: rotate(-40deg);
          right: -112px;
          top: -14px;
        }

        .kingj-speeder-canvas .face:after {
          content: "";
          height: 11px;
          width: 11px;
          background: #070d1e;
          right: 3px;
          top: 6px;
          position: absolute;
          transform: rotate(40deg);
          transform-origin: 50% 50%;
          border-radius: 0 0 0 2px;
        }

        .kingj-speeder-canvas .loader > span > span {
          width: 28px;
          height: 1.5px;
          background: #fbbf24;
          position: absolute;
        }

        .kingj-speeder-canvas .fazer1 {
          top: -4px;
          animation: kj_fazer1 0.3s linear infinite;
        }

        .kingj-speeder-canvas .fazer2 {
          top: 3px;
          animation: kj_fazer2 0.45s linear infinite;
        }

        .kingj-speeder-canvas .fazer3 {
          top: 1px;
          animation: kj_fazer3 0.35s linear infinite;
          animation-delay: -0.6s;
        }

        .kingj-speeder-canvas .fazer4 {
          top: 6px;
          animation: kj_fazer4 0.7s linear infinite;
          animation-delay: -0.8s;
        }

        @keyframes kj_fazer1 {
          0% { left: 20px; opacity: 1; }
          100% { left: -90px; opacity: 0; }
        }

        @keyframes kj_fazer2 {
          0% { left: 20px; opacity: 1; }
          100% { left: -110px; opacity: 0; }
        }

        @keyframes kj_fazer3 {
          0% { left: 20px; opacity: 1; }
          100% { left: -70px; opacity: 0; }
        }

        @keyframes kj_fazer4 {
          0% { left: 20px; opacity: 1; }
          100% { left: -140px; opacity: 0; }
        }

        @keyframes kj_speeder {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -3px) rotate(-1deg); }
          20% { transform: translate(-2px, 0px) rotate(1deg); }
          30% { transform: translate(1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-2px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 1px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }

        .kingj-speeder-canvas .longfazers {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          opacity: 0.3;
        }

        .kingj-speeder-canvas .longfazers span {
          position: absolute;
          height: 1.5px;
          width: 25%;
          background: linear-gradient(90deg, transparent, #f59e0b, transparent);
        }

        .kingj-speeder-canvas .lf {
          top: 15%;
          animation: kj_lf 0.7s linear infinite;
          animation-delay: -3s;
        }

        .kingj-speeder-canvas .lf2 {
          top: 38%;
          animation: kj_lf2 0.9s linear infinite;
          animation-delay: -1s;
        }

        .kingj-speeder-canvas .lf3 {
          top: 62%;
          animation: kj_lf3 0.65s linear infinite;
        }

        .kingj-speeder-canvas .lf4 {
          top: 85%;
          animation: kj_lf4 0.55s linear infinite;
          animation-delay: -2s;
        }

        @keyframes kj_lf {
          0% { transform: translate(400%, 0); }
          100% { transform: translate(-400%, 0); opacity: 0; }
        }

        @keyframes kj_lf2 {
          0% { transform: translate(400%, 0); }
          100% { transform: translate(-400%, 0); opacity: 0; }
        }

        @keyframes kj_lf3 {
          0% { transform: translate(400%, 0); }
          100% { transform: translate(-400%, 0); opacity: 0; }
        }

        @keyframes kj_lf4 {
          0% { transform: translate(400%, 0); }
          100% { transform: translate(-400%, 0); opacity: 0; }
        }
      `}</style>

      {/* SPEEDER LOADER ANIMATION BACKGROUND */}
      <div className="kingj-speeder-canvas" aria-hidden="true">
        <div className="loader speeder">
          <span>
            <span className="fazer1"></span>
            <span className="fazer2"></span>
            <span className="fazer3"></span>
            <span className="fazer4"></span>
          </span>
          <div className="base">
            <span></span>
            <div className="face"></div>
          </div>
        </div>
        <div className="longfazers">
          <span className="lf"></span>
          <span className="lf2"></span>
          <span className="lf3"></span>
          <span className="lf4"></span>
        </div>
      </div>
      {/* Atmospheric Royal Glow Backdrop */}
      <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none z-[2]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none z-[2]" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none z-[2]" />

      {/* 1. TOP BRANDING & WELCOME MESSAGE */}
      <header className="relative z-10 w-full max-w-xl text-center pt-2 sm:pt-4 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>KING J DEALS</span>
          <Crown className="w-3.5 h-3.5 text-amber-400" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Great Deals on <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Products You Love</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed px-2">
          Access affordable digital services, data bundles, results checkers, entertainment and more.
        </p>
      </header>

      {/* 3. UIVERSE-INSPIRED LOGIN CARD */}
      <main className="relative z-10 w-full flex justify-center items-center my-auto py-6">
        <div
          id="kingj-login-card"
          className="relative w-full rounded-3xl p-6 sm:p-8 bg-[#0F172A]/90 border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(245,158,11,0.08)] backdrop-blur-xl transition-all"
          style={{ width: 'min(92vw, 440px)' }}
        >
          {/* Subtle Top Accent Ribbon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />

          {/* Card Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>

            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Sign in with your Google account to continue
              </p>
            </div>
          </div>

          {/* Error notice if applicable */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-medium space-y-2">
              <p className="leading-snug">{errorMessage}</p>
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
                  <span className="text-amber-400 font-black tracking-wide">Signing you in... 👑</span>
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
          </div>
        </div>
      </main>

      {/* 10. FOOTER TAGLINE */}
      <footer className="relative z-10 w-full text-center pb-2 pt-4 space-y-1">
        <p className="text-xs sm:text-sm font-black tracking-wide text-amber-400">
          Spend small, Enjoy like a King 👑
        </p>
        <p className="text-[10px] text-slate-500 font-medium">
          © {new Date().getFullYear()} King J Deals. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
