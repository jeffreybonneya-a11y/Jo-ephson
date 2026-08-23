import React from "react";
import {
  Wifi,
  PhoneCall,
  Gamepad2,
  Monitor,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Crown,
  Zap,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ServiceCategoryKey =
  | "ALL"
  | "DATA_BUNDLES"
  | "AIRTIME"
  | "GAME_COINS"
  | "PC_GAMES"
  | "RESULT_CHECKER"
  | "PREMIUM_APPS";

export type PriceFilterKey = "all" | "under_20" | "20_to_50" | "above_50";
export type SortOptionKey = "price_asc" | "price_desc" | "popular";

export interface CategoryCountMap {
  ALL: number;
  DATA_BUNDLES: number;
  AIRTIME: number;
  GAME_COINS: number;
  PC_GAMES: number;
  RESULT_CHECKER: number;
  PREMIUM_APPS: number;
}

interface CategoryFilterSidebarProps {
  activeCategory: ServiceCategoryKey;
  onSelectCategory: (category: ServiceCategoryKey) => void;
  activeNetworkFilter: string;
  onSelectNetworkFilter: (network: string) => void;
  priceFilter: PriceFilterKey;
  onSelectPriceFilter: (priceKey: PriceFilterKey) => void;
  sortBy: SortOptionKey;
  onSelectSortBy: (sortKey: SortOptionKey) => void;
  categoryCounts: CategoryCountMap;
  isAgentUser?: boolean;
  onResetFilters: () => void;
  isFilterActive: boolean;
}

export const CATEGORIES_CONFIG = [
  {
    id: "DATA_BUNDLES" as ServiceCategoryKey,
    label: "Data Bundles",
    tagline: "MTN, Telecel, AirtelTigo",
    icon: Wifi,
    color: "text-amber-400",
    bgAccent: "bg-amber-400/10",
  },
  {
    id: "AIRTIME" as ServiceCategoryKey,
    label: "Airtime & Top-Up",
    tagline: "Instant Recharge",
    icon: PhoneCall,
    color: "text-emerald-400",
    bgAccent: "bg-emerald-400/10",
  },
  {
    id: "GAME_COINS" as ServiceCategoryKey,
    label: "Game Credits",
    tagline: "FC Mobile, PUBG UC",
    icon: Gamepad2,
    color: "text-cyan-400",
    bgAccent: "bg-cyan-400/10",
  },
  {
    id: "PC_GAMES" as ServiceCategoryKey,
    label: "PC Games",
    tagline: "FC 26 & PC Titles",
    icon: Monitor,
    color: "text-orange-400",
    bgAccent: "bg-orange-400/10",
  },
  {
    id: "RESULT_CHECKER" as ServiceCategoryKey,
    label: "Result Checkers",
    tagline: "BECE, WASSCE, CSSPS",
    icon: GraduationCap,
    color: "text-indigo-400",
    bgAccent: "bg-indigo-400/10",
  },
  {
    id: "PREMIUM_APPS" as ServiceCategoryKey,
    label: "Streaming & Apps",
    tagline: "Netflix, Spotify, Apps",
    icon: Sparkles,
    color: "text-purple-400",
    bgAccent: "bg-purple-400/10",
  },
];

export default function CategoryFilterSidebar({
  activeCategory,
  onSelectCategory,
  activeNetworkFilter,
  onSelectNetworkFilter,
  priceFilter,
  onSelectPriceFilter,
  sortBy,
  onSelectSortBy,
  categoryCounts,
  isAgentUser = false,
  onResetFilters,
  isFilterActive,
}: CategoryFilterSidebarProps) {
  return (
    <aside className="w-full space-y-5 select-none">
      {/* Sidebar Header with Reset */}
      <div className="bg-[#111C38] rounded-2xl border border-amber-500/25 p-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/15">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h3 className="font-black text-sm uppercase tracking-wide text-slate-100 flex items-center gap-1.5">
              <span>Categories</span>
              <span className="text-amber-400">👑</span>
            </h3>
          </div>
          {isFilterActive && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Categories List */}
        <div className="mt-3 space-y-1.5">
          {/* All Services button */}
          <button
            type="button"
            onClick={() => onSelectCategory("ALL")}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              activeCategory === "ALL"
                ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-300 shadow-md font-black"
                : "bg-[#0B132B]/80 text-slate-300 border-slate-800/80 hover:bg-slate-800/60 hover:text-white hover:border-amber-500/30"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Crown
                className={`w-4 h-4 shrink-0 ${
                  activeCategory === "ALL" ? "text-slate-950" : "text-amber-400"
                }`}
              />
              <div className="truncate">
                <div className="text-xs font-black uppercase tracking-tight">
                  All Services
                </div>
                <div
                  className={`text-[10px] truncate ${
                    activeCategory === "ALL" ? "text-slate-900/80 font-medium" : "text-slate-400"
                  }`}
                >
                  Complete Royal Store
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                activeCategory === "ALL"
                  ? "bg-slate-950 text-amber-300"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {categoryCounts.ALL}
            </span>
          </button>

          {/* Individual Categories */}
          {CATEGORIES_CONFIG.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-300 shadow-md font-black"
                    : "bg-[#0B132B]/80 text-slate-300 border-slate-800/80 hover:bg-slate-800/60 hover:text-white hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-slate-950/20" : cat.bgAccent
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-slate-950" : cat.color
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-black uppercase tracking-tight">
                      {cat.label}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? "text-slate-900/80 font-medium" : "text-slate-400"
                      }`}
                    >
                      {cat.tagline}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? "bg-slate-950 text-amber-300"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Network Filter Sub-Box (Active on Data, Airtime or All) */}
      {(activeCategory === "ALL" ||
        activeCategory === "DATA_BUNDLES" ||
        activeCategory === "AIRTIME") && (
        <div className="bg-[#111C38] rounded-2xl border border-amber-500/25 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Network Provider
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "ALL", label: "All Networks" },
              { id: "MTN", label: "MTN", dot: "bg-amber-400" },
              { id: "Telecel", label: "Telecel", dot: "bg-red-500" },
              { id: "AirtelTigo", label: "AirtelTigo", dot: "bg-blue-500" },
            ].map((net) => {
              const isSelected = activeNetworkFilter === net.id;
              return (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => onSelectNetworkFilter(net.id)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-between ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black"
                      : "bg-[#0B132B] text-slate-300 border-slate-800 hover:border-amber-500/40 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {net.dot && (
                      <span className={`w-2 h-2 rounded-full ${net.dot} shrink-0`} />
                    )}
                    <span className="truncate">{net.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="bg-[#111C38] rounded-2xl border border-amber-500/25 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Price Range
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "all" as PriceFilterKey, label: "All Prices" },
            { id: "under_20" as PriceFilterKey, label: "≤ GH₵ 20" },
            { id: "20_to_50" as PriceFilterKey, label: "GH₵ 20 – 50" },
            { id: "above_50" as PriceFilterKey, label: "GH₵ 50+" },
          ].map((pf) => {
            const isSelected = priceFilter === pf.id;
            return (
              <button
                key={pf.id}
                type="button"
                onClick={() => onSelectPriceFilter(pf.id)}
                className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                  isSelected
                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black"
                    : "bg-[#0B132B] text-slate-300 border-slate-800 hover:border-amber-500/40 hover:text-white"
                }`}
              >
                {pf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting Options */}
      <div className="bg-[#111C38] rounded-2xl border border-amber-500/25 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
            Sort Products
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            { id: "price_asc" as SortOptionKey, label: "Price: Low to High" },
            { id: "price_desc" as SortOptionKey, label: "Price: High to Low" },
            { id: "popular" as SortOptionKey, label: "Featured / Popular" },
          ].map((so) => {
            const isSelected = sortBy === so.id;
            return (
              <button
                key={so.id}
                type="button"
                onClick={() => onSelectSortBy(so.id)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${
                  isSelected
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/60 font-black"
                    : "bg-[#0B132B] text-slate-400 border-slate-800 hover:border-amber-500/30 hover:text-slate-200"
                }`}
              >
                <span>{so.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trust & Dispatch Guarantee Badge */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0B132B] to-amber-500/5 border border-amber-500/30 space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>King J Guarantee 👑</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Instant 24/7 automated delivery via MTN, Telecel & AT MoMo gateways.
        </p>
        {isAgentUser && (
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[10px] font-black uppercase px-2 py-0.5 rounded">
            Agent Wholesale Tier Active
          </Badge>
        )}
      </div>
    </aside>
  );
}
