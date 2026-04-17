import { motion } from 'motion/react';
import { Wallet, Smartphone, CheckCircle2, Zap, Crown, CreditCard } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Smartphone,
      title: "CHOOSE BUNDLE",
      desc: "Select your preferred data bundle from MTN, Telecel, or AirtelTigo at the best prices.",
      color: "bg-primary"
    },
    {
      icon: CreditCard,
      title: "FAST PAYMENT",
      desc: "You can buy data directly without topping up your wallet! Use Paystack for MoMo or Card payments.",
      color: "bg-blue-500"
    },
    {
      icon: Zap,
      title: "PROCESSING",
      desc: "Our royal systems initiate fulfillment immediately once your payment is confirmed.",
      color: "bg-amber-500"
    },
    {
      icon: CheckCircle2,
      title: "ENJOY DATA",
      desc: "Data delivery is under 5-15mins under stable network. Spend small, enjoy like a King! 👑",
      color: "bg-green-500"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-tighter mb-4"
          >
            <Crown className="w-4 h-4" />
            Simple & Fast 👑
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">HOW IT <span className="text-primary">WORKS</span> 👑</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Direct purchases available—no wallet top-up required for instant data delivery!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200 z-0" />
              )}
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-primary/30 transition-all shadow-sm hover:shadow-xl relative z-10 h-full flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-4 tracking-tight">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg border-4 border-white">
                  {i + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-secondary shrink-0 shadow-xl">
              <CreditCard className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black mb-2">WHY USE THE ROYAL WALLET? 👑</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Topping up your wallet makes future purchases **instant**. You don't need to enter your card or MoMo details every time. Just one click and your data is on its way! Plus, wallet users get exclusive priority delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
