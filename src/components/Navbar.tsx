import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { auth, db } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, LayoutDashboard, History, User, Crown, Home, MessageCircle, Download } from 'lucide-react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserProfile } from '@/src/types';
import AuthModal from './AuthModal';
import SupportModal from './SupportModal';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    if (user && isAdmin) {
      let messagesCount = 0;
      let ordersCount = 0;
      let profitRequestsCount = 0;

      // Initialize reset timestamp if not present
      if (!localStorage.getItem('admin_notifier_reset_time')) {
        localStorage.setItem('admin_notifier_reset_time', Date.now().toString());
      }

      if (isAdminView) {
        localStorage.setItem('admin_notifier_reset_time', Date.now().toString());
      }

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
          const o = doc.data();
          const isExplicitFailed =
            o.status === "failed" ||
            o.status === "cancelled" ||
            o.status === "abandoned" ||
            o.status === "declined" ||
            o.paymentStatus === "failed" ||
            o.paymentStatus === "cancelled" ||
            o.paymentStatus === "abandoned";

          if (isExplicitFailed) return false;
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
          toast.success(`👑 NEW ORDER RECEIVED! (${newOrdersCount} new)`);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B132B]/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-2 cursor-pointer select-none group"
                onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); onDownloadView(false); }}
              >
                <div className="relative p-0.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <div className="bg-[#0B132B] px-3.5 py-1.5 rounded-[14px] flex items-center gap-2 border border-amber-500/40">
                    <span className="font-serif font-black text-sm md:text-base tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                      {agentContext ? `${agentContext.agent_name.toUpperCase()} STORE` : "KING J DEALS"}
                    </span>
                    <span className="text-amber-400 text-base md:text-lg">👑</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            {!agentContext && (
              <div className="hidden md:flex items-center gap-1.5 bg-[#111C38] p-1.5 rounded-2xl border border-amber-500/20 shadow-inner">
                 <button 
                  onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); onDownloadView(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${!isAdminView && !isHistoryView && !isStreamView && !isDownloadView ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)] scale-[1.02]' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
                 >
                   <Home className="w-4 h-4" />
                   HOME
                 </button>
                 <button 
                  onClick={() => user ? onStreamView(!isStreamView) : openAuth()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${isStreamView ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)] scale-[1.02]' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
                 >
                   <Crown className="w-4 h-4" />
                   AGENT STORE
                 </button>
                 <button 
                  onClick={() => user ? onHistoryView(!isHistoryView) : openAuth()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${isHistoryView ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)] scale-[1.02]' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
                 >
                   <History className="w-4 h-4" />
                   HISTORY
                 </button>
                 {downloadReady && (
                   <button 
                    onClick={() => onDownloadView(!isDownloadView)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all animate-pulse ${isDownloadView ? 'bg-emerald-500 text-slate-950 shadow-md scale-105' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'}`}
                   >
                     <Download className="w-4 h-4" />
                     DOWNLOAD 👑
                   </button>
                 )}
                 <button 
                  onClick={() => user ? setIsSupportOpen(true) : openAuth()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
                 >
                   <MessageCircle className="w-4 h-4" />
                   SUPPORT
                 </button>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
               {user && profile && (
                <div className="hidden lg:flex items-center gap-2 bg-[#111C38] px-4 py-2 rounded-xl border border-amber-500/20">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 lowercase">{profile.fullName}</span>
                </div>
              )}

              {isAdmin && !agentContext && (
                <Button 
                  variant={isAdminView ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => { onAdminView(!isAdminView); }}
                  className="px-2 h-9 relative border border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow-lg">
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
                <div className="h-9 w-20 bg-slate-800 animate-pulse rounded-lg" />
              ) : (
                <Button size="sm" onClick={() => openAuth()} className="px-4 h-10 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black hover:brightness-110 flex items-center gap-1.5 shadow-[0_2px_12px_rgba(245,158,11,0.3)] border border-amber-300/40 cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs font-black tracking-wide">LOGIN 👑</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {!agentContext && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B132B]/95 backdrop-blur-lg border-t border-amber-500/20 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] h-20">
          <div className={`grid ${isAdmin && downloadReady ? 'grid-cols-6' : (isAdmin || downloadReady ? 'grid-cols-5' : 'grid-cols-4')} h-full px-2`}>
            <button 
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${!isAdminView && !isHistoryView && !isStreamView && !isDownloadView ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
              onClick={() => { 
                onAdminView(false); 
                onHistoryView(false); 
                onStreamView(false);
                onDownloadView(false);
              }}
            >
              <Home className={`w-5 h-5 ${!isAdminView && !isHistoryView && !isStreamView && !isDownloadView ? 'stroke-[3px] text-amber-400' : 'stroke-2'}`} />
              <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
            </button>

            <button 
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${isStreamView ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
              onClick={() => { 
                if (user) onStreamView(!isStreamView); else openAuth();
              }}
            >
              <Crown className={`w-5 h-5 ${isStreamView ? 'stroke-[3px] text-amber-400' : 'stroke-2'}`} />
              <span className="text-[9px] font-black uppercase tracking-tight">Agent</span>
            </button>

            <button 
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${isHistoryView ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
              onClick={() => { 
                if (user) onHistoryView(!isHistoryView); else openAuth();
              }}
            >
              <History className={`w-5 h-5 ${isHistoryView ? 'stroke-[3px] text-amber-400' : 'stroke-2'}`} />
              <span className="text-[9px] font-black uppercase tracking-tight">History</span>
            </button>

            {downloadReady && (
              <button 
                className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 animate-pulse cursor-pointer ${isDownloadView ? 'text-emerald-400 font-bold' : 'text-emerald-500/70'}`}
                onClick={() => onDownloadView(!isDownloadView)}
              >
                <Download className={`w-5 h-5 ${isDownloadView ? 'stroke-[3px]' : 'stroke-2'}`} />
                <span className="text-[9px] font-black uppercase tracking-tight">Download</span>
              </button>
            )}

            {isAdmin && (
              <button 
                className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative cursor-pointer ${isAdminView ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
                onClick={() => onAdminView(!isAdminView)}
              >
                <LayoutDashboard className={`w-5 h-5 ${isAdminView ? 'stroke-[3px] text-amber-400' : 'stroke-2'}`} />
                <span className="text-[9px] font-black uppercase tracking-tight">Admin</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 h-4 w-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button 
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
              onClick={() => user ? setIsSupportOpen(true) : openAuth()}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-tight">Support</span>
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} profile={profile} agentContext={agentContext} />
    </>
  );
}
