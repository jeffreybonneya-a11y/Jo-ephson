import React, { useState } from "react";
import { PhoneCall, Zap, Crown, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bundle, Network } from "@/src/types";
import { motion } from "motion/react";

interface AirtimeSectionProps {
  onSelectBundle: (bundle: Bundle & { wholesalePrice?: number }) => void;
  isAgentUser?: boolean;
  agentContext?: any;
  activeNetworkFilter?: string;
}

const AIRTIME_PRESETS = [
  { amount: 5, bonus: "Instant Delivery" },
  { amount: 10, bonus: "Popular" },
  { amount: 15, bonus: "Instant Delivery" },
  { amount: 20, bonus: "Best Value" },
  { amount: 30, bonus: "Instant Delivery" },
  { amount: 50, bonus: "Heavy Top-up" },
  { amount: 100, bonus: "VIP Top-up" },
  { amount: 200, bonus: "Maximum Pack" },
];

export default function AirtimeSection({
  onSelectBundle,
  isAgentUser = false,
  agentContext = null,
  activeNetworkFilter = "ALL",
}: AirtimeSectionProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(
    activeNetworkFilter === "Telecel"
      ? "Telecel"
      : activeNetworkFilter === "AirtelTigo"
      ? "AirtelTigo"
      : "MTN"
  );
  const [customAmount, setCustomAmount] = useState<string>("");

  const networks: { id: Network; label: string; bg: string; dot: string }[] = [
    { id: "MTN", label: "MTN Ghana", bg: "bg-amber-400 text-slate-950", dot: "bg-amber-400" },
    { id: "Telecel", label: "Telecel Ghana", bg: "bg-red-600 text-white", dot: "bg-red-500" },
    { id: "AirtelTigo", label: "AT (AirtelTigo)", bg: "bg-blue-600 text-white", dot: "bg-blue-500" },
  ];

  const handleSelectAirtime = (amountVal: number) => {
    const bundleItem: Bundle = {
      id: `airtime_${selectedNetwork.toLowerCase()}_${amountVal}`,
      name: `${selectedNetwork} Airtime GH₵ ${amountVal}`,
      dataAmount: `GH₵ ${amountVal} Airtime`,
      price: amountVal,
      wholesalePrice: isAgentUser ? Math.max(0, amountVal * 0.98) : amountVal,
      network: selectedNetwork,
      active: true,
      category: "Airtime",
    };
    onSelectBundle(bundleItem);
  };

  const handleCustomAirtime = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customAmount);
    if (!val || val < 1) return;
    handleSelectAirtime(val);
  };

  return (
    <div className="space-y-6">
      {/* Network Selector Tabs */}
      <div className="bg-[#111C38] p-3 sm:p-4 rounded-2xl border border-amber-500/25 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide text-slate-100">
              Instant Airtime Top-Up 👑
            </h4>
            <p className="text-xs text-slate-400">
              Select network & airtime amount for automated direct recharge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {networks.map((net) => {
            const isSelected = selectedNetwork === net.id;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => setSelectedNetwork(net.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? `${net.bg} border-transparent shadow-md scale-[1.02]`
                    : "bg-[#0B132B] text-slate-300 border-slate-800 hover:border-amber-500/40 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${net.dot}`} />
                <span>{net.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Airtime Packages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {AIRTIME_PRESETS.map((preset, index) => (
          <motion.div
            key={preset.amount}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            <Card className="hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] hover:border-amber-500/60 transition-all duration-300 border border-amber-500/20 rounded-2xl overflow-hidden group bg-[#111C38] shadow-md hover:-translate-y-0.5 flex flex-col h-full">
              <CardHeader className="bg-slate-900/50 border-b border-amber-500/20 p-4 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <Badge className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 font-black uppercase rounded-md shadow-sm border border-white/20">
                    {selectedNetwork}
                  </Badge>
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                </div>
                <CardTitle className="text-2xl font-black mt-2 text-slate-100 tracking-tight leading-none">
                  GH₵ {preset.amount}
                </CardTitle>
                <p className="text-[10px] font-extrabold text-amber-400/90 uppercase tracking-wider mt-1">
                  {preset.bonus}
                </p>
              </CardHeader>

              <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Direct Recharge
                    </span>
                    <span className="text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-2.5 py-0.5 rounded-lg border border-amber-300/60 shadow-sm w-fit tracking-tight">
                      GH₵ {preset.amount.toFixed(2)}
                    </span>
                  </div>
                  <PhoneCall className="w-6 h-6 text-amber-500/20 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>

                <Button
                  className="w-full h-10 text-xs font-black tracking-wide rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 border border-amber-300/50 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.25)] cursor-pointer"
                  onClick={() => handleSelectAirtime(preset.amount)}
                >
                  RECHARGE NOW 👑
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Custom Airtime Top-Up Card */}
      <Card className="bg-[#111C38] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
        <form onSubmit={handleCustomAirtime} className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left w-full sm:w-auto">
            <h5 className="text-sm font-black uppercase tracking-wide text-slate-100 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Custom Airtime Amount
            </h5>
            <p className="text-xs text-slate-400">
              Need a custom top-up amount? Enter any amount from GH₵ 1 to GH₵ 1,000.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-400">
                GH₵
              </span>
              <input
                type="number"
                min="1"
                max="1000"
                step="1"
                placeholder="e.g. 75"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-11 pr-3 py-2 rounded-xl bg-[#0B132B] border border-amber-500/30 text-white placeholder:text-slate-500 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={!customAmount || parseFloat(customAmount) < 1}
              className="h-10 px-5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-black text-xs uppercase cursor-pointer shrink-0"
            >
              Recharge <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
