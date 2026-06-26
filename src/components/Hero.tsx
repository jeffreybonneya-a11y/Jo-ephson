import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Zap, Clock, Crown, Home, CreditCard, Sparkles } from 'lucide-react';

export default function Hero() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-12 md:py-16 overflow-hidden bg-secondary text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/30 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/20 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 leading-none uppercase italic">
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">KING </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-primary to-amber-500 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] font-black">
              J
            </span>
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"> DEALS</span>
            <span className="text-base sm:text-lg md:text-2xl font-black text-primary block mt-4 tracking-widest uppercase not-italic">
              👑 PREMIUM • INSTANT • ROYAL 👑
            </span>
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
            Experience Ghana's <span className="text-primary font-bold">Fastest Data Portal</span>. Powered by Paystack for a seamless, secure experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="h-12 px-8 text-sm font-black rounded-full w-full sm:w-auto bg-primary hover:bg-primary/90 text-secondary shadow-[0_4px_15px_rgba(255,215,0,0.3)] hover:scale-105 transition-all gap-2" 
              onClick={scrollToPricing}
            >
              <Zap className="w-5 h-5" />
              BUY DATA NOW 👑
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-sm font-bold rounded-full w-full sm:w-auto border-primary/50 text-slate-300 hover:bg-primary/10 hover:text-primary transition-all" 
              onClick={scrollToPricing}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              VIEW ROYAL OFFERS
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
        >
          {[
            { icon: Zap, label: "Fast Delivery", desc: "Reliable order processing" },
            { icon: CreditCard, label: "Secure Pay", desc: "Paystack protected" },
            { icon: Clock, label: "Non-Expiry", desc: "Royal data lasts forever" },
            { icon: Crown, label: "VIP Service", desc: "The King's treatment" }
          ].map((feature, i) => (
            <div key={i} className="group flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{feature.label}</h3>
                <p className="text-[11px] text-slate-400 leading-tight">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
