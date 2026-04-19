import { useState, useEffect } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, LayoutDashboard, ShoppingBag, History, User, PlusCircle, Crown, Home, MessageCircle, Trophy, Plus, Zap, Tv, HeadphonesIcon } from 'lucide-react';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { UserProfile } from '@/src/types';
import AuthModal from './AuthModal';
import SupportModal from './SupportModal';

interface NavbarProps {
  onAdminView: (isAdmin: boolean) => void;
  onHistoryView: (isHistory: boolean) => void;
  onStreamView: (isStream: boolean) => void;
  isAdminView: boolean;
  isHistoryView: boolean;
  isStreamView: boolean;
  isAdmin: boolean;
  user: any;
  profile: UserProfile | null;
  isAuthLoading?: boolean;
}

export default function Navbar({ 
  onAdminView, 
  onHistoryView, 
  onStreamView,
  isAdminView, 
  isHistoryView,
  isStreamView,
  isAdmin,
  user,
  profile,
  isAuthLoading
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

      // Listen for open complaints (support messages)
      const qMessages = query(collection(db, 'complaints'), where('status', '==', 'open'));
      const unsubMessages = onSnapshot(qMessages, (snapshot) => {
        messagesCount = snapshot.size;
        setUnreadCount(messagesCount + ordersCount);
      });

      // Listen for pending orders
      const qOrders = query(collection(db, 'orders'), where('status', '==', 'pending'));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        ordersCount = snapshot.size;
        setUnreadCount(messagesCount + ordersCount);
      });

      return () => {
        unsubMessages();
        unsubOrders();
      };
    } else {
      setUnreadCount(0);
    }
  }, [user, profile, isAdmin]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onAdminView(false);
      onHistoryView(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openAuth = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 md:h-20 items-center justify-between">
            <div 
              className="flex items-center font-black text-xl md:text-2xl tracking-tighter cursor-pointer group shrink-0" 
              onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); }}
            >
              <div className="relative flex items-center">
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-primary absolute -top-4 -left-3 -rotate-12 drop-shadow-md group-hover:scale-125 transition-transform z-10" />
                <span className="bg-primary text-secondary px-3 py-1 rounded-xl shadow-lg">KING J DEALS</span>
                <span className="text-primary drop-shadow-sm ml-2 text-xl md:text-2xl">👑</span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60">
               <button 
                onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${!isAdminView && !isHistoryView && !isStreamView ? 'bg-primary text-secondary shadow-md scale-105' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
               >
                 <Home className="w-4 h-4" />
                 HOME
               </button>
               <button 
                onClick={() => user ? onStreamView(!isStreamView) : openAuth()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${isStreamView ? 'bg-primary text-secondary shadow-md scale-105' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
               >
                 <Crown className="w-4 h-4" />
                 AGENT STORE
               </button>
               <button 
                onClick={() => user ? onHistoryView(!isHistoryView) : openAuth()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${isHistoryView ? 'bg-primary text-secondary shadow-md scale-105' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
               >
                 <History className="w-4 h-4" />
                 HISTORY
               </button>
               <button 
                onClick={() => user ? setIsSupportOpen(true) : openAuth()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
               >
                 <MessageCircle className="w-4 h-4" />
                 SUPPORT
               </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
               {user && profile && (
                <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black text-slate-800 lowercase opacity-80">{profile.fullName}</span>
                </div>
              )}

              {isAdmin && (
                <Button 
                  variant={isAdminView ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => { onAdminView(!isAdminView); }}
                  className="px-2 h-9 relative"
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
                <Button variant="outline" size="sm" onClick={handleLogout} className="px-2 h-9">
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : isAuthLoading ? (
                <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <Button size="sm" onClick={() => openAuth()} className="px-3 h-10 bg-primary text-secondary font-black hover:bg-primary/90 flex items-center gap-1 shadow-lg">
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs">LOGIN 👑</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Dynamic 4 or 5 Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-slate-200 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.06)] h-20">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} h-full px-2`}>
          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${!isAdminView && !isHistoryView && !isStreamView ? 'text-primary' : 'text-slate-400'}`}
            onClick={() => { 
              onAdminView(false); 
              onHistoryView(false); 
              onStreamView(false);
              setTimeout(() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            <Home className={`w-5 h-5 ${!isAdminView && !isHistoryView && !isStreamView ? 'stroke-[3px]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
          </button>

          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isStreamView ? 'text-primary' : 'text-slate-400'}`}
            onClick={() => { 
              if (user) {
                onStreamView(!isStreamView); 
              } else {
                openAuth();
              }
            }}
          >
            <Crown className={`w-5 h-5 ${isStreamView ? 'stroke-[3px]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-tight">Agent Store</span>
          </button>

          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isHistoryView ? 'text-primary' : 'text-slate-400'}`}
            onClick={() => { 
              if (user) {
                onHistoryView(!isHistoryView); 
              } else {
                openAuth();
              }
            }}
          >
            <History className={`w-5 h-5 ${isHistoryView ? 'stroke-[3px]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-tight">History</span>
          </button>

          {isAdmin && (
            <button 
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative ${isAdminView ? 'text-primary' : 'text-slate-400'}`}
              onClick={() => {
                onAdminView(!isAdminView);
              }}
            >
              <LayoutDashboard className={`w-5 h-5 ${isAdminView ? 'stroke-[3px]' : 'stroke-2'}`} />
              <span className="text-[9px] font-black uppercase tracking-tight">Admin</span>
              {unreadCount > 0 && (
                <span className="absolute top-3 right-5 h-4 w-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button 
            className="flex flex-col items-center justify-center gap-1 text-slate-400 transition-all active:scale-95"
            onClick={() => {
              if (user) {
                setIsSupportOpen(true);
              } else {
                openAuth();
              }
            }}
          >
            <HeadphonesIcon className="w-5 h-5 stroke-2" />
            <span className="text-[9px] font-black uppercase tracking-tight">Support</span>
          </button>
        </div>
      </div>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      {profile && (
        <SupportModal 
          isOpen={isSupportOpen} 
          onClose={() => setIsSupportOpen(false)} 
          profile={profile}
        />
      )}
    </>
  );
}
