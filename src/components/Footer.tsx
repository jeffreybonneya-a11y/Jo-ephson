import { useState, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import { useBranding } from '@/src/hooks/useBranding';
import PolicyModal, { PolicyType } from './PolicyModal';

export default function Footer() {
  const { branding } = useBranding();
  const [policyModal, setPolicyModal] = useState<PolicyType>(null);

  const nameParts = (branding.brandName || 'KING J DEALS').split(' ');
  const firstWord = nameParts[0] || 'KING';
  const restWords = nameParts.slice(1).join(' ') || 'J DEALS';

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/')) {
      e.preventDefault();
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="bg-[#06040A] text-slate-400 py-12 sm:py-16 border-t border-purple-500/20 relative z-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-white mb-6">
                {branding.logoUrl && (
                  <img
                    src={branding.logoUrl}
                    alt={branding.brandName || "Site Logo"}
                    style={{ height: '36px' }}
                    className={`${
                      branding.logoShape === 'circle'
                        ? 'rounded-full object-cover'
                        : branding.logoShape === 'square' || branding.logoShape === 'original'
                        ? 'rounded-none object-contain'
                        : 'rounded-xl object-contain'
                    } shrink-0`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-secondary px-3 py-1 rounded-lg font-serif">{firstWord}</span>
                  <span className="text-primary font-serif">
                    {restWords} {branding.showCrown !== false && '👑'}
                  </span>
                </div>
              </div>
              <p className="max-w-md mb-6 text-slate-300 leading-relaxed text-sm">
                {branding.tagline || (
                  <>Experience the <span className="text-amber-300 font-bold">Royal Treatment</span> in data deals. Affordable, non-expiry data bundles in Ghana. 5-15 mins delivery under stable network. 👑</>
                )}
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="rounded-full bg-[#120A1E] border border-purple-500/20 text-slate-300 hover:bg-amber-400 hover:text-slate-950"><Facebook className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-[#120A1E] border border-purple-500/20 text-slate-300 hover:bg-amber-400 hover:text-slate-950"><Twitter className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-[#120A1E] border border-purple-500/20 text-slate-300 hover:bg-amber-400 hover:text-slate-950"><Instagram className="w-4 h-4" /></Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-amber-300 font-black mb-6 text-xs uppercase tracking-widest font-serif">Data Bundles</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/data-bundles" onClick={(e) => handleLinkClick(e, '/data-bundles')} className="hover:text-amber-300 text-slate-300 transition-colors">All Data Bundles</a></li>
                <li><a href="/mtn-data-bundles" onClick={(e) => handleLinkClick(e, '/mtn-data-bundles')} className="hover:text-amber-300 text-slate-300 transition-colors">MTN Data Ghana</a></li>
                <li><a href="/telecel-data-bundles" onClick={(e) => handleLinkClick(e, '/telecel-data-bundles')} className="hover:text-amber-300 text-slate-300 transition-colors">Telecel Data Ghana</a></li>
                <li><a href="/airteltigo-data-bundles" onClick={(e) => handleLinkClick(e, '/airteltigo-data-bundles')} className="hover:text-amber-300 text-slate-300 transition-colors">AirtelTigo Data</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-amber-300 font-black mb-6 text-xs uppercase tracking-widest font-serif">Digital Services</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/results-checker" onClick={(e) => handleLinkClick(e, '/results-checker')} className="hover:text-amber-300 text-slate-300 transition-colors">WAEC Checkers</a></li>
                <li><a href="/wassce-results-checker" onClick={(e) => handleLinkClick(e, '/wassce-results-checker')} className="hover:text-amber-300 text-slate-300 transition-colors">WASSCE Checker</a></li>
                <li><a href="/bece-results-checker" onClick={(e) => handleLinkClick(e, '/bece-results-checker')} className="hover:text-amber-300 text-slate-300 transition-colors">BECE Checker</a></li>
                <li><a href="/booking-codes" onClick={(e) => handleLinkClick(e, '/booking-codes')} className="hover:text-amber-300 text-slate-300 transition-colors">Booking Codes</a></li>
                <li><a href="/game-coins" onClick={(e) => handleLinkClick(e, '/game-coins')} className="hover:text-amber-300 text-slate-300 transition-colors">Game Coins & Points</a></li>
                <li><a href="/pc-games" onClick={(e) => handleLinkClick(e, '/pc-games')} className="hover:text-amber-300 text-slate-300 transition-colors">PC Offline Games</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-amber-300 font-black mb-6 text-xs uppercase tracking-widest font-serif">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/" onClick={(e) => handleLinkClick(e, '/')} className="hover:text-amber-300 text-slate-300 transition-colors">Home Store</a></li>
                <li>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_APP_DOWNLOAD_MODAL'))} 
                    className="hover:text-amber-200 transition-colors text-left flex items-center gap-1.5 text-amber-300 font-bold cursor-pointer"
                  >
                    <span>📱 Download Android App (APK)</span>
                  </button>
                </li>
                <li><button onClick={() => setPolicyModal('about')} className="hover:text-amber-300 text-slate-300 transition-colors text-left">About Us</button></li>
                <li><button onClick={() => setPolicyModal('terms')} className="hover:text-amber-300 text-slate-300 transition-colors text-left">Terms of Service</button></li>
                <li><button onClick={() => setPolicyModal('privacy')} className="hover:text-amber-300 text-slate-300 transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setPolicyModal('refund')} className="hover:text-amber-300 text-slate-300 transition-colors text-left">Refund Policy</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-amber-300 font-black mb-6 text-xs uppercase tracking-widest font-serif">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <a href="tel:+233535884851" className="flex items-center gap-3 hover:text-amber-300 text-slate-300 transition-colors">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" /> +233 53 588 4851
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <a href="mailto:support@kingjdeals.site" className="flex items-center gap-3 hover:text-amber-300 text-slate-300 transition-colors">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" /> support@kingjdeals.site
                  </a>
                </li>
                <li className="flex items-center gap-3 text-slate-300"><MapPin className="w-4 h-4 text-amber-400 shrink-0" /> Accra, Ghana</li>
                <li className="flex items-center gap-3">
                  <a href="https://wa.me/233535884851" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-emerald-300 text-emerald-400 font-bold transition-colors">
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" /> WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-purple-500/20 text-center text-xs flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
            <p>&copy; {new Date().getFullYear()} {branding.brandName || 'King J Deals'}. All rights reserved.</p>
            <div className="flex gap-4 text-slate-400">
              <button onClick={() => setPolicyModal('privacy')} className="hover:text-amber-300 transition-colors">Privacy</button>
              <span>•</span>
              <button onClick={() => setPolicyModal('terms')} className="hover:text-amber-300 transition-colors">Terms</button>
              <span>•</span>
              <button onClick={() => setPolicyModal('refund')} className="hover:text-amber-300 transition-colors">Refunds</button>
            </div>
          </div>
        </div>
      </footer>

      <PolicyModal type={policyModal} onClose={() => setPolicyModal(null)} />
    </>
  );
}
