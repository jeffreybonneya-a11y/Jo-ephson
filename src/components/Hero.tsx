import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, Clock, MessageSquare } from 'lucide-react';

export default function Hero() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 overflow-hidden bg-slate-950 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4 fill-primary" />
            <span>Instant Delivery. Non-Expiry Data.</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Affordable Data. <br />
            <span className="text-primary">Instant Delivery.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Join thousands of users in Ghana getting the best deals on MTN, Vodafone, and AirtelTigo data bundles. Simple, fast, and secure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-full w-full sm:w-auto" onClick={scrollToPricing}>
              Buy Data Now
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-full w-full sm:w-auto border-slate-700 hover:bg-slate-900" onClick={() => window.open('https://wa.me/0535884851', '_blank')}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat on WhatsApp
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-300">Instant Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-300">Secure Payments</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-300">Non-Expiry</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-300">24/7 Support</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
