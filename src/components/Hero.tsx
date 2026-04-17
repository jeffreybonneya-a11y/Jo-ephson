import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, Clock, MessageSquare, Crown, Sparkles, Home, CreditCard } from 'lucide-react';

export default function Hero() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-secondary text-white">
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-bold mb-8 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
            <Crown className="w-4 h-4 fill-primary" />
            <span className="uppercase tracking-widest">The King of Data Deals 👑</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
            KING <span className="text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">J</span> DEALS <br />
            <span className="text-2xl md:text-4xl font-medium text-slate-300 block mt-4 italic">
              👑 Spend small, enjoy like a King 👑
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Experience the <span className="text-primary font-bold">Royal Treatment</span> with Ghana's fastest and most affordable data bundles. Instant delivery, zero stress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              size="lg" 
              className="h-16 px-10 text-xl font-black rounded-full w-full sm:w-auto bg-primary hover:bg-primary/90 text-secondary shadow-[0_10px_30px_rgba(255,215,0,0.3)] hover:scale-105 transition-all gap-2" 
              onClick={scrollToPricing}
            >
              <Home className="w-6 h-6" />
              HOME / BUY DATA 👑
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 px-10 text-xl font-bold rounded-full w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)]" 
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Zap className="w-6 h-6 mr-2" />
              VIEW OFFERS 👑
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24"
        >
          {[
            { icon: Zap, label: "Fast Delivery", desc: "5-15 Mins Stable Network" },
            { icon: CreditCard, label: "Direct Purchase", desc: "No Top-up Required" },
            { icon: Clock, label: "Non-Expiry", desc: "Data stays forever" },
            { icon: Crown, label: "Royal Support", desc: "24/7 VIP Care" }
          ].map((feature, i) => (
            <div key={i} className="group flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                <feature.icon className="w-7 h-7" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">{feature.label}</h3>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
