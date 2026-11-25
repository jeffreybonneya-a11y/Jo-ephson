import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Monitor, Gamepad2, Sparkles, GraduationCap, Search, Crown, ShoppingCart, Zap, AlertTriangle } from 'lucide-react';
import { Bundle } from '../types';
import { getProductImage } from '../lib/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useServiceStatus } from '@/src/hooks/useServiceStatus';
import { getServiceIdForProduct } from '@/src/lib/serviceStatus';
import { toast } from 'sonner';

interface StreamingTabProps {
  onSelectBundle?: (bundle: Bundle) => void;
  bundles?: Bundle[];
}

const SUB_TABS = [
  { id: 'pc_games', label: 'PC Games', icon: Monitor, desc: 'Steam Keys, Epic Games, GTA & Need for Speed' },
  { id: 'playstation_games', label: 'Playstation Games', icon: Gamepad2, desc: 'PSN Cards, PS4 & PS5 Digital Titles' },
  { id: 'premium_apps', label: 'Premium Apps', icon: Sparkles, desc: 'Netflix, Spotify, Canva Pro & ChatGPT Plus' },
  { id: 'results_checker', label: 'Results Checker', icon: GraduationCap, desc: 'BECE, WASSCE, NOV/DEC & WAEC Checkers' },
] as const;

type SubTabId = typeof SUB_TABS[number]['id'];

function getTabCategory(b: Bundle): SubTabId | null {
  const nameLower = (b.name || '').toLowerCase();
  const categoryLower = (b.category || '').toLowerCase();
  const networkLower = (b.network || '').toLowerCase();

  // Exclude standard telecom data bundles (MTN, Telecel, AirtelTigo) unless explicitly categorized
  if (['mtn', 'telecel', 'airteltigo', 'vodafone', 'tigo'].includes(networkLower) && !categoryLower && !nameLower.includes('checker') && !nameLower.includes('coin') && !nameLower.includes('points') && !nameLower.includes('uc') && !nameLower.includes('diamonds')) {
    return null;
  }

  // 1. Results Checker
  if (categoryLower.includes('checker') || nameLower.includes('bece') || nameLower.includes('wassce') || nameLower.includes('novdec') || nameLower.includes('waec') || nameLower.includes('checker') || nameLower.includes('results')) {
    return 'results_checker';
  }
  // 2. Premium Apps
  if (categoryLower.includes('premium') || categoryLower.includes('app') || nameLower.includes('netflix') || nameLower.includes('spotify') || nameLower.includes('canva') || nameLower.includes('chatgpt') || nameLower.includes('capcut') || nameLower.includes('apple music') || nameLower.includes('youtube')) {
    return 'premium_apps';
  }
  // 3. Playstation Games
  if (nameLower.includes('playstation') || nameLower.includes('psn') || nameLower.includes('ps4') || nameLower.includes('ps5') || nameLower.includes('sony') || categoryLower.includes('playstation') || categoryLower.includes('ps_games')) {
    return 'playstation_games';
  }
  // 4. PC Games
  if (categoryLower.includes('pc') || categoryLower.includes('steam') || nameLower.includes('steam') || nameLower.includes('gta') || nameLower.includes('need for speed') || nameLower.includes('nfs') || nameLower.includes('pc game') || nameLower.includes('epic')) {
    return 'pc_games';
  }
  // 5. Default: PC Games
  return 'pc_games';
}

