import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { auth, db } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, User, ShieldCheck, Menu, X } from 'lucide-react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserProfile } from '@/src/types';
import { useBranding } from '@/src/hooks/useBranding';
import { isOrderSuccessfullyPaid } from '@/src/lib/orderDeduplication';
import AuthModal from './AuthModal';
import SupportModal from './SupportModal';
import BrandWordmark from './BrandWordmark';

interface NavbarProps {
  onAdminView: (isAdmin: boolean) => void;
  onHistoryView: (isHistory: boolean) => void;
  onStreamView: (isStream: boolean) => void;
  onDownloadView: (isDownload: boolean) => void;
  isAdminView: boolean;
  isHistoryView: boolean;
  isStreamView: boolean;
  isDownloadView: boolean;
  downloadReady: boolean;
  isAdmin: boolean;
  user: any;
  profile: UserProfile | null;
  isAuthLoading?: boolean;
  agentContext?: any;
}

export default function Navbar({ 
  onAdminView, 
  onHistoryView, 
  onStreamView,
  onDownloadView,
  isAdminView, 
  isHistoryView,
  isStreamView,
  isDownloadView,
  downloadReady,
  isAdmin,
  user,
  profile,
  isAuthLoading,
  agentContext = null
}: NavbarProps) {
  const { branding } = useBranding();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleTriggerAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('TRIGGER_AUTH_MODAL', handleTriggerAuth);
    return () => window.removeEventListener('TRIGGER_AUTH_MODAL', handleTriggerAuth);
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      let messagesCount = 0;
      let ordersCount = 0;
      let profitRequestsCount = 0;

      const getResetTime = () => {
        const val = localStorage.getItem('admin_notifier_reset_time');
        return val ? parseInt(val, 10) : 0;
      };

      const getOrderMillis = (doc: any) => {
        const o = doc.data();
        if (!o) return Date.now();
        if (o.createdAt?.seconds) return o.createdAt.seconds * 1000;
        if (typeof o.createdAt?.toMillis === 'function') return o.createdAt.toMillis();
        if (o.createdAt instanceof Date) return o.createdAt.getTime();
        if (typeof o.createdAt === 'number') return o.createdAt;
        if (typeof o.createdAt === 'string') {
          const parsed = Date.parse(o.createdAt);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        if (o.userConfirmedAt?.seconds) return o.userConfirmedAt.seconds * 1000;
        return Date.now();
      };

      const updateCount = () => {
        setUnreadCount(ordersCount + messagesCount + profitRequestsCount);
      };

      const handleResetNotifier = () => {
        localStorage.setItem('admin_notifier_reset_time', Date.now().toString());
        ordersCount = 0;
        setUnreadCount(messagesCount + profitRequestsCount);
      };

      window.addEventListener('RESET_ADMIN_NOTIFIER', handleResetNotifier);

      const qMessages = query(collection(db, 'complaints'), where('status', '==', 'open'));
      const unsubMessages = onSnapshot(qMessages, (snapshot) => {
        messagesCount = snapshot.size;
        updateCount();
      });

      const qOrders = query(collection(db, 'orders'));
      let lastOrderCount = -1;
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const resetTimeMs = getResetTime();
        const visibleOrders = snapshot.docs.filter((doc) => {
          const o = { id: doc.id, ...doc.data() };
          if (!isOrderSuccessfullyPaid(o)) return false;
          const orderTime = getOrderMillis(doc);
          return orderTime > resetTimeMs;
        });

        const newOrdersCount = visibleOrders.length;
        if (lastOrderCount !== -1 && newOrdersCount > lastOrderCount) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          } catch (e) {
            // Audio context policy catch
          }
          toast.success(`NEW ORDER RECEIVED! (${newOrdersCount} new)`);
        }
        lastOrderCount = newOrdersCount;
        ordersCount = newOrdersCount;
        updateCount();
      });

      const qProfitRequests = query(collection(db, 'profit_requests'), where('status', '==', 'pending'));
      const unsubProfitRequests = onSnapshot(qProfitRequests, (snapshot) => {
        profitRequestsCount = snapshot.size;
        updateCount();
      });

      return () => {
        window.removeEventListener('RESET_ADMIN_NOTIFIER', handleResetNotifier);
        unsubMessages();
        unsubOrders();
        unsubProfitRequests();
      };
    } else {
      setUnreadCount(0);
    }
  }, [user, profile, isAdmin, isAdminView]);

  useEffect(() => {
    const handleOpenAuth = () => {
      setIsAuthModalOpen(true);
    };
    window.addEventListener('OPEN_AUTH_MODAL', handleOpenAuth);
    return () => {
      window.removeEventListener('OPEN_AUTH_MODAL', handleOpenAuth);
    };
  }, []);

  const handleLogout = async () => {
    try {
      try {
        localStorage.removeItem('dgn_authenticated_user');
        localStorage.removeItem('dgn_auth_uid');
        localStorage.removeItem('dgn_auth_email');
      } catch {}
      await signOut(auth);
      onAdminView(false);
      onHistoryView(false);
      onStreamView(false);
      onDownloadView(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openAuth = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06040A]/95 backdrop-blur-md border-b border-purple-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Left: Hamburger menu & Brand Logo / Name */}
            <div className="flex items-center gap-3">
              {!agentContext && (
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl bg-[#120A1E] text-amber-300 border border-amber-500/30 hover:bg-amber-500/10 transition-colors cursor-pointer"
                  aria-label="Toggle Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}

              <div 
                className="flex items-center gap-2 cursor-pointer select-none group"
                onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); onDownloadView(false); setIsMobileMenuOpen(false); }}
              >
                {agentContext ? (
                  <div className="relative p-0.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <div className="bg-[#06040A] px-3.5 py-1.5 rounded-[14px] flex items-center gap-2 border border-amber-500/40">
                      <span className="font-serif font-black text-base md:text-lg tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                        {agentContext.agent_name.toUpperCase()} STORE
                      </span>
                      <span className="text-amber-400 text-lg md:text-xl">👑</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-0.5 group-hover:opacity-95 transition-all">
                    {(!branding.logoUrl || branding.logoUrl === '/dataghananow-logo.png' || branding.logoUrl === '/dataghananow-logo.svg') ? (
                      <BrandWordmark size="md" />
                    ) : (
                      <img
                        src={branding.logoUrl}
                        alt={branding.brandName || "DATAGHANAnow"}
                        decoding="async"
                        style={{ 
                          height: `${Math.max(branding.logoHeight || 44, 38)}px`, 
                          maxHeight: '56px',
                          maxWidth: '240px'
                        }}
                        className="w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02] select-none transform-gpu"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Admin/Agent account tab / Logout */}
            <div className="flex items-center gap-2 shrink-0">
              {user && profile && (
                <div className="hidden lg:flex items-center gap-2 bg-[#120A1E] px-4 py-2 rounded-xl border border-purple-500/20">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 lowercase">{profile.fullName}</span>
                </div>
              )}

              {isAdmin && !agentContext && (
                <Button 
                  variant={isAdminView ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => { onAdminView(!isAdminView); }}
                  className={`px-3 h-9 relative border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5 font-black text-xs cursor-pointer shadow-md transition-all ${isAdminView ? 'bg-amber-500 text-slate-950 shadow-amber-500/30' : 'bg-amber-500/10'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline font-extrabold tracking-wide">ADMIN DASHBOARD</span>
                  <span className="sm:hidden font-extrabold tracking-wide">ADMIN</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-lg animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              )}

              {user ? (
                <Button variant="outline" size="sm" onClick={handleLogout} className="px-3 h-9 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                  <LogOut className="w-4 h-4 mr-1" />
                  <span className="text-xs font-bold">Logout</span>
                </Button>
              ) : isAuthLoading ? (
                <div className="h-9 w-24 bg-slate-800/60 animate-pulse rounded-lg" />
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => openAuth()} 
                  className="px-3 sm:px-4 h-9 sm:h-10 bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Admin & Agent Portal Login"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-black tracking-wide">ADMIN / AGENT</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-out Drawer Navigation (Triggered by Hamburger Menu) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-[#060A14] border-r border-amber-500/30 p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BrandWordmark size="sm" />
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); onDownloadView(false); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-300 font-bold text-sm"
                >
                  <span className="text-amber-400">🏠</span>
                  <span>Home Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    onAdminView(false); onHistoryView(false); onStreamView(false); onDownloadView(false);
                    setIsMobileMenuOpen(false);
                    setTimeout(() => window.dispatchEvent(new CustomEvent('SELECT_BUNDLE_TAB', { detail: { tab: 'Booking Codes' } })), 50);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  <span className="text-amber-400">💵</span>
                  <span>Booking Codes</span>
                </button>

                <button
                  onClick={() => {
                    if (user) { onStreamView(true); onAdminView(false); onHistoryView(false); } else { openAuth(); }
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  <span className="text-amber-400">👑</span>
                  <span>Agent Store & Portal</span>
                </button>

                <button
                  onClick={() => {
                    if (user) { onHistoryView(true); onAdminView(false); onStreamView(false); } else { openAuth(); }
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  <span className="text-amber-400">📜</span>
                  <span>Order History</span>
                </button>

                <button
                  onClick={() => { window.dispatchEvent(new CustomEvent('OPEN_REFERRAL_MODAL')); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  <span className="text-amber-400">🎁</span>
                  <span>Refer &amp; Earn Data</span>
                </button>

                <button
                  onClick={() => { window.dispatchEvent(new CustomEvent('OPEN_APP_DOWNLOAD_MODAL')); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  <span className="text-amber-400">📱</span>
                  <span>Download Android App</span>
                </button>

                <button
                  onClick={() => { user ? setIsSupportOpen(true) : openAuth(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  <span className="text-amber-400">💬</span>
                  <span>Customer Support</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 text-center">
              DATAGHANAnow v3.0 • Premium Marketplace
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} profile={profile} agentContext={agentContext} />
    </>
  );
}
