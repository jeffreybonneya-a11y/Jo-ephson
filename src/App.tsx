import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BundleList from './components/BundleList';
import CheckoutForm from './components/CheckoutForm';
import AdminDashboard from './components/AdminDashboard';
import OrderHistory from './components/OrderHistory';
import StreamPortal from './components/StreamPortal';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import { Bundle } from './types';
import { Toaster } from 'sonner';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { MessageSquare, Zap, Crown } from 'lucide-react';
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
      const adminEmails = ['jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
      setIsAdmin(adminEmails.includes(user?.email || ''));
      
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
            setIsAdmin(data.role === 'admin' || adminEmails.includes(user.email || ''));
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
            <BundleList onSelectBundle={setSelectedBundle} />
            
            {/* How it Works */}
            <section className="py-24 bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="container relative mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">HOW IT <span className="text-primary">WORKS</span> 👑</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    Follow these <span className="text-primary font-bold">Royal Steps</span> to get your data instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    {
                      step: "1",
                      title: "Pick Your Deal",
                      desc: "Select your preferred network and data bundle from our royal list.",
                      color: "bg-blue-500/10 text-blue-600"
                    },
                    {
                      step: "2",
                      title: "Send Payment",
                      desc: "Follow the payment instructions shown. Send the exact amount to our MoMo number.",
                      color: "bg-purple-500/10 text-purple-600"
                    },
                    {
                      step: "3",
                      title: "Confirm Order",
                      desc: "Enter your transaction reference and recipient number, then tap 'I have sent the money'.",
                      color: "bg-amber-500/10 text-amber-600"
                    },
                    {
                      step: "4",
                      title: "Get Your Data",
                      desc: "Wait for admin verification. Once confirmed, your data is delivered instantly! 👑",
                      color: "bg-green-500/10 text-green-600"
                    }
                  ].map((item, i) => (
                    <div key={i} className="relative group p-8 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all hover:shadow-xl">
                      <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-3xl font-black mb-6 group-hover:scale-110 transition-transform`}>
                        {item.step}
                      </div>
                      <h3 className="text-2xl font-black mb-4 text-slate-900">{item.title} 👑</h3>
                      <p className="text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                      {i < 3 && (
                        <div className="hidden md:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 text-primary/20">
                          <Zap className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
