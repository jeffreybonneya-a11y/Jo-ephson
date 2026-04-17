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
import emailjs from '@emailjs/browser';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { MessageSquare, Zap, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from './types';

import SuccessPage from './pages/Success';

export default function App() {
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isStreamView, setIsStreamView] = useState(false);
  const [isLeaderboardView, setIsLeaderboardView] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcement, setAnnouncement] = useState<{text: string, active: boolean, type: string} | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [siteStatus, setSiteStatus] = useState<'ok'|'low'>('ok');

  useEffect(() => {
    // Check global site status and balance
    fetch('/api/site-status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'low') {
          setSiteStatus('low');
          // Check throttle in localStorage before sending email (1 hour = 3600000ms)
          const lastAlert = localStorage.getItem('lastLowBalanceAlert');
          const now = Date.now();
          if (!lastAlert || now - parseInt(lastAlert) > 3600000) {
             localStorage.setItem('lastLowBalanceAlert', now.toString());
             
             const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
             const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
             const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
             
             if (serviceId && templateId && publicKey) {
               emailjs.send(serviceId, templateId, {
                 to_name: "Admins (King J & Yhaw)",
                 customer_name: "SYSTEM ALERT",
                 order_id: "N/A",
                 service_name: "LOW WALLET BALANCE",
                 amount: "N/A",
                 reference: "N/A",
                 recipient_info: "N/A",
                 customer_email: "system@kingjdeals.com",
                 site_name: "King J Deals Site 👑",
                 admin_emails: "jeffreybonneya@gmail.com, emmagyapong62@gmail.com",
                 message: "⚠️ King J Deals — Low Wallet Balance Alert. Your GigsHub wallet balance has dropped below GHS 1. Please top up immediately to avoid failed orders."
               }, publicKey).catch(console.error);
             }
          }
        }
      })
      .catch(console.error);

    // Handle Paystack callback parameter when users are redirected directly
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    
    if (reference && typeof reference === 'string') {
      // Show success page
      setPaymentReference(reference);
      // Clean up the URL to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
    }

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
    if (siteStatus === 'low') {
       toast.error("⚠️ Service temporarily unavailable. Please try again later.");
       return;
    }
    setSelectedBundle(bundle);
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Toaster position="top-center" richColors />
      
      {siteStatus === 'low' && (
        <div className="py-3 px-4 text-center font-black text-sm md:text-base bg-red-600 text-white relative z-[70] shadow-md flex items-center justify-center gap-2 animate-pulse">
           <span>⚠️ Service temporarily unavailable. Please try again later.</span>
        </div>
      )}

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
        {paymentReference ? (
          <SuccessPage reference={paymentReference} onReturn={() => setPaymentReference(null)} />
        ) : isAdminView && isAdmin ? (
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
