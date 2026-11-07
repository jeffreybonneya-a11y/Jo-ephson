import React from 'react';
import { SeoBundleRow, BASELINE_MTN_BUNDLES, BASELINE_TELECEL_BUNDLES, BASELINE_AIRTELTIGO_BUNDLES, getNetworkSeoBundles } from '../lib/seoPriceTables';
import { ShoppingBag, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface NetworkPriceTableProps {
  network: 'MTN' | 'Telecel' | 'AirtelTigo' | 'ALL';
  onSelectNetworkAndOrder?: (network: string, dataAmount?: string) => void;
  customBundles?: any[];
}

export default function NetworkPriceTable({
  network,
  onSelectNetworkAndOrder,
  customBundles
}: NetworkPriceTableProps) {
  const mtnBundles = getNetworkSeoBundles('MTN', customBundles);
  const telecelBundles = getNetworkSeoBundles('Telecel', customBundles);
  const atBundles = getNetworkSeoBundles('AirtelTigo', customBundles);

  const renderTableRows = (rows: SeoBundleRow[], badgeColor: string) => {
    return rows.map((b) => (
      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/60">
        <td className="p-3.5 font-bold text-white">
          <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black uppercase ${badgeColor} mr-2`}>
            {b.network}
          </span>
          <span className="hidden sm:inline text-xs text-slate-300 font-semibold">Non-Expiry</span>
        </td>
        <td className="p-3.5 font-black text-amber-300 text-sm sm:text-base">
          {b.dataAmount}
        </td>
        <td className="p-3.5 font-black text-emerald-400 font-mono text-sm sm:text-base">
          GH₵ {b.price.toFixed(2)}
        </td>
        <td className="p-3.5 font-mono text-xs sm:text-sm text-slate-300">
          {b.pricePerGb}
        </td>
        <td className="p-3.5 text-right">
          <button
            type="button"
            onClick={() => onSelectNetworkAndOrder?.(b.network, b.dataAmount)}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>Order</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </td>
      </tr>
    ));
  };

  if (network === 'ALL') {
    return (
      <div className="space-y-8 my-8">
        {/* MTN Overview Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>MTN Ghana Data Bundle Prices (15 Active Packages)</span>
            </h3>
            <span className="text-xs text-amber-400 font-bold">1GB to 100GB</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0A1226]/90 shadow-md">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#0F172A] text-amber-400 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="p-3.5">Network</th>
                  <th scope="col" className="p-3.5">Bundle Capacity</th>
                  <th scope="col" className="p-3.5">Retail Price</th>
                  <th scope="col" className="p-3.5">Rate / GB</th>
                  <th scope="col" className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {renderTableRows(mtnBundles, "bg-amber-400 text-slate-950")}
              </tbody>
            </table>
          </div>
        </div>

        {/* Telecel Overview Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>Telecel Ghana Data Bundle Prices (10GB to 100GB)</span>
            </h3>
            <span className="text-xs text-red-400 font-bold">Starting at 10GB</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0A1226]/90 shadow-md">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#0F172A] text-red-400 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="p-3.5">Network</th>
                  <th scope="col" className="p-3.5">Bundle Capacity</th>
                  <th scope="col" className="p-3.5">Retail Price</th>
                  <th scope="col" className="p-3.5">Rate / GB</th>
                  <th scope="col" className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {renderTableRows(telecelBundles, "bg-red-600 text-white")}
              </tbody>
            </table>
          </div>
        </div>

        {/* AirtelTigo Overview Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>AirtelTigo (AT) Data Bundle Prices (1GB to 8GB)</span>
            </h3>
            <span className="text-xs text-blue-400 font-bold">1GB to 8GB</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0A1226]/90 shadow-md">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#0F172A] text-blue-400 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="p-3.5">Network</th>
                  <th scope="col" className="p-3.5">Bundle Capacity</th>
                  <th scope="col" className="p-3.5">Retail Price</th>
                  <th scope="col" className="p-3.5">Rate / GB</th>
                  <th scope="col" className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {renderTableRows(atBundles, "bg-blue-600 text-white")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const targetRows =
    network === 'MTN'
      ? mtnBundles
      : network === 'Telecel'
      ? telecelBundles
      : atBundles;

  const headerTheme =
    network === 'MTN'
      ? "text-amber-400"
      : network === 'Telecel'
      ? "text-red-400"
      : "text-blue-400";

  const badgeTheme =
    network === 'MTN'
      ? "bg-amber-400 text-slate-950"
      : network === 'Telecel'
      ? "bg-red-600 text-white"
      : "bg-blue-600 text-white";

  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Official {network} Ghana Data Bundle Price List</span>
        </h3>
        <span className="text-xs font-bold text-slate-400">
          {targetRows.length} Active Offers
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0A1226]/90 shadow-lg">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className={`bg-[#0F172A] ${headerTheme} font-black text-[11px] uppercase tracking-wider border-b border-slate-800`}>
            <tr>
              <th scope="col" className="p-4">Network</th>
              <th scope="col" className="p-4">Bundle Capacity</th>
              <th scope="col" className="p-4">Retail Price</th>
              <th scope="col" className="p-4">Calculated Rate / GB</th>
              <th scope="col" className="p-4 text-right">Instant Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {renderTableRows(targetRows, badgeTheme)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
