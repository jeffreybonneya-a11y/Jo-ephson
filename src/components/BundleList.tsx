import { useState, useEffect } from "react";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Bundle, Network } from "@/src/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { Smartphone, Wifi, Zap, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StreamingTab from "./StreamingTab";
import fcMobileIcon from "@/src/assets/images/fc_mobile_bellingham_1782342862052.jpg";

interface BundleListProps {
  onSelectBundle: (bundle: Bundle & { wholesalePrice?: number }) => void;
  isAgentMode?: boolean;
  isAgentUser?: boolean;
  agentContext?: any;
}

export default function BundleList({
  onSelectBundle,
  isAgentMode = false,
  isAgentUser = false,
  agentContext = null,
}: BundleListProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("MTN");
  const [activeGameCoinSubTab, setActiveGameCoinSubTab] = useState("FC_MOBILE");
  const [showFCOptions, setShowFCOptions] = useState(false);
  const [fcOptionTab, setFcOptionTab] = useState("points");
  const [announcement, setAnnouncement] = useState<any>(null);

  const tabs = [
    "MTN",
    "Telecel",
    "AirtelTigo",
    "Result Checker",
    "PC Games",
    "Premium Apps",
    "Game Coins",
  ];
  const gameCoinSubTabs = [
    { id: "FC_MOBILE", label: "FC ™ MOBILE points and silver" },
  ];

  const getNetworkColor = (tab: string) => {
    switch (tab) {
      case "MTN":
        return "bg-primary text-secondary border-primary";
      case "Telecel":
        return "bg-red-600 text-white border-red-600";
      case "AirtelTigo":
        return "bg-blue-600 text-white border-blue-600";
      case "Game Coins":
        return "bg-[#00FF87] text-black border-[#00FF87]";
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
      case "Game Coins":
        return "bg-[#00FF87] text-black";
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
    window.addEventListener("NAVIGATE_TO_PC_GAMES", handleNav);
    return () => window.removeEventListener("NAVIGATE_TO_PC_GAMES", handleNav);
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

            setBundles(firestoreBundles.filter((b) => b.active));
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
    const originalPrice = b.price;
    const wholesalePrice = Math.max(0, originalPrice - 2.0);
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
    .sort((a, b) => a.price - b.price);

  return (
    <section
      id="pricing"
      className="py-24 bg-background relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container relative mx-auto px-4">
        {!isAgentMode && (
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-tighter mb-4"
            >
              <Crown className="w-4 h-4" />
              Royal Selection 👑
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-foreground dark:text-white">
              CHOOSE YOUR <span className="text-primary">DEAL</span> 👑
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed font-medium">
              Experience the{" "}
              <span className="text-primary font-bold">Royal Treatment</span>.
              Select your network and let our automated system deliver your data
              instantly.
            </p>
            {isAgentUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-black uppercase tracking-tight shadow-md"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
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
          <div className="overflow-x-auto pb-4 mb-8 no-scrollbar">
            <TabsList className="flex w-max md:grid md:w-full md:grid-cols-6 h-auto gap-4 bg-transparent p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={`text-lg md:text-xl font-black h-14 md:h-16 px-6 md:px-0 min-w-[140px] md:min-w-0 border-2 rounded-2xl transition-all hover:border-primary/50 shadow-sm data-[state=active]:shadow-xl data-[state=active]:scale-105 ${
                    tab === activeTab
                      ? getNetworkColor(tab)
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {["MTN", "Telecel", "AirtelTigo"].includes(tab) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-64 rounded-[2rem]" />
                    ))
                  ) : filteredBundles.length > 0 ? (
                    filteredBundles.map((bundle, index) => (
                      <motion.div
                        key={bundle.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <Card
                          className={`hover:shadow-xl transition-all border-2 rounded-[2rem] overflow-hidden group bg-card hover:border-primary border-border shadow-sm`}
                        >
                          <CardHeader
                            className={`${getNetworkBadgeColor(bundle.network)}/5 border-b-2 border-border p-8`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`${getNetworkBadgeColor(bundle.network)} font-black`}
                                >
                                  {bundle.network}
                                </Badge>
                                {bundle.network === "MTN" && (
                                  <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase text-[10px] tracking-wider">
                                    Out of Stock
                                  </Badge>
                                )}
                              </div>
                              <Zap className="w-6 h-6 text-primary fill-primary animate-pulse" />
                            </div>
                            <CardTitle className="text-4xl font-black mt-4 text-foreground dark:text-white">
                              {bundle.dataAmount}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-muted-foreground uppercase">
                                  Royal Price
                                </span>
                                {!isAgentMode &&
                                  !isAgentUser &&
                                  (bundle as any).isDiscounted && (
                                    <span className="text-sm font-bold text-red-500 line-through">
                                      GH₵{" "}
                                      {(bundle as any).originalPrice.toFixed(2)}
                                    </span>
                                  )}
                                {isAgentUser && (
                                  <span className="text-sm font-bold text-red-500 line-through">
                                    GH₵{" "}
                                    {(bundle as any).originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-4xl font-black text-foreground dark:text-white">
                                  GH₵ {bundle.price.toFixed(2)}
                                </span>
                                {isAgentUser && (
                                  <Badge
                                    variant="outline"
                                    className="mt-1.5 border-primary/30 text-primary font-black animate-pulse rounded-md text-[10px] uppercase w-fit"
                                  >
                                    👑 Agent Wholesale
                                  </Badge>
                                )}
                              </div>
                              <Wifi className="w-10 h-10 text-primary/20 group-hover:text-primary transition-colors" />
                            </div>
                            <Button
                              disabled={bundle.network === "MTN"}
                              className={
                                bundle.network === "MTN"
                                  ? "w-full h-16 text-xl font-black rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                                  : "w-full h-16 text-xl font-black rounded-2xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-white transition-all shadow-lg"
                              }
                              onClick={() => {
                                if (bundle.network !== "MTN") {
                                  onSelectBundle(bundle);
                                }
                              }}
                            >
                              {bundle.network === "MTN" ? "OUT OF STOCK 🚫" : "BUY NOW 👑"}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-24 bg-card rounded-[2rem] border-4 border-dashed border-primary/10">
                      <Smartphone className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                      <h3 className="text-2xl font-black text-foreground mb-2 dark:text-white">
                        RESTOCKING SOON 👑
                      </h3>
                      <p className="text-muted-foreground">
                        The King is preparing more deals for {tab}.
                      </p>
                    </div>
                  )}
                </div>
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
                        <div className="flex flex-col md:flex-row items-center gap-8 bg-card rounded-[2rem] border-2 border-border p-8">
                          <img
                            src={fcMobileIcon}
                            alt="FC Mobile"
                            className="rounded-3xl w-48 h-48 object-cover shadow-lg"
                          />
                          <div className="text-center md:text-left flex-1">
                            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">
                              FC ™ MOBILE
                            </h2>
                            <p className="text-muted-foreground font-medium mb-6">
                              Purchase your FC Points and Silver instantly to
                              upgrade your ultimate team.
                            </p>
                            <Button
                              className="w-full md:w-auto h-16 px-12 text-xl font-black rounded-2xl bg-[#00FF87] text-black hover:bg-black hover:text-[#00FF87] transition-all shadow-lg"
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {(processedBundles.filter(
                                (b) => b.category === "FC Mobile Points",
                              ).length > 0
                                ? processedBundles
                                    .filter(
                                      (b) => b.category === "FC Mobile Points",
                                    )
                                    .sort((a, b) => a.price - b.price)
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
                                      dataAmount: "380 FC Points (Premium)",
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
                                  ]
                              ).map((bundle, index) => (
                                <motion.div
                                  key={bundle.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  transition={{
                                    duration: 0.4,
                                    delay: index * 0.05,
                                  }}
                                >
                                  <Card
                                    className={`hover:shadow-xl transition-all border-2 rounded-[2rem] overflow-hidden group bg-card hover:border-[#00FF87] border-border shadow-sm`}
                                  >
                                    <CardHeader
                                      className={`bg-[#00FF87]/10 border-b-2 border-border p-8`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <Badge
                                          className={`bg-[#00FF87] text-black font-black`}
                                        >
                                          FC Points
                                        </Badge>
                                        <Crown className="w-6 h-6 text-[#00FF87] fill-[#00FF87] animate-pulse" />
                                      </div>
                                      <CardTitle
                                        className={`text-4xl font-black mt-4 text-foreground dark:text-white ${bundle.dataAmount.length > 15 ? "text-2xl" : ""}`}
                                      >
                                        {bundle.dataAmount}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                      <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                          <span className="text-xs font-black text-muted-foreground uppercase">
                                            Price
                                          </span>
                                          <span className="text-4xl font-black text-foreground dark:text-white">
                                            GH₵ {bundle.price.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        className="w-full h-16 text-xl font-black rounded-2xl bg-black text-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all shadow-lg"
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
                          )}

                          {fcOptionTab === "silver" && (
                            <>
                              {processedBundles.filter((b) => b.category === "FC Mobile Silver").length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {processedBundles
                                    .filter((b) => b.category === "FC Mobile Silver")
                                    .sort((a, b) => a.price - b.price)
                                    .map((bundle, index) => (
                                      <motion.div
                                        key={bundle.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                          duration: 0.4,
                                          delay: index * 0.05,
                                        }}
                                      >
                                        <Card className={`hover:shadow-xl transition-all border-2 rounded-[2rem] overflow-hidden group bg-card hover:border-[#00FF87] border-border shadow-sm`}>
                                          <CardHeader className={`bg-[#00FF87]/10 border-b-2 border-border p-8`}>
                                            <div className="flex justify-between items-start">
                                              <Badge className={`bg-[#00FF87] text-black font-black`}>FC Silver</Badge>
                                              <Zap className="w-6 h-6 text-slate-400 fill-slate-400 animate-pulse" />
                                            </div>
                                            <CardTitle className="text-4xl font-black mt-4 text-foreground dark:text-white">{bundle.dataAmount}</CardTitle>
                                          </CardHeader>
                                          <CardContent className="p-8">
                                            <div className="flex items-center justify-between mb-8">
                                              <div className="flex flex-col">
                                                <span className="text-xs font-black text-muted-foreground uppercase">Price</span>
                                                <span className="text-4xl font-black text-foreground dark:text-white">GH₵ {bundle.price.toFixed(2)}</span>
                                              </div>
                                            </div>
                                            <Button 
                                              className="w-full h-16 text-xl font-black rounded-2xl bg-black text-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all shadow-lg" 
                                              onClick={() => onSelectBundle(bundle as any)}
                                            >
                                              BUY NOW 👑
                                            </Button>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    ))}
                                </div>
                              ) : (
                                <div className="min-h-[30vh] flex flex-col items-center justify-center p-8 bg-card rounded-[2rem] border-2 border-dashed border-border gap-4">
                                  <h2 className="text-xl font-black text-muted-foreground uppercase tracking-widest text-center">Waiting for packages...</h2>
                                  <p className="text-sm text-slate-500 font-bold text-center">The admin is currently updating the FC Mobile Silver packages.</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[50vh] flex items-center justify-center p-8 bg-card rounded-[2rem] border-2 border-border">
                  <h2 className="text-xl font-black text-muted-foreground uppercase tracking-widest">
                    {tab} Coming Soon
                  </h2>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
