import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Crown, 
  ShieldCheck, 
  Smartphone, 
  DollarSign,
  History,
  HelpCircle,
  Gamepad2,
  CheckSquare,
  Home,
  Gift,
  Download,
  MessageCircle,
  Monitor
} from 'lucide-react';

export default function Hero() {
  const scrollToPricing = () => {
    const el = document.getElementById('bundle-tabs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectNetwork = (network: string) => {
    window.dispatchEvent(new CustomEvent('SELECT_BUNDLE_TAB', { detail: { tab: network } }));
    scrollToPricing();
  };

  const handleGoHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event('NAVIGATE_TO_HOME'));
  };

  const handleGoBookingCodes = () => {
    window.dispatchEvent(new CustomEvent('SELECT_BUNDLE_TAB', { detail: { tab: 'Booking Codes' } }));
    scrollToPricing();
  };

  const handleGoHistory = () => {
    window.dispatchEvent(new Event('NAVIGATE_TO_HISTORY'));
  };

  const handleGoAgentStore = () => {
    window.dispatchEvent(new Event('NAVIGATE_TO_AGENT_STORE'));
  };

  const handleOpenReferral = () => {
    window.dispatchEvent(new CustomEvent('OPEN_REFERRAL_MODAL'));
  };

  const handleOpenSupport = () => {
    window.dispatchEvent(new CustomEvent('OPEN_SUPPORT_MODAL'));
  };

  const handleOpenDownloadApp = () => {
    window.dispatchEvent(new CustomEvent('OPEN_APP_DOWNLOAD_MODAL'));
  };

  const handleGoCheckers = () => {
    window.dispatchEvent(new CustomEvent('SELECT_BUNDLE_TAB', { detail: { tab: 'Result Checker' } }));
    scrollToPricing();
  };

  const handleGoGameCoins = () => {
    window.dispatchEvent(new CustomEvent('SELECT_BUNDLE_TAB', { detail: { tab: 'Game Coins' } }));
    scrollToPricing();
  };

  const handleGoPcGames = () => {
    window.dispatchEvent(new CustomEvent('SELECT_BUNDLE_TAB', { detail: { tab: 'PC Games' } }));
    scrollToPricing();
  };

  return (
    <section 
      id="homepage-hero-section"
      className="relative pt-4 sm:pt-6 pb-12 md:pb-16 overflow-hidden bg-[#060A14] text-slate-100"
    >
      {/* Background Atmospheric Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/[0.05] blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-28 w-[400px] h-[400px] bg-blue-900/[0.1] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        
        {/* SECTION 2: NEW YELLOW/ORANGE NAVIGATION DASHBOARD (7 Items) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-4 sm:p-6 text-slate-950 shadow-2xl relative overflow-hidden border border-amber-300/60"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none font-black text-9xl font-serif">
            👑
          </div>

          <div className="relative z-10 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-3 py-1 rounded-full shadow-sm">
              👑 Main Navigation Dashboard
            </span>
            <span className="text-xs font-bold text-slate-950/80">Instant Automated Services</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            
            {/* 1. HOME */}
            <button
              type="button"
              onClick={handleGoHome}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
            >
              <Home className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">HOME</span>
            </button>

            {/* 2. BOOKING CODES */}
            <button
              type="button"
              onClick={handleGoBookingCodes}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-all cursor-pointer border border-slate-950/20 shadow-sm hover:scale-[1.02] active:scale-95 font-bold"
            >
              <DollarSign className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">BOOKING CODES</span>
            </button>

            {/* 3. HISTORY */}
            <button
              type="button"
              onClick={handleGoHistory}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-all cursor-pointer border border-slate-950/20 shadow-sm hover:scale-[1.02] active:scale-95 font-bold"
            >
              <History className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">HISTORY</span>
            </button>

            {/* 4. AGENT STORE */}
            <button
              type="button"
              onClick={handleGoAgentStore}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-all cursor-pointer border border-slate-950/20 shadow-sm hover:scale-[1.02] active:scale-95 font-bold"
            >
              <Crown className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">AGENT STORE</span>
            </button>

            {/* 5. REFER & EARN */}
            <button
              type="button"
              onClick={handleOpenReferral}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-all cursor-pointer border border-slate-950/20 shadow-sm hover:scale-[1.02] active:scale-95 font-bold"
            >
              <Gift className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">REFER &amp; EARN</span>
            </button>

            {/* 6. SUPPORT */}
            <button
              type="button"
              onClick={handleOpenSupport}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-all cursor-pointer border border-slate-950/20 shadow-sm hover:scale-[1.02] active:scale-95 font-bold"
            >
              <MessageCircle className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">SUPPORT</span>
            </button>

            {/* 7. DOWNLOAD APP */}
            <button
              type="button"
              onClick={handleOpenDownloadApp}
              className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-all cursor-pointer border border-slate-950/20 shadow-sm hover:scale-[1.02] active:scale-95 font-bold col-span-2 sm:col-span-1"
            >
              <Download className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide uppercase">DOWNLOAD APP</span>
            </button>

          </div>
        </motion.div>

        {/* SECTION 3: PLACE NEW ORDER • SELECT SERVICE (Exactly 7 Active Service Cards, NO Streaming) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-3xl bg-[#0D1527] border border-amber-500/20 p-5 sm:p-7 shadow-xl"
        >
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-100 tracking-wide">
                Place New Order • Select Service
              </h2>
            </div>
            <span className="text-xs text-amber-400 font-semibold">100% Automated</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5 sm:gap-4">
            
            {/* 1. MTN Data */}
            <div 
              onClick={() => handleSelectNetwork('MTN')}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                MTN
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">MTN Data</span>
            </div>

            {/* 2. AirtelTigo (AT) */}
            <div 
              onClick={() => handleSelectNetwork('AirtelTigo')}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                AT
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">AirtelTigo</span>
            </div>

            {/* 3. Telecel */}
            <div 
              onClick={() => handleSelectNetwork('Telecel')}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                TEL
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">Telecel</span>
            </div>

            {/* 4. Checkers */}
            <div 
              onClick={handleGoCheckers}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">Checkers</span>
            </div>

            {/* 5. Booking Codes */}
            <div 
              onClick={handleGoBookingCodes}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">Booking Codes</span>
            </div>

            {/* 6. Game Coins */}
            <div 
              onClick={handleGoGameCoins}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">Game Coins</span>
            </div>

            {/* 7. PC Games */}
            <div 
              onClick={handleGoPcGames}
              className="group cursor-pointer rounded-2xl bg-[#080E1E] hover:bg-[#121E38] border border-slate-800 hover:border-amber-400/50 p-4 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:-translate-y-1 col-span-2 sm:col-span-1"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">PC Games</span>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
