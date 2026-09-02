import { useState, useEffect } from "react";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Bundle, Network } from "@/src/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import {
  Smartphone,
  Wifi,
  Zap,
  Crown,
  Search,
  GraduationCap,
  Gamepad2,
  Monitor,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StreamingTab from "./StreamingTab";
import ResultCheckerSection from "./ResultCheckerSection";
import BookingCodesSection from "./BookingCodesSection";
import fcMobileIcon from "@/src/assets/images/ea_sports_fc_mobile_cover_fixed_1782486697588.jpg";
import pubgMobileIcon from "@/src/assets/images/pubg_mobile_cover_1782399506286.jpg";
import fc26Icon from "@/src/assets/images/ea_sports_fc_26_cover_1782485615642.jpg";

interface BundleListProps {
  onSelectBundle: (bundle: Bundle & { wholesalePrice?: number }) => void;
  isAgentMode?: boolean;
  isAgentUser?: boolean;
  agentContext?: any;
  profile?: any;
}

const fallbackPUBGBundles: any[] = [];

const parseDataAmountToMB = (amountStr: string): number => {
  if (!amountStr) return 0;
  const norm = amountStr.trim().toLowerCase();
  const numMatch = norm.match(/([\d.,]+)/);
  if (!numMatch) return 0;
  const val = parseFloat(numMatch[1].replace(/,/g, ""));
  if (norm.includes("m")) {
    return val;
  }
  if (norm.includes("t")) {
    return val * 1024 * 1024;
  }
  // Default to GB
  return val * 1024;
};

