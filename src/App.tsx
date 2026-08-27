import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BundleList from './components/BundleList';
import HowItWorks from './components/HowItWorks';
import CheckoutForm from './components/CheckoutForm';
import AdminDashboard from './components/AdminDashboard';
import OrderHistory from './components/OrderHistory';
import Footer from './components/Footer';
import { Bundle } from './types';
import { Toaster, toast } from 'sonner';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Zap, Loader2, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import MyOrders from './components/MyOrders';
import { UserProfile } from './types';
import AgentStore from './components/AgentStore';
import ThemeCustomizer from './components/ThemeCustomizer';
import { useTheme } from './hooks/useTheme';
import { useBranding } from './hooks/useBranding';
import { seedFC } from './lib/seed';
import TopPromosRow from './components/TopPromosRow';
import DownloadPage from './components/DownloadPage';
import PriceDropNotifier from './components/PriceDropNotifier';
import GetFreeDataWidget from './components/GetFreeDataWidget';
import { getApiUrl } from './lib/api';

export default function App() {
  const { branding } = useBranding();
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isStreamView, setIsStreamView] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcement, setAnnouncement] = useState<{text: string, active: boolean, type: string, color?: string} | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Download page state
  const [downloadReadyUrl, setDownloadReadyUrl] = useState<string | null>(null);
  const [isDownloadView, setIsDownloadView] = useState(false);

  // Agent store context
  const [agentContext, setAgentContext] = useState<any>(null);
  const [isAgentStoreView, setIsAgentStoreView] = useState(false);
  const [hasRegisteredAgent, setHasRegisteredAgent] = useState(false);

  // Theme management
  const { settings } = useTheme();

  useEffect(() => {
    if (branding.brandName) {
      document.title = `${branding.brandName} | Data Deals & Digital Hub 👑`;
    }
    if (branding.logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.logoUrl;
    }
  }, [branding]);

  useEffect(() => {
    seedFC();

    // Check for payment cancellation
    if (window.location.pathname.includes('/payment-cancelled')) {
      toast.warning("Payment was cancelled or not completed.");
      window.history.replaceState({}, document.title, "/");
    }

    // 1. Check for Paystack / Korapay Reference in URL
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref') || params.get('orderId') || params.get('order_id');
    const methodParam = params.get('method');

    if (reference) {
        toast.info("Verifying your payment, please wait...", { duration: 5000 });

        const verifyPayment = async () => {
            try {
                const isKorapay = methodParam === 'korapay' || reference.startsWith('KORA');
                const verifyEndpoint = isKorapay ? '/api/korapay-verify' : '/api/verify-payment';
                const apiUrl = getApiUrl(verifyEndpoint);
                console.log(`[Payment Verification] Sending verification request to: ${apiUrl} for reference: ${reference}`);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reference, orderId: reference })
                });

                const resData = await response.json().catch((jsonErr) => {
                    console.error("[Payment Verification] Failed to parse backend JSON response:", jsonErr);
                    return {};
                });

                console.log("[Payment Verification] Backend verification response:", resData);

                const provider = isKorapay ? 'korapay' : 'paystack';
                const method = isKorapay ? 'Korapay' : 'Paystack';
                const orderDocRef = doc(db, 'orders', reference);

                if (response.ok && resData.success && resData.verified !== false) {
                    try {
                        const orderSnap = await getDoc(orderDocRef);
                        const agentOrderDocRef = doc(db, 'agent_orders', reference);
                        const agentOrderSnap = await getDoc(agentOrderDocRef);
                        const agentData = agentOrderSnap.exists() ? agentOrderSnap.data() : null;

                        if (orderSnap.exists()) {
                            const orderData = orderSnap.data();
                            await updateDoc(orderDocRef, {
                                paymentStatus: "success",
                                status: "paid",
                                paymentMethod: orderData.paymentMethod || method,
                                payment_provider: orderData.payment_provider || provider,
                                ...(agentData ? {
                                    agentId: agentData.agent_id || orderData.agentId || orderData.agent_id,
                                    agent_id: agentData.agent_id || orderData.agent_id || orderData.agentId,
                                    wholesalePrice: agentData.wholesale_price || orderData.wholesalePrice,
                                    wholesale_price: agentData.wholesale_price || orderData.wholesale_price,
                                    agentPrice: agentData.agent_price || orderData.agentPrice,
                                    agent_price: agentData.agent_price || orderData.agent_price,
                                    profit: agentData.profit || orderData.profit,
                                    agent_profit: agentData.profit || orderData.agent_profit,
                                    isAgentOrder: true,
                                } : {})
                            });
                            if (orderData.bundle === "AGENT ACCESS UNLOCK" && orderData.userId) {
                                await updateDoc(doc(db, "users", orderData.userId), { isAgent: true });
                                toast.success("Agent Access Unlocked! Welcome 👑");
                            }
                        } else {
                            await setDoc(orderDocRef, {
                                id: reference,
                                paymentStatus: "success",
                                status: "paid",
                                paymentMethod: method,
                                payment_provider: provider,
                                createdAt: new Date(),
                                reference,
                                ...(agentData ? {
                                    agentId: agentData.agent_id,
                                    agent_id: agentData.agent_id,
                                    customerName: agentData.customer_details?.name || "Agent Customer",
                                    phone: agentData.customer_details?.phone || "",
                                    email: agentData.customer_details?.email || "",
                                    network: agentData.customer_details?.network || "Data Bundle",
                                    bundle: agentData.bundle || "Agent Store Bundle",
                                    amount: agentData.agent_price || 0,
                                    wholesalePrice: agentData.wholesale_price || 0,
                                    wholesale_price: agentData.wholesale_price || 0,
                                    agentPrice: agentData.agent_price || 0,
                                    agent_price: agentData.agent_price || 0,
                                    profit: agentData.profit || 0,
                                    agent_profit: agentData.profit || 0,
                                    isAgentOrder: true,
                                } : {})
                            }, { merge: true });
                        }

                        if (agentOrderSnap.exists()) {
                            await updateDoc(agentOrderDocRef, {
                                paymentStatus: "success",
                                status: "success"
                            });
                        }
                    } catch (fsErr) {
                        console.warn("[Payment Verification] Firestore client update:", fsErr);
                    }

                    toast.success("Payment Successful ✅");
                    setIsHistoryView(true); // Take user to view their orders
                    try {
                      if (window.location.hostname !== 'kingjdeals.onrender.com' && window.location.hostname !== 'king-j-deals.onrender.com') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                      } else {
                        window.history.replaceState({}, document.title, "/");
                      }
                    } catch (histErr) {
                      console.warn("[Payment Verification] History state update notice:", histErr);
                    }
                } else {
                    console.warn("[Payment Verification] Payment not completed or was cancelled:", resData);
                    try {
                        await setDoc(orderDocRef, {
                            paymentStatus: "failed",
                            status: "failed",
                            paymentMethod: method,
                            payment_provider: provider
                        }, { merge: true });
                    } catch (fsErr) {
                        console.warn("[Payment Verification] Failed to mark order failed in Firestore:", fsErr);
                    }

                    toast.error(resData.error || "Payment was cancelled or unsuccessful.");
                    try {
                        window.history.replaceState({}, document.title, "/");
                    } catch (histErr) {
                        console.warn("[Payment Verification] History state error:", histErr);
                    }
                }
            } catch (err: any) {
                console.error("[Payment Verification Error] Request failed:", err.message || err);
                toast.error("Unable to complete payment verification. Please check your orders page.");
                try {
                    window.history.replaceState({}, document.title, "/");
                } catch (fallbackErr) {
                    console.warn("[Payment Verification] History fallback error:", fallbackErr);
                }
            }
        };
        
        verifyPayment();
    }

    let profileUnsubscribe: (() => void) | undefined;
    let agentUnsubscribe: (() => void) | undefined;

    // Fetch announcement
    const unsubAnnouncement = onSnapshot(doc(db, 'settings', 'announcement'), (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncement(snapshot.data() as any);
      }
    });

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthLoading(false);
      const adminEmails = ['kingjdeals@gmail.com', 'jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
      const userIsAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;
      setIsAdmin(userIsAdmin);
      
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }
      if (agentUnsubscribe) {
        agentUnsubscribe();
        agentUnsubscribe = undefined;
      }

      if (user && !user.isAnonymous) {
        // Ensure user profile in Firestore
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then((snap) => {
          const isEmailAdmin = adminEmails.includes(user.email?.toLowerCase() || '');
          const userFullName = user.displayName || (user.email ? user.email.split('@')[0] : "Customer");
          const userUsername = user.displayName ? user.displayName.toLowerCase().replace(/\s+/g, '_') : (user.email ? user.email.split('@')[0] : "customer");
          
          if (!snap.exists()) {
            setDoc(userRef, {
              uid: user.uid,
              id: user.uid,
              email: user.email || '',
              gmail: user.email || '',
              fullName: userFullName,
              displayName: user.displayName || userFullName,
              username: userUsername,
              role: isEmailAdmin ? 'admin' : 'user',
              walletBalance: 0,
              photoURL: user.photoURL || '',
              topupReference: 'KJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            }, { merge: true }).catch(console.error);
          } else {
            const data = snap.data();
            const updates: any = {};
            if (!data.email && user.email) updates.email = user.email;
            if (!data.gmail && user.email) updates.gmail = user.email;
            if (!data.fullName && userFullName) updates.fullName = userFullName;
            if (!data.displayName && user.displayName) updates.displayName = user.displayName;
            if (!data.username && userUsername) updates.username = userUsername;
            if (!data.id) updates.id = user.uid;
            if (user.photoURL && !data.photoURL) updates.photoURL = user.photoURL;
            if (isEmailAdmin && data.role !== 'admin') updates.role = 'admin';
            if (Object.keys(updates).length > 0) {
              setDoc(userRef, updates, { merge: true }).catch(console.error);
            }
          }
        }).catch(console.error);

        // Real-time profile listener
        profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserProfile;
            setProfile(data);
            const isEmailAdmin = adminEmails.includes(user.email?.trim().toLowerCase() || '') || 
                                 adminEmails.includes(data.email?.trim().toLowerCase() || '') || 
                                 adminEmails.includes(data.gmail?.trim().toLowerCase() || '') || 
                                 data.role === 'admin';
            setIsAdmin(isEmailAdmin);
          }
        });

        // Real-time agent listener
        agentUnsubscribe = onSnapshot(doc(db, 'agents', user.uid), (docSnapshot) => {
          setHasRegisteredAgent(docSnapshot.exists());
        }, (error) => {
          // Fallback handle Firestore error according to skill
          console.error("Agent listener error: ", error);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setHasRegisteredAgent(false);
      }
    });

    return () => {
      authUnsubscribe();
      unsubAnnouncement();
      if (profileUnsubscribe) profileUnsubscribe();
      if (agentUnsubscribe) agentUnsubscribe();
    };
  }, []);

  // Listen for PC Games delivery
  useEffect(() => {
    let ordersUnsub: (() => void) | undefined;
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        where('network', '==', 'PC Games')
      );
      
      ordersUnsub = onSnapshot(q, (snapshot) => {
        let hasDelivered = false;
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'delivered') {
            if (data.network === "PC Games" || (data.bundle && data.bundle.includes("FC 26"))) {
              hasDelivered = true;
            }
          }
        });
        
        if (hasDelivered) {
          setDownloadReadyUrl("https://mega.nz/folder/8VxmSKwa#UmP1qPm5PaSvMfGTbBFvCQ");
          // Only force the view if it wasn't already delivered (e.g. first time it appears)
          setIsDownloadView(prev => {
            if (!downloadReadyUrl) return true;
            return prev;
          });
        } else {
          setDownloadReadyUrl(null);
          setIsDownloadView(false);
        }
      });
    }
    return () => {
      if (ordersUnsub) ordersUnsub();
    };
  }, [user, isAdminView]);

  // Separate effect for Agent Store check
  useEffect(() => {
    const handleAgentStoreNav = () => {
      setIsStreamView(true);
      setIsAdminView(false);
      setIsHistoryView(false);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('NAVIGATE_TO_AGENT_STORE', handleAgentStoreNav);

    const path = window.location.pathname;
    const match = path.match(/^\/store\/([a-zA-Z0-9_\-]+)$/);
    const searchParams = new URLSearchParams(window.location.search);
    const slug = match ? match[1] : searchParams.get('agent');

    if (slug) {
      setIsAgentStoreView(true);
      const q = query(collection(db, 'agents'), where('agent_slug', '==', slug));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setAgentContext({ id: docSnap.id, ...docSnap.data() });
        } else {
          setAgentContext(null);
        }
      });
      return () => {
        unsubscribe();
        window.removeEventListener('NAVIGATE_TO_AGENT_STORE', handleAgentStoreNav);
      };
    }

    return () => {
      window.removeEventListener('NAVIGATE_TO_AGENT_STORE', handleAgentStoreNav);
    };
  }, []);

  const [activeService, setActiveService] = useState('data');

  const handleSelectBundle = (bundle: Bundle) => {
    const activeUser = user || auth.currentUser;
    if (!activeUser || activeUser.isAnonymous) {
      toast.error("Please log in before you can purchase any service! 👑", {
        description: "You must be signed in to purchase data bundles, game coins, PC games, or results checkers.",
      });
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      return;
    }
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
            announcement.color === 'red' ? 'bg-red-500 text-white' :
            announcement.color === 'yellow' ? 'bg-yellow-500 text-black' :
            announcement.color === 'green' ? 'bg-green-500 text-white' :
            announcement.color === 'blue' ? 'bg-blue-500 text-white' :
            announcement.color === 'primary' ? 'bg-primary text-primary-foreground' :
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
        onAdminView={(v) => { setIsAdminView(v); setIsHistoryView(false); setIsStreamView(false); setIsDownloadView(false); }} 
        onHistoryView={(v) => { setIsHistoryView(v); setIsAdminView(false); setIsStreamView(false); setIsDownloadView(false); }}
        onStreamView={(v) => { setIsStreamView(v); setIsAdminView(false); setIsHistoryView(false); setIsDownloadView(false); }}
        onDownloadView={(v) => { setIsDownloadView(v); setIsAdminView(false); setIsHistoryView(false); setIsStreamView(false); }}
        isAdminView={isAdminView}
        isHistoryView={isHistoryView}
        isStreamView={isStreamView}
        isDownloadView={isDownloadView}
        downloadReady={!!downloadReadyUrl}
        isAdmin={isAdmin}
        user={user}
        profile={profile}
        isAuthLoading={isAuthLoading}
        agentContext={agentContext}
      />
      
      <main>
        {isDownloadView && downloadReadyUrl ? (
          <DownloadPage 
            url={downloadReadyUrl} 
            onBack={() => setIsDownloadView(false)} 
          />
        ) : isAgentStoreView ? (
          agentContext ? (
            <div className="min-h-screen">
              <div className="pt-24 pb-12 text-center bg-gradient-to-b from-primary/5 to-transparent">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest mb-6 shadow-lg">
                  <Crown className="w-4 h-4 text-primary" />
                  VERIFIED ROYAL AGENT
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-4 dark:text-white uppercase tracking-tight">
                  {agentContext.agent_name.toUpperCase()}'S DEALS 👑
                </h1>
                <p className="text-slate-500 font-bold max-w-xl mx-auto text-base md:text-lg">
                  Welcome to my store! Tap any bundle below to purchase with instant auto-delivery.
                </p>
              </div>
              <BundleList onSelectBundle={handleSelectBundle} agentContext={agentContext} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-slate-500 font-black text-xs tracking-[0.2em] animate-pulse">LOADING AGENT STORE...👑</p>
            </div>
          )
        ) : isAdminView && isAdmin ? (
          <AdminDashboard />
        ) : isHistoryView && user ? (
          <MyOrders />
        ) : isStreamView && user ? (
          <AgentStore profile={profile} onSelectBundle={handleSelectBundle} />
        ) : (
          <>
            <div className="bg-[#0B132B] pt-20 sm:pt-24 pb-2 relative z-20">
              <TopPromosRow />
            </div>
            <Hero />
            <BundleList onSelectBundle={handleSelectBundle} isAgentUser={hasRegisteredAgent || !!profile?.isAgent} />
          </>
        )}
      </main>

      <CheckoutForm 
        bundle={selectedBundle} 
        onClose={() => setSelectedBundle(null)} 
        profile={profile}
        agentContext={agentContext}
        isAgentUser={hasRegisteredAgent || !!profile?.isAgent}
      />
      
      <Footer />
      <ThemeCustomizer />

      {/* Movable WhatsApp Buttons */}
      <div className="fixed bottom-48 md:bottom-24 right-6 z-50 flex flex-col gap-4 pointer-events-none">
        {agentContext ? (
          <motion.a 
            drag
            dragConstraints={{ left: -300, right: 0, top: -600, bottom: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            href={`https://wa.me/233${agentContext.momo_number ? agentContext.momo_number.trim().replace(/^0/, '') : ''}?text=${encodeURIComponent(`Hello, I'm visiting your store on King J Deals! 👑`)}`} 
            target="_blank" 
            rel="noreferrer"
            className="pointer-events-auto flex items-center gap-3 bg-[#25D366] text-white px-4 md:px-6 py-3 md:py-4 rounded-full shadow-[0_10px_40px_rgba(37,211,102,0.4)] hover:scale-110 transition-all group active:scale-95 cursor-move uppercase"
            style={{ touchAction: 'none' }}
          >
            <div className="relative">
              <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
            </div>
            <span className="font-black text-sm md:text-lg">CHAT WITH {agentContext.agent_name || 'AGENT'} 👑</span>
          </motion.a>
        ) : (
          <>
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
          </>
        )}
      </div>
      <PriceDropNotifier />
      <GetFreeDataWidget />
    </div>
  );
}
