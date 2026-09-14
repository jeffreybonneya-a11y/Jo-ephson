import React from 'react';
import FreeDataPromoCard from './FreeDataPromoCard';

export default function TopPromosRow() {
  return (
    <section aria-label="Featured Promotions" className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
      <div className="w-full">
        <FreeDataPromoCard />
      </div>
    </section>
  );
}
