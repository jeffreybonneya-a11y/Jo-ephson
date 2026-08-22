import React from 'react';
import WaecPromoCard from './WaecPromoCard';
import FreeDataPromoCard from './FreeDataPromoCard';

export default function TopPromosRow() {
  return (
    <section aria-label="Featured Promotions" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
        <WaecPromoCard />
        <FreeDataPromoCard />
      </div>
    </section>
  );
}
