import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Crown, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Wifi,
  GraduationCap
} from 'lucide-react';

const KING_HERO_IMAGE = "https://lh3.googleusercontent.com/aida/AEtjO1UZaR-KffK9wxMHOp4y7YU3qDFkk1fz1-szmiuV7dkCVNe2S_SuPkqwBPjfJJhxiBKHkcD0UsCdiRpwr8RLPdlzGOHIuT8SVFUawQmX58Pw2qUg_-rncWw_LYnjEgAHJKBKABT3q_4Czlf6T5ycj6tzmLxA2e1ukxPpEFuFOdrz9V8iQHxRk51pD7kEqb4Cv7c7ygTjRokUWd63NX-Rp4HYqmtngNnV8fMvMaFaUPf5faSQ-Y2P2wqC31Tw";

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

  const handleGoToResultsChecker = () => {
    window.dispatchEvent(new CustomEvent('NAVIGATE_TO_RESULT_CHECKER'));
    scrollToPricing();
  };

  return (
    <section 
      id="homepage-hero-section"
      className="relative pt-2 sm:pt-4 pb-12 md:pb-20 overflow-hidden bg-[#06040A] text-slate-100 selection:bg-purple-500/30 selection:text-white"
    >
      {/* Background Lighting & Atmospheric Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Giant Watermark Text */}
        <div 
          aria-hidden="true"
          className="absolute top-8 left-1/2 -translate-x-1/2 font-serif text-[130px] sm:text-[220px] lg:text-[300px] font-black text-white/[0.02] tracking-widest select-none pointer-events-none uppercase leading-none"
        >
          KING
        </div>

        {/* Ambient Radial Colored Lights */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-purple-700/20 via-amber-500/15 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-[450px] h-[450px] bg-purple-900/15 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 -right-24 w-[450px] h-[450px] bg-cyan-600/10 blur-[140px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* VIP Gateway Status Bar */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#120A1E]/90 border border-purple-500/30 shadow-[0_0_20px_rgba(192,132,252,0.15)] backdrop-blur-md"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#26FEDC] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#26FEDC]" />
            </span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-300 via-[#C7FFF0] to-purple-200 bg-clip-text text-transparent">
              VIP GATEWAY ACTIVE • 100% INSTANT DISPATCH
            </span>
            <span className="hidden sm:inline text-amber-400 font-serif text-xs">👑</span>
          </motion.div>
        </div>

        {/* Central 3D Visual & Interactive Hero Banner */}
        <div className="relative mb-10 sm:mb-14">
          <div className="relative mx-auto max-w-5xl rounded-3xl bg-gradient-to-b from-[#130B21]/90 via-[#0E071A]/95 to-[#06040A] border border-purple-500/25 p-4 sm:p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
            
            {/* Interior Ambient Glow */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
              
              {/* Left Floating Card on Desktop (MTN Flash Deal) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="hidden lg:flex lg:col-span-3 flex-col gap-3"
              >
                <div 
                  onClick={() => handleSelectNetwork('MTN')}
                  className="group relative cursor-pointer rounded-2xl bg-[#180D2A]/90 hover:bg-[#201138] border border-amber-500/30 hover:border-amber-400/60 p-4 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)] hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                      MTN GH
                    </span>
                    <span className="text-[10px] font-bold text-[#26FEDC] flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-[#26FEDC]" /> Flash Deal
                    </span>
                  </div>
                  <div className="font-serif text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                    10 GB
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">Non-Expiry Bundle</p>
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#C7FFF0]">GH₵ 43.00</span>
                    <span className="text-[11px] font-black text-amber-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Claim <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#120A1E]/80 border border-purple-500/20 p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-200">5-15 Mins Delivery</div>
                    <div className="text-[10px] text-slate-400">Automated Dispatch</div>
                  </div>
                </div>
              </motion.div>

              {/* Center: 3D Animated King Character & Core CTA */}
              <div className="lg:col-span-6 flex flex-col items-center text-center">
                
                {/* 3D King Character Showcase with Glowing Aura */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="relative group w-full max-w-[320px] sm:max-w-[380px] mb-4"
                >
                  {/* Radial Halo Behind King */}
                  <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-tr from-purple-600/30 via-amber-400/25 to-cyan-400/20 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Image Frame */}
                  <div className="relative rounded-3xl overflow-hidden border border-purple-400/30 bg-[#160B28]/60 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                    <img 
                      src={KING_HERO_IMAGE} 
                      alt="King J Deals 3D Mascot"
                      className="w-full h-auto max-h-[300px] sm:max-h-[360px] object-contain mx-auto filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.02] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Subtle Bottom Gradient Shade */}
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0E071A] to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* Central Floating Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full flex justify-center -mt-6 sm:-mt-8 relative z-20"
                >
                  <button
                    type="button"
                    id="hero-explore-services-center-btn"
                    onClick={scrollToPricing}
                    className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-9 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#F0DBFF] via-white to-[#E2D9F3] text-[#1E0933] font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_6px_30px_rgba(192,132,252,0.4)] hover:shadow-[0_8px_40px_rgba(192,132,252,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/60 cursor-pointer"
                  >
                    <span>EXPLORE SERVICES</span>
                    <ArrowRight className="w-4 h-4 stroke-[3px]" />
                  </button>
                </motion.div>

                {/* Mobile-Only Quick Deals Bar (Shown below King on mobile instead of side cards) */}
                <div className="lg:hidden w-full grid grid-cols-2 gap-2.5 mt-6 pt-2">
                  <div 
                    onClick={() => handleSelectNetwork('MTN')}
                    className="p-3 rounded-2xl bg-[#180D2A]/90 border border-amber-500/30 text-left cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">MTN</span>
                      <span className="font-mono text-xs font-bold text-[#C7FFF0]">GH₵ 43</span>
                    </div>
                    <div className="font-serif text-lg font-black text-white mt-1">10 GB Flash</div>
                    <div className="text-[10px] text-amber-300 font-bold mt-0.5 flex items-center gap-0.5">
                      Claim Deal <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div 
                    onClick={handleGoToResultsChecker}
                    className="p-3 rounded-2xl bg-[#180D2A]/90 border border-purple-500/30 text-left cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded">WAEC</span>
                      <span className="font-mono text-xs font-bold text-[#C7FFF0]">Instant PIN</span>
                    </div>
                    <div className="font-serif text-lg font-black text-white mt-1">Results Checker</div>
                    <div className="text-[10px] text-purple-300 font-bold mt-0.5 flex items-center gap-0.5">
                      Buy PIN <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Floating Card on Desktop (WAEC Checker Voucher) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="hidden lg:flex lg:col-span-3 flex-col gap-3"
              >
                <div 
                  onClick={handleGoToResultsChecker}
                  className="group relative cursor-pointer rounded-2xl bg-[#180D2A]/90 hover:bg-[#201138] border border-purple-500/30 hover:border-purple-400/60 p-4 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(168,85,247,0.2)] hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                      WAEC GH
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Official
                    </span>
                  </div>
                  <div className="font-serif text-xl font-black text-white group-hover:text-purple-300 transition-colors">
                    Results Checker
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">WASSCE &amp; BECE PIN</p>
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#C7FFF0]">Instant SMS</span>
                    <span className="text-[11px] font-black text-purple-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Buy PIN <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#120A1E]/80 border border-amber-500/20 p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-200">Paystack Secured</div>
                    <div className="text-[10px] text-slate-400">Bank-Grade Protection</div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Editorial Headline & Value Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          {/* Main Editorial Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-slate-100">
            Enjoy Premium Data &amp; <br />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(245,158,11,0.3)]">
              Digital Deals Like Royalty
            </span>{" "}
            👑
          </h1>

          {/* Official Motto with Radiant Glow */}
          <p className="font-serif italic text-base sm:text-xl text-amber-300 font-semibold tracking-wide drop-shadow-sm">
            "Spend small, Enjoy like a King 👑"
          </p>

          {/* Subtitle / Value Proposition */}
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Instant automated telecom data for <strong className="text-white">MTN, Telecel, and AirtelTigo</strong>, official WAEC results checker pins, airtime top-ups, and verified gaming packages in Ghana.
          </p>

          {/* Dual Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Button 
              id="hero-explore-deals-primary-btn"
              size="lg" 
              className="h-12 sm:h-13 px-8 text-sm sm:text-base font-black rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_4px_25px_rgba(245,158,11,0.35)] hover:brightness-110 hover:scale-[1.02] transition-all gap-2.5 border border-amber-300/60 cursor-pointer" 
              onClick={scrollToPricing}
            >
              <span>Explore Deals 👑</span>
              <ArrowRight className="w-5 h-5 fill-slate-950" />
            </Button>

            <Button
              id="hero-download-app-btn"
              variant="outline"
              size="lg"
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_APP_DOWNLOAD_MODAL'))}
              className="h-12 sm:h-13 px-6 text-sm sm:text-base font-black rounded-xl bg-[#120A1E] hover:bg-[#1C1030] text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-lg hover:scale-[1.02] transition-all gap-2.5 cursor-pointer"
            >
              <Smartphone className="w-5 h-5 text-amber-400" />
              <span>Download App 📱</span>
            </Button>
          </div>
        </motion.div>

        {/* Feature Row / Royal Trust Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16 pt-8 border-t border-purple-500/20"
        >
          {[
            { 
              icon: Zap, 
              label: "Instant Delivery", 
              desc: "5-15 mins automated routing", 
              color: "text-amber-400 bg-amber-500/10 border-amber-500/30" 
            },
            { 
              icon: CreditCard, 
              label: "Paystack Secured", 
              desc: "MoMo & Card bank protection", 
              color: "text-[#26FEDC] bg-cyan-500/10 border-cyan-500/30" 
            },
            { 
              icon: Clock, 
              label: "Non-Expiry Data", 
              desc: "Data balance never expires", 
              color: "text-purple-400 bg-purple-500/10 border-purple-500/30" 
            },
            { 
              icon: Crown, 
              label: "Royal Support", 
              desc: "24/7 VIP assistance", 
              color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" 
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group flex flex-col sm:flex-row items-center sm:items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#120A1E]/80 border border-purple-500/20 hover:border-purple-400/40 hover:bg-[#180E28] transition-all text-center sm:text-left shadow-sm"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border ${feature.color} group-hover:scale-105 transition-transform shrink-0`}>
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-100 leading-tight uppercase tracking-wide">
                  {feature.label}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}