export default function BundleList({
  onSelectBundle,
  isAgentMode = false,
  isAgentUser = false,
  agentContext = null,
  profile = null,
}: BundleListProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("MTN");
  const [activeGameCoinSubTab, setActiveGameCoinSubTab] = useState("FC_MOBILE");
  const [activePCGamesSubTab, setActivePCGamesSubTab] = useState("FC_26");
  const [showFCOptions, setShowFCOptions] = useState(false);
  const [fcOptionTab, setFcOptionTab] = useState("points");
  const [announcement, setAnnouncement] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Unhidden all services as requested by user
  const hiddenTabs: string[] = [];

  const tabs = [
    "MTN",
    "Telecel",
    "AirtelTigo",
    "Booking Codes",
    "Result Checker",
    "PC Games",
    "Premium Apps",
    "Game Coins",
  ].filter((tab) => !hiddenTabs.includes(tab));
  const gameCoinSubTabs = [
    { id: "FC_MOBILE", label: "FC ™ MOBILE points and silver" },
    { id: "PUBG_MOBILE", label: "PUBG Mobile UC" },
  ];

  const mainCategories = [
    { id: "DATA_BUNDLES", label: "Data Bundles", icon: Wifi },
    { id: "BOOKING_CODES", label: "Booking Codes $", icon: DollarSign },
    { id: "RESULT_CHECKER", label: "Result Checker", icon: GraduationCap },
    { id: "GAME_COINS", label: "Game Coins", icon: Gamepad2 },
    { id: "PC_GAMES", label: "PC Games", icon: Monitor },
    { id: "PREMIUM_APPS", label: "Premium Apps", icon: Sparkles },
  ].filter((cat) => {
    if (cat.id === "BOOKING_CODES" && hiddenTabs.includes("Booking Codes")) return false;
    if (cat.id === "RESULT_CHECKER" && hiddenTabs.includes("Result Checker")) return false;
    if (cat.id === "GAME_COINS" && hiddenTabs.includes("Game Coins")) return false;
    if (cat.id === "PC_GAMES" && hiddenTabs.includes("PC Games")) return false;
    if (cat.id === "PREMIUM_APPS" && hiddenTabs.includes("Premium Apps")) return false;
    return true;
  });

  const dataNetworks = [
    { id: "MTN", label: "MTN", activeClass: "bg-amber-400 text-slate-950 border-amber-500 font-black", dotClass: "bg-amber-500" },
    { id: "Telecel", label: "Telecel", activeClass: "bg-red-600 text-white border-red-700 font-black", dotClass: "bg-red-500" },
    { id: "AirtelTigo", label: "AT (AirtelTigo)", activeClass: "bg-blue-600 text-white border-blue-700 font-black", dotClass: "bg-blue-500" },
  ];

  const currentMainCat = ["MTN", "Telecel", "AirtelTigo"].includes(activeTab)
    ? "DATA_BUNDLES"
    : activeTab === "Booking Codes"
    ? "BOOKING_CODES"
    : activeTab === "Result Checker"
    ? "RESULT_CHECKER"
    : activeTab === "Game Coins"
    ? "GAME_COINS"
    : activeTab === "PC Games"
    ? "PC_GAMES"
    : activeTab === "Premium Apps"
    ? "PREMIUM_APPS"
    : "DATA_BUNDLES";

  const handleSelectMainCategory = (catId: string) => {
    if (catId === "DATA_BUNDLES") {
      if (!["MTN", "Telecel", "AirtelTigo"].includes(activeTab)) {
        setActiveTab("MTN");
      }
    } else if (catId === "BOOKING_CODES") {
      setActiveTab("Booking Codes");
    } else if (catId === "RESULT_CHECKER") {
      setActiveTab("Result Checker");
    } else if (catId === "GAME_COINS") {
      setActiveTab("Game Coins");
    } else if (catId === "PC_GAMES") {
      setActiveTab("PC Games");
    } else if (catId === "PREMIUM_APPS") {
      setActiveTab("Premium Apps");
    }
  };

  const getNetworkColor = (tab: string) => {
    switch (tab) {
      case "MTN":
        return "bg-primary text-secondary border-primary";
      case "Telecel":
        return "bg-red-600 text-white border-red-600";
      case "AirtelTigo":
        return "bg-blue-600 text-white border-blue-600";
      case "Booking Codes":
        return "bg-amber-400 text-slate-950 border-amber-400";
      case "Game Coins":
      case "FC Mobile":
        return "bg-[#00FF87] text-black border-[#00FF87]";
      case "PC Games":
        return "bg-amber-500 text-black border-amber-500";
      case "Result Checker":
        return "bg-indigo-600 text-white border-indigo-600";
      case "Premium Apps":
        return "bg-purple-600 text-white border-purple-600";
      default:
        return "bg-slate-700 text-white border-slate-700";
    }
  };

  const getNetworkBadgeColor = (tab: string) => {
    switch (tab) {
      case "MTN":
        return "bg-primary text-secondary";
      case "Telecel":
        return "bg-red-600 text-white";
      case "AirtelTigo":
        return "bg-blue-600 text-white";
      case "Booking Codes":
        return "bg-amber-400 text-slate-950";
      case "Game Coins":
      case "FC Mobile":
        return "bg-[#00FF87] text-black";
      case "PC Games":
        return "bg-amber-500 text-black";
      case "Result Checker":
        return "bg-indigo-600 text-white";
      case "Premium Apps":
        return "bg-purple-600 text-white";
      default:
        return "bg-slate-700 text-white";
    }
  };

  useEffect(() => {
    const handleNav = () => {
      setActiveTab("PC Games");
      setTimeout(() => {
        const tabsElement = document.getElementById("bundle-tabs");
        if (tabsElement) {
          tabsElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    };
    const handleNavChecker = () => {
      setActiveTab("Result Checker");
      setTimeout(() => {
        const tabsElement = document.getElementById("bundle-tabs");
        if (tabsElement) {
          tabsElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    };
    const handleNavBookingCodes = () => {
      setActiveTab("Booking Codes");
      setTimeout(() => {
        const tabsElement = document.getElementById("bundle-tabs");
        if (tabsElement) {
          tabsElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    };

    // Auto-detect if landing from Booking Codes payment redirect
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const s = urlParams.get("service");
      const r = urlParams.get("reference") || urlParams.get("trxref");
      if (s === "booking_codes" || (r && r.startsWith("BC_"))) {
        setActiveTab("Booking Codes");
      }
    } catch (e) {
      console.warn("URL check notice:", e);
    }
    window.addEventListener("NAVIGATE_TO_PC_GAMES", handleNav);
    window.addEventListener("NAVIGATE_TO_RESULT_CHECKER", handleNavChecker);
    window.addEventListener("NAVIGATE_TO_RESULTS_CHECKER", handleNavChecker);
    window.addEventListener("NAVIGATE_TO_BOOKING_CODES", handleNavBookingCodes);
    return () => {
      window.removeEventListener("NAVIGATE_TO_PC_GAMES", handleNav);
      window.removeEventListener("NAVIGATE_TO_RESULT_CHECKER", handleNavChecker);
      window.removeEventListener("NAVIGATE_TO_RESULTS_CHECKER", handleNavChecker);
      window.removeEventListener("NAVIGATE_TO_BOOKING_CODES", handleNavBookingCodes);
    };
  }, []);

  useEffect(() => {
    // 1. Listen for discount announcement
    const unsubAnnouncement = onSnapshot(
      doc(db, "settings", "announcement"),
      (snapshot) => {
        setAnnouncement(snapshot.exists() ? snapshot.data() : null);
      },
    );

    // 2. Fetch offers
    const fetchOffers = async () => {
      try {
        // Fetch from Firestore
        const unsubFirestore = onSnapshot(
          collection(db, "bundles"),
          (snapshot) => {
            const firestoreBundles = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Bundle[];

            const filtered = firestoreBundles.filter((b) => {
              if (!b.active) return false;
              if (b.network === "Telecel") {
                const amountStr = String(b.dataAmount || b.name || "");
                const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
                if (gbMatch) {
                  const gbValue = parseFloat(gbMatch[1]);
                  if (gbValue >= 1 && gbValue <= 5) {
                    return false;
                  }
                }
              }
              return true;
            });
            setBundles(filtered);
            setLoading(false);
          },
        );

        return () => unsubFirestore();
      } catch (err) {
        console.error("Failed to fetch bundles:", err);
        setLoading(false);
      }
    };

    fetchOffers();
    return () => unsubAnnouncement();
  }, []);

  const isDiscountActive =
    announcement?.active &&
    (announcement?.type === "discount" || announcement?.type === "alert");

  const processedBundles = bundles.map((b) => {
    let originalPrice = b.price;
    const isFCPackage =
      b.category === "FC Mobile Points" ||
      b.category === "FC Mobile Silver" ||
      b.network === "FC Mobile Points" ||
      b.network === "FC Mobile Silver";
    const amountStr = String(b.dataAmount || b.name || "");
    const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
    const gbValue = gbMatch ? parseFloat(gbMatch[1]) : 0;
    const isTelecelReduced = b.network === "Telecel" && ((gbValue >= 1 && gbValue <= 5) || (gbValue >= 10 && gbValue <= 100));
    const wholesaleDeduction = isFCPackage ? 1.0 : (isTelecelReduced ? 1.0 : 2.0);
    let wholesalePrice = Math.max(0, originalPrice - wholesaleDeduction);
    
    // Add +2Ghc to the wholesale prices of MTN (from 1gb-6gb) in the agent store
    if (b.network === "MTN" && gbValue >= 1 && gbValue <= 6) {
      wholesalePrice += 2.0;
      originalPrice += 2.0;
    }

    // Deduct 0.30 Ghc from agent wholesale prices for MTN
    if (b.network === "MTN") {
      wholesalePrice = Math.max(0, wholesalePrice - 0.30);
    }

    // Manual wholesale price override if set in Admin Dashboard
    if (b.wholesalePrice != null && typeof b.wholesalePrice === "number" && b.wholesalePrice > 0) {
      wholesalePrice = b.wholesalePrice;
    }

    let discountedPrice = originalPrice;

    if (agentContext) {
      discountedPrice =
        agentContext.prices?.[b.id] != null
          ? Number(agentContext.prices[b.id])
          : wholesalePrice; // Actually, if they haven't set a price, maybe default is wholesalePrice or originalPrice
    } else if (isAgentMode || isAgentUser) {
      discountedPrice = wholesalePrice;
    } else if (isDiscountActive) {
      const deduction = originalPrice < 10 ? 1 : 2;
      discountedPrice = Math.max(0, originalPrice - deduction);
    }

    // Deduct 2ghc from MTN prices for standard site visitors
    if (b.network === "MTN" && !agentContext && !isAgentMode && !isAgentUser) {
      discountedPrice = Math.max(0, discountedPrice - 2.0);
      originalPrice = Math.max(0, originalPrice - 2.0);
    }

    return {
      ...b,
      originalPrice,
      wholesalePrice,
      price: discountedPrice,
      isDiscounted:
        !agentContext &&
        (isAgentMode || isAgentUser || isDiscountActive) &&
        discountedPrice < originalPrice,
    };
  });

  const filteredBundles = processedBundles
    .filter((b) => b.network === activeTab)
    .filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.dataAmount.toLowerCase().includes(q) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        b.price.toString().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.network === "Telecel" && b.network === "Telecel") {
        const mbA = parseDataAmountToMB(a.dataAmount || a.name || "");
        const mbB = parseDataAmountToMB(b.dataAmount || b.name || "");
        if (mbA !== mbB) return mbA - mbB;
      }
      return a.price - b.price;
    });

  const fcPointsFallback = [
    {
      id: "fc_40",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "40 FC Points",
      price: 7.0,
      originalPrice: 7.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_100",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "100 FC Points",
      price: 15.0,
      originalPrice: 15.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_140",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "140 FC Points",
      price: 22.0,
      originalPrice: 22.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_180",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "180 FC Points",
      price: 29.0,
      originalPrice: 29.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_220",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "220 FC Points",
      price: 36.0,
      originalPrice: 36.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_260",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "260 FC Points",
      price: 43.0,
      originalPrice: 43.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_340",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "340 FC Points",
      price: 50.0,
      originalPrice: 50.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_380",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "380 FC Points",
      price: 57.0,
      originalPrice: 57.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_380_premium",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "380 FC Points (Premium)",
      price: 74.0,
      originalPrice: 74.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_420",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "420 FC Points",
      price: 81.0,
      originalPrice: 81.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_460",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "460 FC Points",
      price: 88.0,
      originalPrice: 88.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_500",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "500 FC Points",
      price: 95.0,
      originalPrice: 95.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_540",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "540 FC Points",
      price: 102.0,
      originalPrice: 102.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_1070",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "1070 FC Points",
      price: 142.0,
      originalPrice: 142.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_2200",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "2200 FC Points",
      price: 280.0,
      originalPrice: 280.0,
      isDiscounted: false,
      active: true,
    },
    {
      id: "fc_9999",
      network: "FC Mobile",
      category: "FC Mobile Points",
      dataAmount: "9999 FC Points",
      price: 1500.0,
      originalPrice: 1500.0,
      isDiscounted: false,
      active: true,
    },
  ];

  const pcGameItem = {
    id: "fc_26_pc_game",
    network: "PC Games",
    category: "FC 26",
    dataAmount: "FC 26 PC Game",
    price: 50.0,
    originalPrice: 50.0,
    isDiscounted: false,
    active: true,
    name: "FC 26 PC Game",
  };

  const hasFCPointsInDB = processedBundles.some(
    (b) => b.category === "FC Mobile Points",
  );

  const allSearchableProducts = [
    ...processedBundles,
    ...(hasFCPointsInDB ? [] : fcPointsFallback),
    pcGameItem,
  ].filter((b) => {
    // If hidden, exclude from search results
    if (hiddenTabs.includes("PC Games") && b.network === "PC Games") return false;
    if (hiddenTabs.includes("Premium Apps") && b.network === "Premium Apps") return false;
    if (hiddenTabs.includes("Game Coins") && (b.network === "FC Mobile" || b.network === "PUBG Mobile" || b.category?.includes("FC Mobile") || b.category?.includes("PUBG"))) return false;
    if (hiddenTabs.includes("Result Checker") && b.network === "Result Checker") return false;
    return true;
  });

  const globalSearchResults =
    searchQuery.trim() !== ""
      ? allSearchableProducts
          .filter((b) => {
            const q = searchQuery.toLowerCase();
            const matchesDataAmount =
              b.dataAmount && b.dataAmount.toLowerCase().includes(q);
            const matchesName = b.name && b.name.toLowerCase().includes(q);
            const matchesNetwork =
              b.network && b.network.toLowerCase().includes(q);
            const matchesCategory =
              b.category && b.category.toLowerCase().includes(q);
            const matchesPrice = b.price && b.price.toString().includes(q);

            return (
              matchesDataAmount ||
              matchesName ||
              matchesNetwork ||
              matchesCategory ||
              matchesPrice
            );
          })
          .sort((a, b) => {
            if (a.network === "Telecel" && b.network === "Telecel") {
              const mbA = parseDataAmountToMB(a.dataAmount || a.name || "");
              const mbB = parseDataAmountToMB(b.dataAmount || b.name || "");
              if (mbA !== mbB) return mbA - mbB;
            }
            return a.price - b.price;
          })
      : [];

  return (
    <section
      id="pricing"
      className="py-12 md:py-16 bg-background relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container relative mx-auto px-4">
        {!isAgentMode && (
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-tighter mb-3"
            >
              <Crown className="w-3.5 h-3.5" />
              Royal Selection 👑
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tight text-foreground dark:text-white">
              CHOOSE YOUR <span className="text-primary">DEAL</span> 👑
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
              Experience the{" "}
              <span className="text-primary font-bold">Royal Treatment</span>.
              Select your network and let our automated system deliver your data
              instantly.
            </p>
            {isAgentUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-tight shadow-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span>Verified Agent Wholesale Pricing Active 👑</span>
              </motion.div>
            )}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-6xl mx-auto"
          id="bundle-tabs"
        >
          {/* ROYAL NAVIGATION CATEGORY BAR */}
          <div className="w-full mb-8 space-y-3.5">
            {/* Primary Category Selector Cards */}
            {mainCategories.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 bg-[#111C38] p-2.5 sm:p-3 rounded-2xl border border-amber-500/20 shadow-md">
                {mainCategories.map((cat) => {
                  const isActive = currentMainCat === cat.id;
                  const IconComponent = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectMainCategory(cat.id)}
                      className={`flex items-center justify-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none border ${
                        isActive
                          ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 border-amber-300/60 shadow-[0_4px_15px_rgba(245,158,11,0.3)] scale-[1.02]"
                          : "bg-[#0B132B]/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800/60 hover:border-amber-500/30"
                      }`}
                    >
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? "text-slate-950"
                            : "text-amber-400/80"
                        }`}
                      />
                      <span className="truncate tracking-wide">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sub-Header Section for Data Bundles / Categories & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111C38]/80 p-3 rounded-2xl border border-amber-500/20 shadow-md">
              {currentMainCat === "DATA_BUNDLES" ? (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  <span className="text-[11px] font-black uppercase text-amber-400 px-1 shrink-0 hidden sm:inline-block tracking-wider">
                    Network:
                  </span>
                  {dataNetworks.map((net) => {
                    const isSelected = activeTab === net.id;
                    return (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setActiveTab(net.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSelected
                            ? net.activeClass + " shadow-md scale-[1.02]"
                            : "bg-[#0B132B] text-slate-300 border-slate-800 hover:border-amber-500/40 hover:text-white"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${net.dotClass} shrink-0`}
                        />
                        <span>{net.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 text-xs font-extrabold text-slate-300">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Viewing{" "}
                    <strong className="text-amber-300 uppercase font-black tracking-wide">
                      {mainCategories.find((c) => c.id === currentMainCat)?.label}
                    </strong>{" "}
                    Deals 👑
                  </span>
                </div>
              )}

              {/* Universal Search Input */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/80" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-500/30 bg-[#0B132B] text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 text-xs transition-all h-9 md:h-10 font-medium"
                />
              </div>
            </div>
          </div>

          {searchQuery.trim() !== "" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-xl font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-2">
                    Search Results 🔍
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing products matching{" "}
                    <span className="text-primary font-bold">
                      "{searchQuery}"
                    </span>{" "}
                    across all categories
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="font-bold text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1"
                >
                  {globalSearchResults.length}{" "}
                  {globalSearchResults.length === 1 ? "product" : "products"}{" "}
                  found
                </Badge>
              </div>

              {globalSearchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {globalSearchResults.map((bundle, index) => (
                    <motion.div
                      key={bundle.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                    >
                      <Card className="hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] hover:border-amber-500/60 transition-all duration-300 border border-amber-500/20 rounded-2xl overflow-hidden group bg-[#111C38] shadow-md hover:-translate-y-0.5 flex flex-col h-full">
                        <CardHeader
                          className={`${getNetworkBadgeColor(bundle.network)}/10 border-b border-amber-500/20 p-4 flex flex-col gap-1`}
                        >
                          <div className="flex justify-between items-center">
                            <Badge
                              className={`${getNetworkBadgeColor(bundle.network)} text-[10px] px-2 py-0.5 font-black uppercase rounded-md shadow-sm border border-white/20`}
                            >
                              {bundle.network}
                            </Badge>
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                          </div>
                          <CardTitle className="text-lg sm:text-xl font-black mt-2 text-slate-100 tracking-tight leading-none min-h-[2rem] flex items-center">
                            {bundle.dataAmount}
                          </CardTitle>
                          {["MTN", "Telecel", "AirtelTigo"].includes(
                            bundle.network,
                          ) && (
                            <p className="text-[10px] font-extrabold text-amber-400/90 uppercase tracking-wider mt-1">
                              NON-EXPIRY DATA
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Royal Price
                              </span>
                              <div className="flex flex-col">
                                {((!isAgentMode &&
                                  !isAgentUser &&
                                  (bundle as any).isDiscounted) ||
                                  isAgentUser) && (
                                  <span className="text-[10px] font-bold text-red-400 line-through mb-0.5">
                                    GH₵{" "}
                                    {(bundle as any).originalPrice?.toFixed(
                                      2,
                                    ) || bundle.price.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-2.5 py-1 rounded-lg border border-amber-300/60 shadow-sm w-fit tracking-tight">
                                  GH₵ {bundle.price.toFixed(2)}
                                </span>
                              </div>
                              {isAgentUser && (
                                <Badge
                                  variant="outline"
                                  className="mt-1.5 border-amber-500/40 text-amber-300 font-black animate-pulse rounded px-1.5 py-0.5 text-[8px] uppercase w-fit bg-amber-500/10"
                                >
                                  👑 Agent Wholesale
                                </Badge>
                              )}
                            </div>
                            <Wifi className="w-6 h-6 text-amber-500/20 group-hover:text-amber-400 transition-colors shrink-0" />
                          </div>
                          <Button
                            className="w-full h-10 text-xs font-black tracking-wide rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 border border-amber-300/50 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.25)] cursor-pointer"
                            onClick={() => {
                              onSelectBundle(bundle);
                            }}
                          >
                            BUY NOW 👑
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-primary/20">
                  <Smartphone className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-lg font-black text-foreground mb-1 dark:text-white uppercase italic">
                    NO ROYAL DEALS MATCH YOUR SEARCH 👑
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    We couldn't find any products matching{" "}
                    <span className="text-primary font-bold">
                      "{searchQuery}"
                    </span>
                    . Try a different search query like "MTN", "Points", or
                    "UC".
                  </p>
                </div>
              )}
            </div>
          ) : (
            tabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {[
                  "MTN",
                  "Telecel",
                  "AirtelTigo",
                  "Premium Apps",
                ].includes(tab) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {loading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-44 rounded-2xl" />
                      ))
                    ) : filteredBundles.length > 0 ? (
                      filteredBundles.map((bundle, index) => (
                        <motion.div
                          key={bundle.id}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <Card className="hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] hover:border-amber-500/60 transition-all duration-300 border border-amber-500/20 rounded-2xl overflow-hidden group bg-[#111C38] shadow-md hover:-translate-y-0.5 flex flex-col h-full">
                            <CardHeader
                              className={`${getNetworkBadgeColor(bundle.network)}/10 border-b border-amber-500/20 p-4 flex flex-col gap-1`}
                            >
                              <div className="flex justify-between items-center">
                                <Badge
                                  className={`${getNetworkBadgeColor(bundle.network)} text-[10px] px-2 py-0.5 font-black uppercase rounded-md shadow-sm border border-white/20`}
                                >
                                  {bundle.network}
                                </Badge>
                                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                              </div>
                              <CardTitle className="text-xl sm:text-2xl font-black mt-2 text-slate-100 tracking-tight leading-none">
                                {bundle.dataAmount}
                              </CardTitle>
                              {["MTN", "Telecel", "AirtelTigo"].includes(
                                bundle.network,
                              ) && (
                                <p className="text-[10px] font-extrabold text-amber-400/90 uppercase tracking-wider mt-1">
                                  NON-EXPIRY DATA
                                </p>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Royal Price
                                  </span>
                                  <div className="flex flex-col">
                                    {((!isAgentMode &&
                                      !isAgentUser &&
                                      (bundle as any).isDiscounted) ||
                                      isAgentUser) && (
                                      <span className="text-[10px] font-bold text-red-400 line-through mb-0.5">
                                        GH₵{" "}
                                        {(bundle as any).originalPrice.toFixed(
                                          2,
                                        )}
                                      </span>
                                    )}
                                    <span className="text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-2.5 py-1 rounded-lg border border-amber-300/60 shadow-sm w-fit tracking-tight">
                                      GH₵ {bundle.price.toFixed(2)}
                                    </span>
                                  </div>
                                  {isAgentUser && (
                                    <Badge
                                      variant="outline"
                                      className="mt-1.5 border-amber-500/40 text-amber-300 font-black animate-pulse rounded px-1.5 py-0.5 text-[8px] uppercase w-fit bg-amber-500/10"
                                    >
                                      👑 Agent Wholesale
                                    </Badge>
                                  )}
                                </div>
                                <Wifi className="w-7 h-7 text-amber-500/20 group-hover:text-amber-400 transition-colors shrink-0" />
                              </div>
                              <Button
                                className="w-full h-10 text-xs font-black tracking-wide rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 border border-amber-300/50 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.25)] cursor-pointer"
                                onClick={() => {
                                  onSelectBundle(bundle);
                                }}
                              >
                                BUY NOW 👑
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 bg-card rounded-2xl border border-dashed border-primary/20">
                        <Smartphone className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-lg font-black text-foreground mb-1 dark:text-white uppercase">
                          The King 👑 is preparing, expect soon
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          We are currently restocking packages for {tab}. Please
                          check back shortly!
                        </p>
                      </div>
                    )}
                  </div>
                ) : tab === "Booking Codes" ? (
                  <BookingCodesSection profile={profile} agentContext={agentContext} />
                ) : tab === "Result Checker" ? (
                  <ResultCheckerSection agentContext={agentContext} isAgentUser={isAgentUser} />
                ) : tab === "Game Coins" ? (
                  <div className="space-y-6">
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {gameCoinSubTabs.map((subTab) => (
                        <Button
                          key={subTab.id}
                          onClick={() => setActiveGameCoinSubTab(subTab.id)}
                          variant={
                            activeGameCoinSubTab === subTab.id
                              ? "default"
                              : "outline"
                          }
                          className="rounded-full font-black uppercase tracking-wider h-12"
                        >
                          {subTab.label}
                        </Button>
                      ))}
                    </div>
                    {activeGameCoinSubTab === "FC_MOBILE" && (
                      <div className="space-y-8">
                        {!showFCOptions ? (
                          <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-xl border-2 border-border group bg-black flex items-end md:items-center">
                            <img
                              src={fcMobileIcon}
                              alt="Official FC ™ MOBILE Cover"
                              className="absolute inset-0 w-full h-full object-cover z-0"
                            />
                            <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>
                            <div className="relative z-20 w-full flex flex-col justify-end md:justify-center items-center md:items-start text-center md:text-left p-6 md:p-12 h-full">
                              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-2 sm:mb-4 drop-shadow-lg">
                                FC ™ MOBILE
                              </h2>
                              <p className="text-white/90 font-medium text-sm sm:text-lg md:text-xl mb-4 sm:mb-8 max-w-2xl drop-shadow-md line-clamp-2 md:line-clamp-none">
                                Purchase your FC Points and Silver instantly to
                                upgrade your ultimate team.
                              </p>
                              <Button
                                className="w-full sm:w-auto h-12 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl font-black rounded-2xl bg-[#00FF87] text-black hover:bg-white transition-all shadow-xl"
                                onClick={() => setShowFCOptions(true)}
                              >
                                BUY NOW 👑
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                onClick={() => setShowFCOptions(false)}
                                className="rounded-full font-black uppercase tracking-wider"
                              >
                                ← Back
                              </Button>
                              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                                FC ™ MOBILE Options
                              </h2>
                            </div>

                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                              {[
                                { id: "points", label: "FC ™ MOBILE points" },
                                { id: "silver", label: "FC ™ MOBILE silver" },
                              ].map((subTab) => (
                                <Button
                                  key={subTab.id}
                                  onClick={() => setFcOptionTab(subTab.id)}
                                  variant={
                                    fcOptionTab === subTab.id
                                      ? "default"
                                      : "outline"
                                  }
                                  className={`rounded-full font-black uppercase tracking-wider h-12 ${fcOptionTab === subTab.id ? "bg-[#00FF87] text-black hover:bg-[#00cc6a]" : ""}`}
                                >
                                  {subTab.label}
                                </Button>
                              ))}
                            </div>

                            {fcOptionTab === "points" && (
                              <div className="w-full">
                                {(() => {
                                  const allPoints =
                                    processedBundles.filter(
                                      (b) => b.category === "FC Mobile Points",
                                    ).length > 0
                                      ? processedBundles.filter(
                                          (b) =>
                                            b.category === "FC Mobile Points",
                                        )
                                      : [
                                          {
                                            id: "fc_40",
                                            network: "FC Mobile",
                                            dataAmount: "40 FC Points",
                                            price: 7.0,
                                          },
                                          {
                                            id: "fc_100",
                                            network: "FC Mobile",
                                            dataAmount: "100 FC Points",
                                            price: 15.0,
                                          },
                                          {
                                            id: "fc_140",
                                            network: "FC Mobile",
                                            dataAmount: "140 FC Points",
                                            price: 22.0,
                                          },
                                          {
                                            id: "fc_180",
                                            network: "FC Mobile",
                                            dataAmount: "180 FC Points",
                                            price: 29.0,
                                          },
                                          {
                                            id: "fc_220",
                                            network: "FC Mobile",
                                            dataAmount: "220 FC Points",
                                            price: 36.0,
                                          },
                                          {
                                            id: "fc_260",
                                            network: "FC Mobile",
                                            dataAmount: "260 FC Points",
                                            price: 43.0,
                                          },
                                          {
                                            id: "fc_340",
                                            network: "FC Mobile",
                                            dataAmount: "340 FC Points",
                                            price: 50.0,
                                          },
                                          {
                                            id: "fc_380",
                                            network: "FC Mobile",
                                            dataAmount: "380 FC Points",
                                            price: 57.0,
                                          },
                                          {
                                            id: "fc_380_premium",
                                            network: "FC Mobile",
                                            dataAmount:
                                              "380 FC Points (Premium)",
                                            price: 74.0,
                                          },
                                          {
                                            id: "fc_420",
                                            network: "FC Mobile",
                                            dataAmount: "420 FC Points",
                                            price: 81.0,
                                          },
                                          {
                                            id: "fc_460",
                                            network: "FC Mobile",
                                            dataAmount: "460 FC Points",
                                            price: 88.0,
                                          },
                                          {
                                            id: "fc_500",
                                            network: "FC Mobile",
                                            dataAmount: "500 FC Points",
                                            price: 95.0,
                                          },
                                          {
                                            id: "fc_540",
                                            network: "FC Mobile",
                                            dataAmount: "540 FC Points",
                                            price: 102.0,
                                          },
                                          {
                                            id: "fc_1070",
                                            network: "FC Mobile",
                                            dataAmount: "1070 FC Points",
                                            price: 142.0,
                                          },
                                          {
                                            id: "fc_2200",
                                            network: "FC Mobile",
                                            dataAmount: "2200 FC Points",
                                            price: 280.0,
                                          },
                                          {
                                            id: "fc_9999",
                                            network: "FC Mobile",
                                            dataAmount: "9999 FC Points",
                                            price: 1500.0,
                                          },
                                        ];

                                  // Deduplicate points by dataAmount
                                  const pointsMap = new Map();
                                  for (const p of allPoints) {
                                    if (!pointsMap.has(p.dataAmount)) {
                                      pointsMap.set(p.dataAmount, p);
                                    }
                                  }
                                  const rawPoints = Array.from(pointsMap.values());

                                  const filteredPoints = rawPoints
                                    .filter((b) => {
                                      if (!searchQuery) return true;
                                      const q = searchQuery.toLowerCase();
                                      return (
                                        b.dataAmount
                                          .toLowerCase()
                                          .includes(q) ||
                                        b.price.toString().includes(q)
                                      );
                                    })
                                    .sort((a, b) => a.price - b.price);

                                  if (filteredPoints.length === 0) {
                                    return (
                                      <div className="col-span-full text-center py-12 bg-card rounded-2xl border border-dashed border-[#00FF87]/20">
                                        <Smartphone className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4 animate-pulse" />
                                        <h3 className="text-lg font-black text-foreground mb-1 dark:text-white uppercase">
                                          The King 👑 is preparing, expect soon
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                          FC points bundles are currently being
                                          prepared. Check back shortly!
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                      {filteredPoints.map((bundle, index) => (
                                        <motion.div
                                          key={bundle.id}
                                          initial={{ opacity: 0, y: 15 }}
                                          whileInView={{ opacity: 1, y: 0 }}
                                          viewport={{ once: true }}
                                          transition={{
                                            duration: 0.3,
                                            delay: index * 0.03,
                                          }}
                                        >
                                          <Card className="hover:shadow-md hover:shadow-[#00FF87]/5 hover:border-[#00FF87]/50 transition-all duration-300 border border-border/80 rounded-2xl overflow-hidden group bg-card shadow-sm hover:-translate-y-0.5 flex flex-col h-full">
                                            <CardHeader className="bg-[#00FF87]/5 border-b border-border/50 p-4 flex flex-col gap-1">
                                              <div className="flex justify-between items-center">
                                                <Badge className="bg-[#00FF87] text-black text-[10px] px-2 py-0.5 font-black uppercase rounded-md">
                                                  FC Points
                                                </Badge>
                                                <Crown className="w-4 h-4 text-[#00FF87] fill-[#00FF87] animate-pulse shrink-0" />
                                              </div>
                                              <CardTitle
                                                className={`text-lg sm:text-xl font-black mt-2 text-foreground dark:text-white tracking-tight leading-none ${bundle.dataAmount.length > 15 ? "text-base sm:text-lg" : ""}`}
                                              >
                                                {bundle.dataAmount}
                                              </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                                    Price
                                                  </span>
                                                  <span className="text-base sm:text-lg font-black text-foreground dark:text-white">
                                                    GH₵{" "}
                                                    {bundle.price.toFixed(2)}
                                                  </span>
                                                </div>
                                              </div>
                                              <Button
                                                className="w-full h-10 text-xs font-black rounded-xl bg-black text-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all shadow-md cursor-pointer"
                                                onClick={() =>
                                                  onSelectBundle(bundle as any)
                                                }
                                              >
                                                BUY NOW 👑
                                              </Button>
                                            </CardContent>
                                          </Card>
                                        </motion.div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {fcOptionTab === "silver" && (
                              <div className="w-full">
                                {(() => {
                                  const allSilver = processedBundles.filter(
                                    (b) => b.category === "FC Mobile Silver",
                                  );
                                  const silverMap = new Map();
                                  for (const s of allSilver) {
                                    if (!silverMap.has(s.dataAmount)) {
                                      silverMap.set(s.dataAmount, s);
                                    }
                                  }
                                  const rawSilver = Array.from(silverMap.values());
                                  const filteredSilver = rawSilver
                                    .filter((b) => {
                                      if (!searchQuery) return true;
                                      const q = searchQuery.toLowerCase();
                                      return (
                                        b.dataAmount
                                          .toLowerCase()
                                          .includes(q) ||
                                        b.price.toString().includes(q)
                                      );
                                    })
                                    .sort((a, b) => a.price - b.price);

                                  if (filteredSilver.length === 0) {
                                    return (
                                      <div className="col-span-full text-center py-12 bg-card rounded-2xl border border-dashed border-[#00FF87]/20">
                                        <Smartphone className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4 animate-pulse" />
                                        <h3 className="text-lg font-black text-foreground mb-1 dark:text-white uppercase">
                                          The King 👑 is preparing, expect soon
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                          FC Mobile Silver packages are
                                          currently being prepared. Check back
                                          shortly!
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                      {filteredSilver.map((bundle, index) => (
                                        <motion.div
                                          key={bundle.id}
                                          initial={{ opacity: 0, y: 15 }}
                                          whileInView={{ opacity: 1, y: 0 }}
                                          viewport={{ once: true }}
                                          transition={{
                                            duration: 0.3,
                                            delay: index * 0.03,
                                          }}
                                        >
                                          <Card className="hover:shadow-md hover:shadow-[#00FF87]/5 hover:border-[#00FF87]/50 transition-all duration-300 border border-border/80 rounded-2xl overflow-hidden group bg-card shadow-sm hover:-translate-y-0.5 flex flex-col h-full">
                                            <CardHeader className="bg-[#00FF87]/5 border-b border-border/50 p-4 flex flex-col gap-1">
                                              <div className="flex justify-between items-center">
                                                <Badge className="bg-[#00FF87] text-black text-[10px] px-2 py-0.5 font-black uppercase rounded-md">
                                                  FC Silver
                                                </Badge>
                                                <Zap className="w-4 h-4 text-slate-400 fill-slate-400 animate-pulse shrink-0" />
                                              </div>
                                              <CardTitle className="text-xl sm:text-2xl font-black mt-2 text-foreground dark:text-white tracking-tight leading-none">
                                                {bundle.dataAmount}
                                              </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                                    Price
                                                  </span>
                                                  <span className="text-base sm:text-lg font-black text-foreground dark:text-white">
                                                    GH₵{" "}
                                                    {bundle.price.toFixed(2)}
                                                  </span>
                                                </div>
                                              </div>
                                              <Button
                                                className="w-full h-10 text-xs font-black rounded-xl bg-black text-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all shadow-md cursor-pointer"
                                                onClick={() =>
                                                  onSelectBundle(bundle as any)
                                                }
                                              >
                                                BUY NOW 👑
                                              </Button>
                                            </CardContent>
                                          </Card>
                                        </motion.div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {activeGameCoinSubTab === "PUBG_MOBILE" && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card rounded-2xl border border-border p-4">
                          <img
                            src={pubgMobileIcon}
                            alt="PUBG Mobile"
                            className="rounded-xl w-24 h-24 sm:w-32 sm:h-32 object-cover shadow-sm"
                          />
                          <div className="text-center sm:text-left flex-1">
                            <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight mb-1">
                              PUBG Mobile UC
                            </h2>
                            <p className="text-muted-foreground font-medium text-xs sm:text-sm">
                              Top up PUBG Mobile Unknown Cash (UC) instantly.
                              Select from our discount packages below and
                              conquer the battleground!
                            </p>
                          </div>
                        </div>

                        {(() => {
                          const rawPubg =
                            processedBundles.filter(
                              (b) =>
                                b.category === "PUBG Mobile UC" ||
                                b.network === "PUBG Mobile UC",
                            ).length > 0
                              ? processedBundles.filter(
                                  (b) =>
                                    b.category === "PUBG Mobile UC" ||
                                    b.network === "PUBG Mobile UC",
                                )
                              : fallbackPUBGBundles;

                          const filteredPubg = rawPubg
                            .filter((b) => {
                              if (!searchQuery) return true;
                              const q = searchQuery.toLowerCase();
                              return (
                                b.dataAmount.toLowerCase().includes(q) ||
                                b.price.toString().includes(q)
                              );
                            })
                            .sort((a, b) => a.price - b.price);

                          if (filteredPubg.length === 0) {
                            return (
                              <div className="col-span-full text-center py-12 bg-card rounded-2xl border border-dashed border-amber-500/20">
                                <Zap className="w-10 h-10 text-amber-500/20 mx-auto mb-4 animate-pulse" />
                                <h3 className="text-lg font-black text-foreground mb-1 dark:text-white uppercase">
                                  The King 👑 is preparing, expect soon
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  PUBG Mobile UC packages are currently being
                                  prepared. Check back shortly!
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {filteredPubg.map((bundle, index) => (
                                <motion.div
                                  key={bundle.id}
                                  initial={{ opacity: 0, y: 15 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.03,
                                  }}
                                >
                                  <Card className="hover:shadow-md hover:shadow-amber-500/5 hover:border-amber-500/50 transition-all duration-300 border border-border/80 rounded-2xl overflow-hidden group bg-card shadow-sm hover:-translate-y-0.5 flex flex-col h-full">
                                    <CardHeader className="bg-amber-500/5 border-b border-border/50 p-4 flex flex-col gap-1">
                                      <div className="flex justify-between items-center">
                                        <Badge className="bg-amber-500 text-black text-[10px] px-2 py-0.5 font-black uppercase rounded-md">
                                          PUBG UC
                                        </Badge>
                                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                                      </div>
                                      <CardTitle className="text-xl sm:text-2xl font-black mt-2 text-foreground dark:text-white tracking-tight leading-none">
                                        {bundle.dataAmount}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                            Price
                                          </span>
                                          <span className="text-base sm:text-lg font-black text-foreground dark:text-white">
                                            GH₵ {bundle.price.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        className="w-full h-10 text-xs font-black rounded-xl bg-black text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-md cursor-pointer"
                                        onClick={() =>
                                          onSelectBundle(bundle as any)
                                        }
                                      >
                                        BUY NOW 👑
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : tab === "PC Games" ? (
                  <div className="space-y-6">
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {[{ id: "FC_26", label: "FC 26" }].map((subTab) => (
                        <Button
                          key={subTab.id}
                          onClick={() => setActivePCGamesSubTab(subTab.id)}
                          variant={
                            activePCGamesSubTab === subTab.id
                              ? "default"
                              : "outline"
                          }
                          className="rounded-full font-black uppercase tracking-wider h-12"
                        >
                          {subTab.label}
                        </Button>
                      ))}
                    </div>

                    {activePCGamesSubTab === "FC_26" && (
                      <div className="space-y-4">
                        <div className="relative w-full min-h-[500px] md:min-h-[600px] rounded-[2rem] overflow-hidden shadow-xl border-2 border-border group bg-black flex items-center">
                          <img
                            src={fc26Icon}
                            alt="Official EA SPORTS FC 26 Cover"
                            className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
                          />
                          {/* 40% dark overlay so text remains easy to read */}
                          <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none"></div>
                          <div className="relative z-20 w-full flex flex-col justify-center items-center md:items-start text-center md:text-left p-6 md:p-12 h-full">
                            <Badge className="bg-primary text-black font-black mb-2 rounded uppercase text-[9px] tracking-wider px-2 py-0.5">
                              Hot PC Title 👑
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-2 sm:mb-4 drop-shadow-lg">
                              FC 26 PC GAME
                            </h2>
                            <p className="text-white/90 font-medium text-sm sm:text-lg mb-6 max-w-2xl drop-shadow-md">
                              Pre-order or purchase the ultimate football
                              experience with FC 26 on PC. Instant delivery!
                            </p>

                            {/* System Requirements Section */}
                            <div className="w-full mb-8 text-left bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/10 max-w-4xl">
                              <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 border-b border-white/20 pb-2 flex items-center gap-2">
                                System Requirements (PC)
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Minimum */}
                                <div className="space-y-3">
                                  <h4 className="text-primary font-black text-xs uppercase tracking-widest border-l-2 border-primary pl-2">
                                    Minimum Requirements
                                  </h4>
                                  <ul className="text-white/80 text-xs space-y-1.5 font-medium">
                                    <li>
                                      <span className="text-white/50">OS:</span>{" "}
                                      Windows 10 64-bit
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Processor:
                                      </span>{" "}
                                      Intel Core i5-6600K OR AMD Ryzen 5 1600
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        RAM:
                                      </span>{" "}
                                      8 GB
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Graphics:
                                      </span>{" "}
                                      NVIDIA GTX 1050 Ti (4GB) OR AMD Radeon RX
                                      570 (4GB)
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        DirectX:
                                      </span>{" "}
                                      Version 12
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Storage:
                                      </span>{" "}
                                      100 GB available space
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Internet:
                                      </span>{" "}
                                      Broadband internet connection required
                                    </li>
                                  </ul>
                                </div>
                                {/* Recommended */}
                                <div className="space-y-3">
                                  <h4 className="text-[#00FF87] font-black text-xs uppercase tracking-widest border-l-2 border-[#00FF87] pl-2">
                                    Recommended Requirements
                                  </h4>
                                  <ul className="text-white/80 text-xs space-y-1.5 font-medium">
                                    <li>
                                      <span className="text-white/50">OS:</span>{" "}
                                      Windows 10/11 64-bit
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Processor:
                                      </span>{" "}
                                      Intel Core i7-6700 OR AMD Ryzen 7 2700X
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        RAM:
                                      </span>{" "}
                                      12 GB
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Graphics:
                                      </span>{" "}
                                      NVIDIA GTX 1660 OR AMD Radeon RX 5600 XT
                                    </li>
                                    <li>
                                      <span className="text-white/50">
                                        Storage:
                                      </span>{" "}
                                      SSD with 100 GB free space recommended
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              <p className="mt-6 text-[10px] text-white/40 italic font-medium">
                                “System requirements are subject to official
                                confirmation from EA Sports and may change.”
                              </p>
                            </div>

                            <Button
                              className="w-full sm:w-auto h-12 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl font-black rounded-2xl bg-white text-black hover:bg-primary transition-all shadow-xl uppercase"
                              onClick={() =>
                                onSelectBundle({
                                  id: "fc_26_pc_game",
                                  network: "PC Games",
                                  category: "FC 26",
                                  dataAmount: "FC 26 PC Game",
                                  price: 50.0,
                                  active: true,
                                  name: "FC 26 PC Game",
                                } as any)
                              }
                            >
                              BUY NOW FOR 50 GHC 👑
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : tab === "Premium Apps" ? (
                  <StreamingTab onSelectBundle={onSelectBundle} bundles={bundles} />
                ) : (
                  <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 bg-card rounded-[2rem] border-2 border-border text-center">
                    <Crown className="w-12 h-12 text-primary/30 mb-4 animate-bounce" />
                    <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight mb-2 dark:text-white">
                      The King 👑 is preparing, expect soon
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      We're preparing premium deals for {tab}. Check back
                      shortly!
                    </p>
                  </div>
                )}
              </TabsContent>
            ))
          )}
        </Tabs>
      </div>
    </section>
  );
}
