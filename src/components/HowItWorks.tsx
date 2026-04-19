import { motion } from 'motion/react';
import { Smartphone, Zap, Crown, ShieldCheck, ArrowRight, Award, HeadphonesIcon, Timer } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Smartphone,
      title: "PICK YOUR DEAL",
      desc: "Browse our premium selection of MTN, Telecel, and AirtelTigo bundles. We curate the best prices in the realm.",
      color: "from-amber-400 to-primary",
      shadow: "shadow-primary/20"
    },
    {
      icon: ShieldCheck,
      title: "ENTER DETAILS",
      desc: "Provide your recipient number accurately. Our royal logic ensures your data reaches the right hands.",
      color: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20"
    },
    {
      icon: Zap,
      title: "PAY & UNLOCK",
      desc: "Complete your purchase via Paystack. Your transaction is protected by the highest royal security standards.",
      color: "from-primary to-orange-500",
      shadow: "shadow-orange-500/20"
    },
    {
      icon: Crown,
      title: "FAST DELIVERY",
      desc: "Our automated systems prioritize your order instantly. Watch your data arrive in minutes like magic.",
      color: "from-secondary to-slate-800",
      shadow: "shadow-secondary/20"
    }
  ];

  const features = [
    {
      icon: Timer,
      title: "24/7 ROYAL SERVICE",
      desc: "Fulfillment never sleeps. Our systems run day and night to keep you connected."
    },
    {
      icon: Award,
      title: "PREMIUM RELIABILITY",
      desc: "Zero-failure architecture ensures every pesewa you spend delivers full value."
    },
    {
      icon: HeadphonesIcon,
      title: "DIRECT SUPPORT",
      desc: "The King's messengers are always on standby to assist with any order queries."
    }
  ];

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-600/5 blur-[120px] rounded-full -ml-20 -mb-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-6 shadow-2xl"
          >
            <ShieldCheck className="w-4 h-4" />
            The King's Experience 👑
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-slate-900 uppercase italic">
            HOW THE <span className="text-primary not-italic">SITE</span> WORKS 👑
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
            Experience the pinnacle of data fulfillment. Each step is optimized for the speed and security you deserve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[2.75rem] left-[10%] right-[10%] h-[2px] bg-slate-100/50 z-0 overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              whileInView={{ x: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" 
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center group"
            >
              <div className="absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black text-slate-50 opacity-[0.03] select-none group-hover:opacity-[0.05] transition-opacity">
                0{i + 1}
              </div>

              <div className={`relative w-24 h-24 rounded-[2rem] bg-gradient-to-br ${step.color} ${step.shadow} flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform z-10 p-[1px]`}>
                 <div className="w-full h-full bg-white rounded-[1.95rem] flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-slate-900" />
                 </div>
              </div>

              <div className="text-center px-4 relative z-10">
                <h3 className="text-xl font-black mb-4 tracking-tight text-slate-900 flex items-center justify-center gap-2">
                   {step.title}
                   {i < steps.length - 1 && <ArrowRight className="hidden lg:block w-4 h-4 text-slate-300 ml-1" />}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-bold tracking-tight lowercase italic opacity-80 group-hover:opacity-100 transition-opacity">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-2xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-6">
                <feature.icon className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black mb-3 text-slate-900 uppercase tracking-tight italic">{feature.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing Royal Statement */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 max-w-5xl mx-auto"
        >
          <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden group">
            <div className="bg-[#1a1c23] px-8 py-10 md:p-14 rounded-[2.9rem] flex flex-col md:flex-row items-center gap-10 md:gap-14 border border-white/5 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-primary rounded-[2.5rem] flex items-center justify-center text-secondary shadow-[0_0_50px_rgba(255,215,0,0.3)] rotate-3 group-hover:rotate-0 transition-transform">
                  <Crown className="w-12 h-12 md:w-16 md:h-16 fill-secondary" />
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="inline-block px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase mb-4 tracking-widest">
                   The Royal Standard
                </div>
                <h4 className="text-3xl md:text-4xl font-black mb-4 text-white uppercase italic tracking-tight">PREMIUM DATA <span className="text-primary not-italic">FOR EVERY</span> CITIZEN 👑</h4>
                <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                  We don't just sell data; we deliver the highest level of stability and trust. Whether you are a small user or a heavy streamer, our platform ensures your connection is never interrupted. Spend small, enjoy like a king!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
