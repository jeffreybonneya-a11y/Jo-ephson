import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Zap, Clock, Crown, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero() {
  const scrollToPricing = () => {
    document.getElementById('bundle-tabs')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden bg-[#0B132B] text-slate-100">
      {/* Background decoration with warm gold glows & micro dot matrix */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] left-1/3 w-[600px] h-[350px] bg-amber-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-blue-900/15 blur-[130px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Content Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 text-left space-y-6"
          >
            {/* Elegant Sub-Header Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111C38] border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest shadow-[0_2px_15px_rgba(245,158,11,0.12)]">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>GHANA'S PREMIER DATA & DIGITAL HUB</span>
            </div>

            {/* Bold Confident Two-Line Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-100">
              High-Speed Digital Deals. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]">
                Instant, Reliable & Unmatched.
              </span>
            </h1>

            {/* Short Supporting Description */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Instant non-expiry data bundles, WAEC result checkers, game coins, and premium app access — backed by Paystack security and 24/7 royal support.
            </p>

            {/* Single Clear Primary CTA Button */}
            <div className="pt-2">
              <Button 
                size="lg" 
                className="h-13 px-8 text-sm sm:text-base font-black rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_4px_25px_rgba(245,158,11,0.35)] hover:brightness-110 hover:scale-[1.02] transition-all gap-2.5 border border-amber-300/50 cursor-pointer" 
                onClick={scrollToPricing}
              >
                <span>Explore Deals</span>
                <ArrowRight className="w-5 h-5 fill-slate-950" />
              </Button>
            </div>
          </motion.div>

          {/* Right Column: Royal Gold Seal Motif with Ambient Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative group w-full max-w-md">
              {/* Outer Ambient Glow Frame */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-600/20 blur-xl opacity-80 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative bg-[#111C38] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col items-center text-center space-y-6">
                {/* Micro background grid pattern inside card */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(245,158,11,0.08)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />

                {/* Subtle Gold Crown Royal Seal Badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-amber-400/20 via-amber-500/10 to-transparent p-1 border border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <div className="w-full h-full rounded-full bg-[#0B132B] border border-amber-500/30 flex flex-col items-center justify-center p-2 text-amber-400 relative">
                      <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]" />
                      <span className="text-[9px] font-black tracking-widest text-amber-300 uppercase mt-1">OFFICIAL</span>
                    </div>
                  </div>
                </div>

                {/* Brand Seal Title & Status */}
                <div className="relative z-10 space-y-1.5">
                  <h3 className="font-serif text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                    KING 👑 J DEALS
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold tracking-wide uppercase">
                    Royal Digital Dealership
                  </p>
                </div>

                {/* Quality / Trust Indicators */}
                <div className="relative z-10 w-full pt-2 border-t border-amber-500/20 grid grid-cols-2 gap-3 text-left">
                  <div className="flex items-center gap-2.5 bg-[#0B132B]/80 p-2.5 rounded-xl border border-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                    <div>
                      <p className="text-[11px] font-black text-slate-100 leading-tight">Instant Dispatch</p>
                      <p className="text-[9px] text-amber-300/80">Automated Delivery</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-[#0B132B]/80 p-2.5 rounded-xl border border-amber-500/20">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-slate-100 leading-tight">Paystack Secured</p>
                      <p className="text-[9px] text-amber-300/80">100% Guaranteed</p>
                    </div>
                  </div>
                </div>

                {/* Live Active Badge */}
                <div className="relative z-10 w-full bg-[#0B132B]/90 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-200">System Status</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                    👑 ONLINE & DISPATCHING
                  </span>
                </div>

              </div>
            </div>
          </motion.div>

        </div>

        {/* Feature Row with Generous Whitespace */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-amber-500/15"
        >
          {[
            { icon: Zap, label: "Instant Delivery", desc: "Automated instant routing" },
            { icon: CreditCard, label: "Paystack Secured", desc: "100% protected payments" },
            { icon: Clock, label: "Non-Expiry Data", desc: "Your data stays active" },
            { icon: Crown, label: "Royal Support", desc: "24/7 dedicated service" }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group flex flex-col sm:flex-row items-center sm:items-start gap-3 p-3.5 rounded-2xl bg-[#111C38]/70 border border-amber-500/20 hover:border-amber-500/50 hover:bg-[#111C38] transition-all text-center sm:text-left shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <feature.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-100 leading-tight uppercase tracking-wide">{feature.label}</h3>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

