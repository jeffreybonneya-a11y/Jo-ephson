import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import adImage from '../assets/images/fc_26_features_banner_1782041097947.jpg';

const PromoAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasClosedAd = sessionStorage.getItem('hasClosedPromoAd');
    if (hasClosedAd) {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasClosedPromoAd', 'true');
  };

  const handleBannerClick = () => {
    window.dispatchEvent(new Event('NAVIGATE_TO_PC_GAMES'));
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-32 left-4 md:bottom-8 md:left-8 z-[100] animate-in slide-in-from-bottom-5 duration-500 max-w-[200px] md:max-w-[240px] shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black group">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white transition-all shadow-lg"
        aria-label="Close ad"
      >
        <X className="w-3 h-3" />
      </button>
      <button onClick={handleBannerClick} className="w-full h-full block text-left p-0 m-0 cursor-pointer border-none bg-transparent">
        <img 
          src={adImage} 
          alt="FC 26 Promo Ad - Featuring Rush Mode & FC IQ" 
          className="w-full h-auto object-cover border-none hover:scale-105 transition-transform duration-500"
        />
      </button>
    </div>
  );
};

export default PromoAd;
