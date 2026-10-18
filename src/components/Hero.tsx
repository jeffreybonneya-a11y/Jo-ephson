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
  Wifi,
  GraduationCap
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

  const handleGoToResultsChecker = () => {
    window.dispatchEvent(new CustomEvent('NAVIGATE_TO_RESULT_CHECKER'));
    scrollToPricing();
  };

  return (
    <section 
      id="homepage-hero-section"
      className="relative pt-4 sm:pt-6 pb-12 md:pb-16 overflow-hidden bg-[#060B18] text-slate-100"
    >
      {/* Background Lighting & Atmospheric Executive Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle Brand Watermark */}
        <div 
          aria-hidden="true"
          className="absolute top-6 left-1/2 -translate-x-1/2 font-serif text-[120px] sm:text-[180px] lg:text-[240px] font-black text-white/[0.015] tracking-widest select-none pointer-events-none uppercase leading-none"
        >
          KING
        </div>

        {/* Ambient Radial Lighting */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-amber-500/[0.06] blur-[120px] rounded-full" />
        <div className="absolute top-1/4 -left-28 w-[400px] h-[400px] bg-blue-900/[0.12] blur-[120px] rounded-full" />
        <div className="absolute bottom-8 -right-20 w-[400px] h-[400px] bg-amber-600/[0.05] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* VIP Gateway Status Bar */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0C152B] border border-amber-500/25 shadow-sm backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
              VIP GATEWAY ACTIVE • 100% INSTANT DISPATCH
            </span>
          </motion.div>
        </div>

        {/* Main Editorial Headline & Value Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-8 sm:mb-12"
        >
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] text-slate-100">
            Enjoy Premium Data &amp; <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
              Digital Deals Like Royalty
            </span>
          </h1>

          <p className="font-serif italic text-base sm:text-xl text-amber-400/90 font-medium tracking-wide">
            "Spend small, Enjoy like a King"
          </p>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Instant automated telecom data for <strong className="text-white font-semibold">MTN, Telecel, and AirtelTigo</strong>, official WAEC results checker pins, airtime top-ups, and verified gaming packages in Ghana.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Button 
              id="hero-explore-deals-primary-btn"
              size="lg" 
              className="h-12 sm:h-13 px-8 text-sm sm:text-base font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all gap-2.5 border border-amber-300/60 cursor-pointer" 
              onClick={scrollToPricing}
            >
              <span>Explore Deals</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Button>

            <Button
              id="hero-download-app-btn"
              variant="outline"
              size="lg"
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_APP_DOWNLOAD_MODAL'))}
              className="h-12 sm:h-13 px-6 text-sm sm:text-base font-bold rounded-xl bg-[#0B1426] hover:bg-[#121E38] text-amber-300 hover:text-amber-200 border border-amber-500/30 shadow-sm hover:scale-[1.02] active:scale-95 transition-all gap-2.5 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Download App</span>
            </Button>
          </div>
        </motion.div>

        {/* Featured Services & Live Deals Showcase (Executive Grid) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mb-10 sm:mb-14"
        >
          <div className="relative mx-auto max-w-5xl rounded-2xl bg-gradient-to-b from-[#0C152B]/95 to-[#080E1E] border border-amber-500/20 p-4 sm:p-6 lg:p-7 shadow-xl backdrop-blur-xl">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Featured Instant Services
                </span>
              </div>
              <button
                type="button"
                id="hero-explore-services-center-btn"
                onClick={scrollToPricing}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View All Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              
              {/* Card 1: MTN Ghana Flash Deal */}
              <div 
                onClick={() => handleSelectNetwork('MTN')}
                className="group relative cursor-pointer rounded-xl bg-[#0F1B36]/90 hover:bg-[#142345] border border-amber-500/25 hover:border-amber-400/50 p-4 transition-all duration-300 shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                    MTN GH
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-300" /> Flash Deal
                  </span>
                </div>
                <div className="font-serif text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                  10 GB
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Non-Expiry Bundle</p>
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-amber-200">GH₵ 43.00</span>
                  <span className="text-[11px] font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Claim Deal <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Card 2: WAEC Results Checker */}
              <div 
                onClick={handleGoToResultsChecker}
                className="group relative cursor-pointer rounded-xl bg-[#0F1B36]/90 hover:bg-[#142345] border border-slate-700/60 hover:border-amber-400/50 p-4 transition-all duration-300 shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
                    WAEC GH
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    Instant SMS
                  </span>
                </div>
                <div className="font-serif text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  Results Checker
                </div>
                <p className="text-[11px] text-slate-300 font-medium">WASSCE &amp; BECE Official PIN</p>
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">SMS Delivery</span>
                  <span className="text-[11px] font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Buy PIN <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Card 3: Telecel & AirtelTigo Bundles */}
              <div 
                onClick={() => handleSelectNetwork('Telecel')}
                className="group relative cursor-pointer rounded-xl bg-[#0F1B36]/90 hover:bg-[#142345] border border-slate-700/60 hover:border-amber-400/50 p-4 transition-all duration-300 shadow-sm hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                    Telecel &amp; AT
                  </span>
                  <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> All Sizes
                  </span>
                </div>
                <div className="font-serif text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  Multi-Network
                </div>
                <p className="text-[11px] text-slate-300 font-medium">1 GB to 100 GB Non-Expiry</p>
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">Automated Dispatch</span>
                  <span className="text-[11px] font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Browse <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Guarantees Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>5–15 Mins Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paystack &amp; MoMo Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Non-Expiry Guarantee</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Feature Row / Royal Trust Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-slate-800/80"
        >
          {[
            { 
              icon: Zap, 
              label: "Instant Delivery", 
              desc: "5-15 mins automated routing", 
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20" 
            },
            { 
              icon: CreditCard, 
              label: "Paystack Secured", 
              desc: "MoMo & Card bank protection", 
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
            },
            { 
              icon: Clock, 
              label: "Non-Expiry Data", 
              desc: "Data balance never expires", 
              color: "text-amber-300 bg-amber-500/10 border-amber-500/20" 
            },
            { 
              icon: Crown, 
              label: "Royal Support", 
              desc: "24/7 VIP assistance", 
              color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" 
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group flex flex-col sm:flex-row items-center sm:items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-[#0B1328]/80 border border-slate-800/80 hover:border-amber-500/30 hover:bg-[#0E1A33] transition-all text-center sm:text-left shadow-sm"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border ${feature.color} shrink-0`}>
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight uppercase tracking-wide">
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
