import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EFootballProduct } from '../types';
import {
  INITIAL_EFOOTBALL_PRODUCTS,
  DEFAULT_EFOOTBALL_COIN_IMAGE,
  DEFAULT_EFOOTBALL_COVER_IMAGE,
  seedEFootballProducts,
} from '../lib/efootballData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Monitor,
  Zap,
  ShieldCheck,
  Clock,
  Lock,
  Sparkles,
  HelpCircle,
  Flame,
  CheckCircle2,
  Apple
} from 'lucide-react';
import EFootballOrderModal from './EFootballOrderModal';
import KonamiIdGuideModal from './KonamiIdGuideModal';

interface EFootballCoinsSectionProps {
  onOpenAuthModal?: () => void;
  profile?: any;
}

export default function EFootballCoinsSection({
  onOpenAuthModal,
  profile,
}: EFootballCoinsSectionProps) {
  // Three separate platforms: 'ios' | 'android' | 'steam'
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'steam'>('android');
  
  const [products, setProducts] = useState<EFootballProduct[]>(() =>
    INITIAL_EFOOTBALL_PRODUCTS.map((p) => ({
      ...p,
      id: `ef_${p.platform}_${p.coinAmount}`,
    }))
  );
  const [coverUrl, setCoverUrl] = useState<string>(DEFAULT_EFOOTBALL_COVER_IMAGE);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EFootballProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 1. Subscribe to Firestore settings for eFootball cover
  useEffect(() => {
    const unsubCover = onSnapshot(
      doc(db, 'settings', 'efootball_cover'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.coverUrl) {
            setCoverUrl(data.coverUrl);
          } else {
            setCoverUrl(DEFAULT_EFOOTBALL_COVER_IMAGE);
          }
        } else {
          setCoverUrl(DEFAULT_EFOOTBALL_COVER_IMAGE);
        }
      },
      (error) => {
        console.warn('[eFootball Cover Listener Notice]:', error.message);
      }
    );

    return () => unsubCover();
  }, []);

  // 2. Subscribe to Firestore efootballProducts in real-time
  useEffect(() => {
    const colRef = collection(db, 'efootballProducts');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: EFootballProduct[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Map legacy platform if found
            const rawPlat = data.platform;
            const platformKey = rawPlat === 'steam' ? 'steam' : rawPlat === 'ios' ? 'ios' : 'android';
            const platformLabel = data.platformLabel || (platformKey === 'ios' ? 'iOS' : platformKey === 'android' ? 'Android' : 'Steam');

            items.push({
              id: docSnap.id,
              name: data.name || '',
              coinAmount: Number(data.coinAmount) || 0,
              platform: platformKey,
              platformLabel: platformLabel,
              price: Number(data.price) || 0,
              currency: data.currency || 'GHS',
              active: data.active !== false,
              displayOrder: Number(data.displayOrder) || 99,
              description: data.description || '',
              imageUrl: data.imageUrl || DEFAULT_EFOOTBALL_COIN_IMAGE,
              badge: data.badge,
            });
          });
          // Sort safely in memory
          items.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
          setProducts(items);
        } else {
          // If Firestore collection is empty, trigger seed in background
          seedEFootballProducts().catch(console.warn);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('[eFootball Firestore Listener Notice]:', error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter products for active platform (strictly iOS, Android, or Steam)
  const filteredProducts = products.filter(
    (p) => p.active !== false && p.platform === selectedPlatform
  );

  const platformTitle =
    selectedPlatform === 'ios'
      ? 'iOS'
      : selectedPlatform === 'android'
      ? 'Android'
      : 'Steam';

  const handleBuyNow = (product: EFootballProduct) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="space-y-7 w-full animate-fade-in">
      {/* ========================================================= */}
      {/* 1. HERO SECTION: Official eFootball Mobile Visual Cover   */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-blue-500/30 shadow-2xl bg-[#040C1D]">
        {/* Background Artwork Banner */}
        <div className="relative w-full min-h-[220px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden flex items-end">
          <img
            src={coverUrl || DEFAULT_EFOOTBALL_COVER_IMAGE}
            alt="eFootball Mobile Cover Artwork"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_EFOOTBALL_COVER_IMAGE;
            }}
          />

          {/* Gradients to merge eFootball Dark Navy aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040C1D] via-[#040C1D]/65 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040C1D]/90 via-[#071738]/50 to-transparent pointer-events-none" />

          {/* Glowing Accents */}
          <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-10 top-10 w-64 h-64 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Content Overlay */}
          <div className="relative z-10 p-6 sm:p-8 md:p-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-yellow-400 hover:bg-yellow-400 text-slate-950 font-black text-xs px-3 py-1 uppercase tracking-wider rounded-lg shadow-md">
                  ⚽ eFootball™ Top-Up
                </Badge>
                <Badge variant="outline" className="border-blue-400/50 text-blue-200 text-xs font-bold bg-[#071738]/80 backdrop-blur-md">
                  Official Mobile Artwork
                </Badge>
                <Badge variant="outline" className="border-emerald-400/40 text-emerald-300 text-xs font-bold bg-emerald-950/40 backdrop-blur-md">
                  Manual Delivery Service
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                EFOOTBALL COINS
              </h1>

              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl drop-shadow-sm font-medium">
                Official manual eFootball™ Coin packages for your <strong>iOS</strong>, <strong>Android</strong>, or <strong>Steam</strong> account at unbeatable Ghanaian cedi rates. Guaranteed authentic delivery by King J Deals directly to your KONAMI ID.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] sm:text-xs text-blue-200">
                <span className="flex items-center gap-1.5 bg-[#05112B]/70 px-2.5 py-1 rounded-lg border border-blue-400/20 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  Speed: 5 - 30 Minutes
                </span>
                <span className="flex items-center gap-1.5 bg-[#05112B]/70 px-2.5 py-1 rounded-lg border border-blue-400/20 backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Safe & Legitimate
                </span>
                <span className="flex items-center gap-1.5 bg-[#05112B]/70 px-2.5 py-1 rounded-lg border border-blue-400/20 backdrop-blur-sm">
                  <Lock className="w-3.5 h-3.5 text-yellow-400" />
                  No Password Ever Needed
                </span>
              </div>
            </div>

            {/* Quick Guide Trigger */}
            <div className="shrink-0">
              <Button
                onClick={() => setIsGuideOpen(true)}
                variant="outline"
                className="bg-[#071738]/90 hover:bg-blue-900 border-blue-400/40 text-yellow-400 hover:text-yellow-300 font-black rounded-2xl px-5 h-12 text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl backdrop-blur-md cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                HOW TO FIND MY KONAMI ID?
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PLATFORM SELECTOR: iOS, Android, Steam                 */}
      {/* ========================================================= */}
      <div className="bg-[#07132B] p-4 sm:p-5 rounded-3xl border-2 border-blue-500/25 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-blue-500/20">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400 block">
              SELECT YOUR PLATFORM
            </span>
            <p className="text-xs text-blue-200">
              Choose the platform you play eFootball on. Coins will be delivered for this exact platform.
            </p>
          </div>

          <div className="text-xs text-blue-300 px-2 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Platform: <strong className="text-white font-black">{platformTitle}</strong></span>
          </div>
        </div>

        {/* 3 Explicit Platform Option Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          {/* 1. iOS */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('ios')}
            className={`p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 ${
              selectedPlatform === 'ios'
                ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-lg shadow-yellow-400/20 scale-[1.02]'
                : 'bg-[#091838] text-blue-200 border-blue-500/30 hover:border-blue-400 hover:text-white hover:bg-[#0E2350]'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS (iPhone / iPad)</span>
            {selectedPlatform === 'ios' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
            )}
          </button>

          {/* 2. Android */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('android')}
            className={`p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 ${
              selectedPlatform === 'android'
                ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-lg shadow-yellow-400/20 scale-[1.02]'
                : 'bg-[#091838] text-blue-200 border-blue-500/30 hover:border-blue-400 hover:text-white hover:bg-[#0E2350]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Mobile</span>
            {selectedPlatform === 'android' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
            )}
          </button>

          {/* 3. Steam */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('steam')}
            className={`p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 ${
              selectedPlatform === 'steam'
                ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-lg shadow-yellow-400/20 scale-[1.02]'
                : 'bg-[#091838] text-blue-200 border-blue-500/30 hover:border-blue-400 hover:text-white hover:bg-[#0E2350]'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Steam (PC)</span>
            {selectedPlatform === 'steam' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PRODUCT CARDS GRID                                     */}
      {/* ========================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-blue-950/30 border border-blue-500/20 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="h-32 bg-blue-900/30 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-blue-900/40 rounded w-3/4" />
                <div className="h-6 bg-blue-900/50 rounded w-1/2" />
              </div>
              <div className="h-10 bg-blue-900/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#091533] border border-blue-500/20 space-y-3">
          <Sparkles className="w-8 h-8 text-yellow-400 mx-auto" />
          <h3 className="text-lg font-black text-white">No Packages Available</h3>
          <p className="text-xs text-blue-300">
            No active coin packages currently available for {platformTitle}. Please check back shortly or contact support.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((prod) => {
            const isPopular = prod.badge?.toUpperCase().includes('POPULAR');
            const isBestValue = prod.badge?.toUpperCase().includes('VALUE');
            const isMega = prod.badge?.toUpperCase().includes('MEGA');

            return (
              <div
                key={prod.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#0e224e] via-[#0b1b3e] to-[#07132a] border border-blue-500/25 hover:border-yellow-400/80 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                {/* Optional Badge */}
                {prod.badge && (
                  <div className="absolute -top-2.5 right-3 z-10">
                    <Badge
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md ${
                        isPopular
                          ? 'bg-yellow-400 text-slate-950 border-none'
                          : isBestValue
                          ? 'bg-emerald-500 text-white border-none'
                          : isMega
                          ? 'bg-purple-600 text-white border-none'
                          : 'bg-blue-600 text-white border-none'
                      }`}
                    >
                      {prod.badge}
                    </Badge>
                  </div>
                )}

                {/* Coin Visual Artwork */}
                <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-[#050D20] border border-blue-500/20 flex items-center justify-center p-2 mb-3">
                  <img
                    src={prod.imageUrl || DEFAULT_EFOOTBALL_COIN_IMAGE}
                    alt={prod.name}
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_EFOOTBALL_COIN_IMAGE;
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-[#081533]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-blue-400/30 text-[10px] font-black text-yellow-300 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-yellow-400" />
                    {prod.coinAmount.toLocaleString()} Coins
                  </div>
                </div>

                {/* Package Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-300/80 uppercase tracking-wider">
                      Platform: {prod.platformLabel || platformTitle}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400">
                      In Stock
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white group-hover:text-yellow-300 transition-colors line-clamp-1">
                    {prod.name}
                  </h3>

                  {prod.description && (
                    <p className="text-[11px] text-blue-200/70 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  )}
                </div>

                {/* Price and CTA Button */}
                <div className="pt-3 mt-3 border-t border-blue-500/20 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase font-bold text-blue-300">Price</span>
                    <span className="text-lg sm:text-xl font-black text-yellow-400">
                      GH₵ {prod.price.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleBuyNow(prod)}
                    className="w-full h-11 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:shadow-yellow-400/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    BUY NOW
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Disclaimer footer */}
      <div className="p-4 rounded-2xl bg-[#061026] border border-blue-500/20 text-[11px] text-blue-300/70 leading-relaxed text-center">
        <p>
          <strong>Disclaimer:</strong> King J Deals is an independent digital game top-up retailer providing manual top-up and delivery services in Ghana. This service is not affiliated with, endorsed by, or sponsored by KONAMI Digital Entertainment. All trademarks, game names, and logos are property of their respective owners.
        </p>
      </div>

      {/* Order Modal */}
      <EFootballOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={selectedProduct}
        platformLabel={platformTitle}
        onOpenAuthModal={onOpenAuthModal}
        profile={profile}
      />

      {/* Guide Modal */}
      <KonamiIdGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultPlatform={platformTitle}
      />
    </div>
  );
}