const ProductCard: React.FC<{ bundle: Bundle; outOfStock?: boolean; onSelect: (bundle: Bundle) => void }> = ({ bundle, outOfStock = false, onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`transition-all duration-300 group border-2 rounded-[2rem] overflow-hidden bg-card flex flex-col h-full shadow-md ${
        outOfStock
          ? 'border-red-500/40 opacity-85'
          : 'border-border hover:border-primary hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)]'
      }`}
    >

      <div className="p-6 md:p-8 flex flex-col flex-1">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg md:text-xl font-black text-foreground dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">
              {bundle.name}
            </h3>
            {outOfStock && (
              <Badge className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 shrink-0">
                Out of Stock
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs md:text-sm font-medium leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {bundle.description || `Automated instant delivery. ${bundle.dataAmount ? `Package Volume: ${bundle.dataAmount}.` : 'Verified high quality service.'}`}
          </p>
        </div>

        <div className="mt-auto pt-5 flex items-center justify-between border-t-2 border-border/60">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Royal Price</span>
            <span className="text-2xl md:text-3xl font-black text-primary font-mono">
              GHS {bundle.price.toFixed(2)}
            </span>
          </div>
          <Button 
            disabled={outOfStock}
            className={`rounded-2xl px-6 h-14 font-black uppercase tracking-wider text-xs md:text-sm shadow-lg transition-all flex items-center gap-2 ${
              outOfStock
                ? 'bg-red-950/60 text-red-200 border border-red-500/40 cursor-not-allowed'
                : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-white active:scale-95 cursor-pointer'
            }`}
            onClick={() => {
              if (outOfStock) {
                toast.error('This service is temporarily Out of Stock.');
                return;
              }
              onSelect(bundle);
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{outOfStock ? 'Out of Stock' : 'Buy Now'}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function StreamingTab({ onSelectBundle, bundles = [] }: StreamingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('pc_games');
  const [searchQuery, setSearchQuery] = useState('');
  const { isOutOfStock, getServiceName } = useServiceStatus();

  const isSubTabOutOfStock = (tabId: SubTabId): boolean => {
    if (tabId === 'pc_games') return isOutOfStock('pc_games');
    if (tabId === 'results_checker') return isOutOfStock('checkers');
    return false;
  };

  // Group bundles by sub tab
  const activeTabConfig = SUB_TABS.find(t => t.id === activeSubTab) || SUB_TABS[0];
  const activeTabUnavailable = isSubTabOutOfStock(activeSubTab);

  const matchingBundles = bundles.filter(b => {
    const tabCategory = getTabCategory(b);
    if (tabCategory !== activeSubTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-8">
      {/* Header Info & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-border">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-3">
            <span>More Digital Deals</span>
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Choose a category below to explore gaming points, software licenses, and official checkers.
          </p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTabConfig.label.toLowerCase()}...`}
            className="pl-12 h-14 rounded-2xl border-2 border-border bg-background text-foreground font-medium text-sm focus-visible:ring-primary shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground hover:text-foreground uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === activeSubTab;
          const tabOut = isSubTabOutOfStock(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all cursor-pointer text-center select-none ${
                isActive 
                  ? 'bg-primary text-secondary border-primary shadow-xl scale-102 font-black' 
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:bg-card/80 font-bold'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform ${
                isActive ? 'bg-secondary text-primary scale-110' : 'bg-primary/10 text-primary'
              }`}>
                <Icon className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <span className="text-xs md:text-sm uppercase tracking-tight line-clamp-1">{tab.label}</span>
              {tabOut && (
                <span className="mt-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase">
                  Out of Stock
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Tab Banner Description */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 md:p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-primary text-secondary font-black uppercase tracking-wider text-[10px] px-2.5 py-1">
            Active Category
          </Badge>
          <span className="font-black text-foreground dark:text-white uppercase tracking-tight text-sm md:text-base">
            {activeTabConfig.label}
          </span>
          {activeTabUnavailable && (
            <Badge className="bg-red-600 text-white font-black uppercase text-[10px] px-2.5 py-1">
              Out of Stock
            </Badge>
          )}
          <span className="text-muted-foreground hidden md:inline">• {activeTabConfig.desc}</span>
        </div>
        <span className="text-xs font-black text-primary font-mono uppercase bg-background px-3 py-1.5 rounded-xl border border-primary/20 shrink-0">
          {matchingBundles.length} {matchingBundles.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {activeTabUnavailable && (
        <div className="rounded-2xl bg-red-500/10 border-2 border-red-500/40 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-300 font-semibold">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>
            {activeTabConfig.label} is temporarily Out of Stock. Purchases are paused until stock is restored.
          </span>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-2">
        {matchingBundles.length > 0 ? (
          matchingBundles.map(bundle => {
            const mappedSid = getServiceIdForProduct(bundle);
            const cardOut = activeTabUnavailable || (mappedSid ? isOutOfStock(mappedSid) : false);
            return (
              <ProductCard 
                key={bundle.id} 
                bundle={bundle}
                outOfStock={cardOut}
                onSelect={b => {
                  if (cardOut) {
                    const name = mappedSid ? getServiceName(mappedSid) : activeTabConfig.label;
                    toast.error(`${name} is temporarily Out of Stock.`);
                    return;
                  }
                  onSelectBundle && onSelectBundle(b);
                }} 
              />
            );
          })
        ) : (
          <div className="col-span-full py-20 px-6 bg-card rounded-[2.5rem] border-4 border-dashed border-border text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center mb-6 shadow-inner">
              <Crown className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-foreground dark:text-white mb-2 uppercase tracking-tight">
              {searchQuery ? 'No Results Found' : `Restocking ${activeTabConfig.label} Soon`}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6 font-medium">
              {searchQuery 
                ? `We couldn't find any items matching "${searchQuery}" in ${activeTabConfig.label}. Try a different search term.`
                : `The King is currently preparing fresh automated deals for ${activeTabConfig.label}. Please check back shortly or explore our other royal categories!`
              }
            </p>
            {searchQuery && (
              <Button 
                onClick={() => setSearchQuery('')}
                className="rounded-xl px-6 h-12 bg-secondary text-secondary-foreground hover:bg-primary hover:text-white font-black uppercase text-xs tracking-wider"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
