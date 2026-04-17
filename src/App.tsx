import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BundleList from './components/BundleList';
import HowItWorks from './components/HowItWorks';
import CheckoutForm from './components/CheckoutForm';
import AdminDashboard from './components/AdminDashboard';
import OrderHistory from './components/OrderHistory';
import StreamPortal from './components/StreamPortal';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import { Bundle } from './types';
import { Toaster, toast } from 'sonner';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { MessageSquare, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from './types';

export default function App() {
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isStreamView, setIsStreamView] = useState(false);
  const [isLeaderboardView, setIsLeaderboardView] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcement, setAnnouncement] = useState<{text: string, active: boolean, type: string} | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    // Fetch announcement
    const unsubAnnouncement = onSnapshot(doc(db, 'settings', 'announcement'), (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncement(snapshot.data() as any);
      }
    });

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthLoading(false);
      const adminEmails = ['jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
      let userIsAdmin = false;
      
      if (user?.email) {
         userIsAdmin = adminEmails.includes(user.email.toLowerCase());
      }
      setIsAdmin(userIsAdmin);
      
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }

      if (user) {
        // Real-time profile listener
        profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserProfile;
            setProfile(data);
            const isEmailAdmin = adminEmails.includes(user.email?.toLowerCase() || '');
            setIsAdmin(data.role === 'admin' || isEmailAdmin);
          }
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => {
      authUnsubscribe();
      unsubAnnouncement();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const handleSelectBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle);
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Toaster position="top-center" richColors />
      
      {announcement?.active && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className={`py-2 px-4 text-center font-bold text-sm relative z-[60] shadow-sm ${
            announcement.type === 'discount' ? 'bg-primary text-white' :
            announcement.type === 'alert' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="container mx-auto flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 animate-pulse" />
            <span>{announcement.text}</span>
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
        </motion.div>
      )}

      <Navbar 
        onAdminView={setIsAdminView} 
        onHistoryView={setIsHistoryView}
        onStreamView={setIsStreamView}
        onLeaderboardView={setIsLeaderboardView}
        isAdminView={isAdminView}
        isHistoryView={isHistoryView}
        isStreamView={isStreamView}
        isLeaderboardView={isLeaderboardView}
        user={user}
        profile={profile}
        isAuthLoading={isAuthLoading}
      />
      
      <main>
        {isAdminView && isAdmin ? (
          <AdminDashboard />
        ) : isHistoryView && user ? (
          <OrderHistory />
        ) : isStreamView && user ? (
          <StreamPortal />
        ) : isLeaderboardView ? (
          <Leaderboard />
        ) : (
          <>
            <Hero />
            <HowItWorks />
            <BundleList onSelectBundle={handleSelectBundle} />
          </>
        )}
      </main>

      <CheckoutForm 
        bundle={selectedBundle} 
        onClose={() => setSelectedBundle(null)} 
        profile={profile}
      />
      
      <Footer />

      {/* Movable WhatsApp Buttons */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-4 pointer-events-none">
        
        <motion.a 
          drag
          dragConstraints={{ left: -300, right: 0, top: -600, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          href="https://wa.me/233535884851" 
          target="_blank" 
          rel="noreferrer"
          className="pointer-events-auto flex items-center gap-3 bg-[#25D366] text-white px-4 md:px-6 py-3 md:py-4 rounded-full shadow-[0_10px_40px_rgba(37,211,102,0.4)] hover:scale-110 transition-all group active:scale-95 cursor-move"
          style={{ touchAction: 'none' }}
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
          </div>
          <span className="font-black text-sm md:text-lg">CHAT WITH KING J 👑</span>
        </motion.a>

        <motion.a 
          drag
          dragConstraints={{ left: -300, right: 0, top: -600, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          href="https://wa.me/233541557530" 
          target="_blank" 
          rel="noreferrer"
          className="pointer-events-auto flex items-center gap-3 bg-[#25D366] text-white px-4 md:px-6 py-3 md:py-4 rounded-full shadow-[0_10px_40px_rgba(37,211,102,0.4)] hover:scale-110 transition-all group active:scale-95 cursor-move"
          style={{ touchAction: 'none' }}
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-ping" />
          </div>
          <span className="font-black text-sm md:text-lg">CHAT WITH YHAW 👑</span>
        </motion.a>
      </div>
    </div>
  );
}
