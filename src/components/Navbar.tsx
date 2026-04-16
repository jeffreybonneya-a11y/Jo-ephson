import { useState, useEffect } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, LayoutDashboard, ShoppingBag, History, User, PlusCircle, Crown, Home, MessageCircle, Trophy } from 'lucide-react';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { UserProfile } from '@/src/types';
import AuthModal from './AuthModal';
import SupportModal from './SupportModal';

interface NavbarProps {
  onAdminView: (isAdmin: boolean) => void;
  onHistoryView: (isHistory: boolean) => void;
  onStreamView: (isStream: boolean) => void;
  onLeaderboardView: (isLeaderboard: boolean) => void;
  isAdminView: boolean;
  isHistoryView: boolean;
  isStreamView: boolean;
  isLeaderboardView: boolean;
  user: any;
  profile: UserProfile | null;
}

export default function Navbar({ 
  onAdminView, 
  onHistoryView, 
  onStreamView,
  onLeaderboardView,
  isAdminView, 
  isHistoryView,
  isStreamView,
  isLeaderboardView,
  user,
  profile
}: NavbarProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    if (user) {
      const adminEmails = ['jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
      setIsAdmin(adminEmails.includes(user.email || '') || profile?.role === 'admin');
      
      // Listen for unread messages if admin
      if (profile?.role === 'admin' || adminEmails.includes(user.email || '')) {
        const q = query(collection(db, 'messages'), where('status', '==', 'unread'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setUnreadCount(snapshot.size);
        });
        return () => unsubscribe();
      }
    } else {
      setIsAdmin(false);
      setUnreadCount(0);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onAdminView(false);
      onHistoryView(false);
      onLeaderboardView(false);
      onStreamView(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openAuth = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div 
            className="flex items-center gap-2 font-black text-2xl tracking-tighter cursor-pointer group" 
            onClick={() => { onAdminView(false); onHistoryView(false); onLeaderboardView(false); onStreamView(false); }}
          >
            <div className="relative">
              <Crown className="w-6 h-6 text-primary absolute -top-4 -left-2 -rotate-12 drop-shadow-md group-hover:scale-125 transition-transform" />
              <span className="bg-primary text-secondary px-3 py-1 rounded-lg shadow-lg">KING J</span>
            </div>
            <span className="text-primary drop-shadow-sm">DEALS 👑</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <Button 
              variant={!isAdminView && !isHistoryView && !isStreamView && !isLeaderboardView ? "default" : "ghost"} 
              size="sm"
              className="font-black rounded-xl gap-2"
              onClick={() => { onAdminView(false); onHistoryView(false); onStreamView(false); onLeaderboardView(false); }}
            >
              <Home className="w-4 h-4" />
              HOME
            </Button>

            <Button 
              variant={isLeaderboardView ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { onLeaderboardView(!isLeaderboardView); onAdminView(false); onHistoryView(false); onStreamView(false); }}
              className="font-black rounded-xl gap-2 text-amber-600"
            >
              <Trophy className="w-4 h-4" />
              RACE 👑
            </Button>

            {user && (
              <Button 
                variant={isStreamView ? "default" : "ghost"} 
                size="sm" 
                onClick={() => { onStreamView(!isStreamView); onAdminView(false); onHistoryView(false); onLeaderboardView(false); }}
                className="font-black rounded-xl gap-2 text-primary"
              >
                <Trophy className="w-4 h-4" />
                STREAM
              </Button>
            )}

            {user && (
              <Button 
                variant={isHistoryView ? "default" : "ghost"} 
                size="sm" 
                onClick={() => { onHistoryView(!isHistoryView); onAdminView(false); onStreamView(false); onLeaderboardView(false); }}
                className="font-black rounded-xl gap-2"
              >
                <History className="w-4 h-4" />
                HISTORY
              </Button>
            )}

            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSupportOpen(true)}
                className="font-black rounded-xl gap-2 text-slate-600 hover:text-primary"
              >
                <MessageCircle className="w-4 h-4" />
                SUPPORT
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:block text-xs font-black text-slate-400 uppercase tracking-widest">
              {user ? `${greeting}, ${profile?.fullName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Royal'}` : greeting}
            </div>

            {isAdmin && (
              <Button 
                variant={isAdminView ? "default" : "ghost"} 
                size="sm" 
                onClick={() => { onAdminView(!isAdminView); onHistoryView(false); onStreamView(false); onLeaderboardView(false); }}
                className="gap-2 relative"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Button>
            )}

            {user ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <Button size="sm" onClick={() => openAuth()} className="gap-2 bg-primary text-secondary font-black hover:bg-primary/90">
                <LogIn className="w-4 h-4" />
                LOGIN 👑
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-slate-200 pb-safe">
        <div className="grid grid-cols-5 h-20">
          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${!isAdminView && !isHistoryView && !isStreamView && !isLeaderboardView ? 'text-primary' : 'text-slate-500'}`}
            onClick={() => { 
              onAdminView(false); 
              onHistoryView(false); 
              onStreamView(false);
              onLeaderboardView(false);
              setTimeout(() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Home</span>
          </button>

          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isLeaderboardView ? 'text-amber-600' : 'text-slate-500'}`}
            onClick={() => { 
              onLeaderboardView(!isLeaderboardView); 
              onAdminView(false); 
              onHistoryView(false); 
              onStreamView(false);
            }}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Race</span>
          </button>

          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isStreamView ? 'text-primary' : 'text-slate-500'}`}
            onClick={() => { 
              if (user) {
                onStreamView(!isStreamView);
                onAdminView(false); 
                onHistoryView(false); 
                onLeaderboardView(false);
              } else {
                openAuth();
              }
            }}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Stream</span>
          </button>

          <button 
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isHistoryView ? 'text-primary' : 'text-slate-500'}`}
            onClick={() => { 
              if (user) {
                onHistoryView(!isHistoryView); 
                onAdminView(false); 
                onStreamView(false);
                onLeaderboardView(false);
              } else {
                openAuth();
              }
            }}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">History</span>
          </button>

          <button 
            className="flex flex-col items-center justify-center gap-1 text-slate-500 transition-colors"
            onClick={() => {
              if (user) {
                setIsSupportOpen(true);
              } else {
                openAuth();
              }
            }}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Support</span>
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
