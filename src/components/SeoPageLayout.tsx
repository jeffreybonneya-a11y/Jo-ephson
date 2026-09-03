import React, { useState } from 'react';
import { SeoPageData } from '@/src/data/seoPages';
import {
  Crown,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Info
} from 'lucide-react';
import Footer from './Footer';

interface SeoPageLayoutProps {
  data: SeoPageData;
  onNavigateToStore: (targetCategory?: string, targetTab?: string) => void;
  user?: any;
}

export default function SeoPageLayout({ data, onNavigateToStore, user }: SeoPageLayoutProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleCtaClick = () => {
    onNavigateToStore(data.targetCategory, data.targetTab);
  };

  // Structured Data Schema for the specific page
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://kingjdeals.site/"
      },
      ...(data.categoryPath !== data.path ? [
        {
          "@type": "ListItem",
          "position": 2,
          "name": data.category,
          "item": `https://kingjdeals.site${data.categoryPath}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": data.h1,
          "item": data.canonicalUrl
        }
      ] : [
        {
          "@type": "ListItem",
          "position": 2,
          "name": data.h1,
          "item": data.canonicalUrl
        }
      ])
    ]
  };

  const faqSchema = data.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": data.h1,
    "description": data.metaDescription,
    "provider": {
      "@type": "Organization",
      "name": "King J Deals",
      "url": "https://kingjdeals.site/",
      "logo": "https://kingjdeals.site/icon-512.png"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Ghana"
    },
    "url": data.canonicalUrl
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Schema.org JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#070D1E]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToStore();
            }}
            className="flex items-center gap-2 text-lg sm:text-xl font-black text-white hover:text-amber-400 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <span>KING J DEALS</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="/data-bundles" className="hover:text-amber-400 transition-colors">Data Bundles</a>
            <a href="/results-checker" className="hover:text-amber-400 transition-colors">Results Checker</a>
            <a href="/booking-codes" className="hover:text-amber-400 transition-colors">Booking Codes</a>
            <a href="/game-coins" className="hover:text-amber-400 transition-colors">Game Coins</a>
            <a href="/pc-games" className="hover:text-amber-400 transition-colors">PC Games</a>
          </nav>

          <button
            type="button"
            onClick={handleCtaClick}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open Store</span>
          </button>
        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div className="bg-[#0A1226] border-b border-slate-800/60 py-2.5">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToStore();
              }}
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Home
            </a>
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            {data.categoryPath !== data.path ? (
              <>
                <a href={data.categoryPath} className="hover:text-amber-400 transition-colors">
                  {data.category}
                </a>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="text-amber-400 font-semibold" aria-current="page">
                  {data.h1}
                </span>
              </>
            ) : (
              <span className="text-amber-400 font-semibold" aria-current="page">
                {data.h1}
              </span>
            )}
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-6 shadow-sm">
            <Crown className="w-3.5 h-3.5" />
            <span>{data.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            {data.h1}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            {data.leadText}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <span>Order on King J Deals</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>How It Works</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="container mx-auto max-w-4xl px-4 py-12 space-y-16">
        {/* Service Overview */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-2 h-7 rounded-full bg-amber-400" />
            <span>{data.overviewHeading}</span>
          </h2>
          <div className="prose prose-invert max-w-none text-slate-300 space-y-4 text-base leading-relaxed">
            {data.overviewParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-2 h-7 rounded-full bg-amber-400" />
            <span>{data.featuresHeading}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.features.map((feature, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0F172A]/80 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-2"
              >
                <div className="flex items-center gap-2.5 text-amber-400 font-black text-base">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{feature.title}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed pl-7">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works (Numbered Workflow) */}
        <section id="how-it-works" className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-2 h-7 rounded-full bg-amber-400" />
            <span>{data.howItWorksHeading}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.howItWorksSteps.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#0A1226] border border-slate-800 relative space-y-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black flex items-center justify-center text-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-black text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Ordering Guidelines / Safety Box */}
        <section className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-300 font-black text-base">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{data.guidelinesHeading}</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-300 pl-7 list-disc">
            {data.guidelines.map((guide, idx) => (
              <li key={idx} className="leading-relaxed">
                {guide}
              </li>
            ))}
          </ul>
        </section>

        {/* Frequently Asked Questions */}
        {data.faqs.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="w-2 h-7 rounded-full bg-amber-400" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {data.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-black text-base text-white hover:text-amber-400 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        openFaqIndex === idx ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pl-13">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Services & Internal Links */}
        {data.relatedLinks.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="w-2 h-7 rounded-full bg-amber-400" />
              <span>Related Services & Guides</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.relatedLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-amber-400/50 transition-all group block space-y-1.5"
                >
                  <div className="flex items-center justify-between text-white group-hover:text-amber-400 font-black text-base">
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {link.description}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Sticky-like Bottom Call to Action Card */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A1226] border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to Order on King J Deals?
            </h3>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Order your packages securely with fast digital delivery and Ghanaian Mobile Money payment.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Go to Storefront & Order Now</span>
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToStore();
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </a>
          </div>
        </section>

        {/* Independent Vendor Legal Disclaimer */}
        <section className="text-center pt-4 border-t border-slate-900">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
            <strong className="text-slate-400">Notice:</strong> King J Deals is an independent online digital service provider in Ghana. All third-party trademarks, service marks, and logos (including MTN, Telecel, AirtelTigo, WAEC, EA Sports, PUBG, and respective betting bookmakers) remain the property of their respective owners and are referenced solely for descriptive identification of digital services.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
