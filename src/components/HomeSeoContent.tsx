import React, { useState } from 'react';
import { SEO_PAGES } from '../data/seoPages';
import { 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import NetworkPriceTable from './NetworkPriceTable';

interface HomeSeoContentProps {
  onSelectNetwork?: (network: string) => void;
}

export default function HomeSeoContent({ onSelectNetwork }: HomeSeoContentProps) {
  const data = SEO_PAGES['home'];
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!data) return null;

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <section className="bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950/80 border-t border-purple-500/10 py-16 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Editorial Brand Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{data.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
            {data.overviewHeading}
          </h2>
          <div className="space-y-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            {data.overviewParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {data.featuresHeading}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.features.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-[#0D0914] border border-purple-500/20 hover:border-amber-500/40 rounded-2xl p-5 transition-all shadow-sm space-y-2.5"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-black text-white text-sm sm:text-base tracking-tight">
                  {feat.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Network Data Bundle Price Comparison Tables */}
        <NetworkPriceTable
          network="ALL"
          onSelectNetworkAndOrder={(net) => onSelectNetwork?.(net)}
        />

        {/* How It Works Steps */}
        <div className="space-y-6 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {data.howItWorksHeading}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Instant mobile delivery straight to any SIM card in Ghana in 4 easy steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {data.howItWorksSteps.map((step) => (
              <div 
                key={step.step}
                className="bg-[#07050B] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden"
              >
                <div className="text-3xl font-black text-amber-400/25 absolute top-3 right-4 select-none">
                  0{step.step}
                </div>
                <div className="space-y-2 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Step {step.step}
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices Guidelines */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase tracking-wide">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{data.guidelinesHeading}</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            {data.guidelines.map((guide, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[#0A0711] p-3 rounded-xl border border-amber-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{guide}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>
          <div className="space-y-3">
            {data.faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-[#0D0914] border border-purple-500/20 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-amber-300 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 border-t border-purple-500/10 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Related Category Links for SEO Crawlers & Shoppers */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">
            Explore Dedicated Ghana Data Guides & Checkers
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.relatedLinks.map((link, idx) => (
              <a 
                key={idx}
                href={link.href}
                className="bg-[#0D0914] border border-purple-500/15 hover:border-amber-500/40 p-3.5 rounded-xl text-center group transition-all"
              >
                <p className="font-black text-xs text-white group-hover:text-amber-300 transition-colors">
                  {link.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 truncate">
                  {link.description}
                </p>
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
