import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Crown, Key, Loader2, Store, Activity, Settings, DollarSign, Wallet, Copy, Save, User, UserCheck, AlertTriangle, Check, ArrowRight, FileText, Send, Search, MessageSquare, GraduationCap } from 'lucide-react';
import MyOrders from './MyOrders';
import { Bundle } from '../types';
import { getApiUrl } from '../lib/api';
import { openPaystackPopup } from '../lib/paystack';

interface AgentStoreProps {
  profile: any;
  onSelectBundle: (bundle: Bundle) => void;
}

const parseDataAmountToMB = (amountStr: string): number => {
  if (!amountStr) return 0;
  const norm = amountStr.trim().toLowerCase();
  const numMatch = norm.match(/([\d.,]+)/);
  if (!numMatch) return 0;
  const val = parseFloat(numMatch[1].replace(/,/g, ''));
  if (norm.includes('m')) {
    return val;
  }
  if (norm.includes('t')) {
    return val * 1024 * 1024;
  }
  // Default to GB
  return val * 1024;
};

export default function AgentStore({ profile, onSelectBundle }: AgentStoreProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Firestore local state
  const [agent, setAgent] = useState<any>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [profitRequests, setProfitRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regMomoName, setRegMomoName] = useState('');
  const [regMomoNumber, setRegMomoNumber] = useState('');

  // Editing profile Form State
  const [editName, setEditName] = useState('');
  const [editMomoName, setEditMomoName] = useState('');
  const [editMomoNumber, setEditMomoNumber] = useState('');

  // Price setup states
  const [customPrices, setCustomPrices] = useState<{ [bundleId: string]: string }>({});

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // 1. Fetch user-agent details
  useEffect(() => {
    if (!auth.currentUser) {
      setLoadingAgent(false);
      return;
    }

    const unsubAgent = onSnapshot(doc(db, 'agents', auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAgent(data);
        setEditName(data.agent_name || '');
        setEditMomoName(data.momo_name || '');
        setEditMomoNumber(data.momo_number || '');
        
        // Load custom prices
        const priceMap: { [bundleId: string]: string } = {};
        if (data.prices) {
          Object.keys(data.prices).forEach((key) => {
            priceMap[key] = String(data.prices[key]);
          });
        }
        setCustomPrices(old => ({ ...priceMap, ...old }));
      } else {
        setAgent(null);
      }
      setLoadingAgent(false);
    });

    const qWithdrawals = query(
      collection(db, 'profit_requests'), 
      where('agent_id', '==', auth.currentUser.uid)
    );
    const unsubWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProfitRequests(requests.sort((a: any, b: any) => b.created_at?.seconds - a.created_at?.seconds));
    });

    // Fetch master bundles to let Agent override prices
    const unsubBundles = onSnapshot(collection(db, 'bundles'), (snapshot) => {
      const allBundles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bundle[];
       const filtered = allBundles.filter((b) => {
        if (!b.active) return false;
        if (b.network === "Telecel") {
          const amountStr = String(b.dataAmount || b.name || "");
          const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
          if (gbMatch) {
            const gbValue = parseFloat(gbMatch[1]);
            if (gbValue >= 1 && gbValue <= 5) {
              return false;
            }
          }
        }
        return true;
      });
      setBundles(filtered);
      setLoadingBundles(false);
    });

    // Subscribe to orders generated by this agent storefront
    const qOrders = query(
      collection(db, 'orders'),
      where('agent_id', '==', auth.currentUser.uid)
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort orders by timestamp descending
      fetchedOrders.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || Date.now() / 1000;
        const timeB = b.createdAt?.seconds || Date.now() / 1000;
        return timeB - timeA;
      });
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    }, (error) => {
      console.error("Orders sync error:", error);
      setLoadingOrders(false);
    });

    return () => {
      unsubAgent();
      unsubWithdrawals();
      unsubBundles();
      unsubOrders();
    };
  }, []);

  const handlePayForAccess = async () => {
    if (!auth.currentUser) return;
    
    setIsPaying(true);

    try {
      // 1. Generate ID synchronously client-side
      const finalOrderId = doc(collection(db, 'orders')).id;

      // 2. Save order details properly in Firestore for admin to accept instantly
      await setDoc(doc(db, 'orders', finalOrderId), {
        email: profile?.email || auth.currentUser?.email || '',
        phone: profile?.phoneNumber || "0000000000",
        network: "SYSTEM",
        bundle: "AGENT ACCESS UNLOCK",
        amount: 50,
        status: "pending",
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid,
        customerName: profile?.fullName || auth.currentUser?.displayName || 'Aspiring Agent',
        reference: "MANUAL-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        paymentStatus: "pending"
      });

      // Show immediate feedback to user that the order has reached the admin
      toast.success("Request registered on Dashboard! Opening Paystack... 👑");

      try {
          const paystackEmail = (profile?.email && profile.email.includes("@")) 
            ? profile.email 
            : ((auth.currentUser?.email && auth.currentUser.email.includes("@")) 
                ? auth.currentUser.email 
                : "customer@kingjdeals.com");

          // Dynamic Public Key retrieval
          let publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
          try {
            const pkRes = await fetch(getApiUrl("/api/paystack-public-key"));
            if (pkRes.ok) {
              const pkData = await pkRes.json();
              if (pkData.publicKey) {
                publicKey = pkData.publicKey;
              }
            }
          } catch (pkErr) {
            console.warn("Could not retrieve Paystack public key dynamically:", pkErr);
          }

          try {
            toast.info("Launching secure checkout... 👑");
            await openPaystackPopup({
              key: publicKey,
              email: paystackEmail,
              amount: 5000,
              currency: "GHS",
              ref: finalOrderId,
              onSuccess: (ref) => {
                toast.success("Payment completed successfully! Verifying... 👑");
                // Redirect to callback URL to trigger uniform verification & success handling in App.tsx
                window.location.href = window.location.origin + "/?reference=" + ref;
              },
              onClose: () => {
                toast.warning("Payment window closed.");
                setIsPaying(false);
              }
            });
          } catch (popError) {
            console.warn("Paystack Inline popup failed or blocked. Falling back to secure redirect mode:", popError);

            // Fallback to server-side redirect initialization
            const initResponse = await fetch(getApiUrl("/api/paystack-initialize"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: paystackEmail,
                amount: 5000,
                reference: finalOrderId,
                callback_url: window.location.origin + "/?reference=" + finalOrderId,
                currency: "GHS",
              }),
            });

            if (!initResponse.ok) {
              throw new Error("Failed to initialize payment gateway on server");
            }

            const initData = await initResponse.json();
            if (initData.success && initData.authorization_url) {
              toast.success("Redirecting to secure payment page... 👑");
              if (window.self !== window.top) {
                try {
                  window.top.location.href = initData.authorization_url;
                } catch (redirectError) {
                  console.warn("Top-level redirection blocked. Falling back to iframe navigation:", redirectError);
                  window.location.href = initData.authorization_url;
                }
              } else {
                window.location.href = initData.authorization_url;
              }
            } else {
              throw new Error(initData.error || "Failed to retrieve redirection URL");
            }
          }
        } catch (paystackError) {
          console.error("Paystack initialization error:", paystackError);
          throw paystackError;
        }
      } catch (err) {
        console.error("Agent pre-order error:", err);
        // Quietly handle error without displaying any error toasts!
      } finally {
        setIsPaying(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!regName.trim() || !regMomoName.trim() || !regMomoNumber.trim()) {
      toast.error("All registration fields are required! 👑");
      return;
    }

    if (!/^0\d{9}$/.test(regMomoNumber.trim())) {
      toast.error("Mobile Money Number must be 10 digits starting with 0.");
      return;
    }

    setIsRegistering(true);

    try {
      // 1. Generate unique slug
      let baseSlug = regName.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      if (!baseSlug) {
        baseSlug = "agent-" + auth.currentUser.uid.slice(0, 5);
      }

      // Check uniqueness of slug
      const q = query(collection(db, 'agents'), where('agent_slug', '==', baseSlug));
      const querySnap = await getDocs(q);
      let finalSlug = baseSlug;
      if (!querySnap.empty) {
        // Append random suffix
        finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      // Create Agent Record
      await setDoc(doc(db, 'agents', auth.currentUser.uid), {
        id: auth.currentUser.uid,
        agent_name: regName.trim(),
        agent_slug: finalSlug,
        momo_name: regMomoName.trim(),
        momo_number: regMomoNumber.trim(),
        profit_balance: 0,
        created_at: serverTimestamp(),
        prices: {}
      });

      // Also ensure the user document reflects isAgent: true
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { isAgent: true });

      toast.success(`Welcome Agent ${regName.trim()} 🎉! Your store is now active.`);
    } catch (err) {
      console.error("Agent registration error:", err);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !agent) return;

    if (!editName.trim() || !editMomoName.trim() || !editMomoNumber.trim()) {
      toast.error("Fields cannot be empty.");
      return;
    }

    if (!/^0\d{9}$/.test(editMomoNumber.trim())) {
      toast.error("MoMo Number must start with 0 and have 10 digits.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'agents', auth.currentUser.uid), {
        agent_name: editName.trim(),
        momo_name: editMomoName.trim(),
        momo_number: editMomoNumber.trim()
      });
      toast.success("Profile specifications updated successfully! 👑");
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrice = async (bundleId: string, wholesalePrice: number) => {
    if (!auth.currentUser || !agent) return;
    
    const inputVal = customPrices[bundleId];
    if (inputVal === undefined) return;

    const parsedPrice = Number(inputVal);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    if (parsedPrice < wholesalePrice) {
      toast.error("Price cannot be lower than wholesale price.");
      return;
    }

    try {
      const updatedPrices = { ...(agent.prices || {}), [bundleId]: parsedPrice };
      await updateDoc(doc(db, 'agents', auth.currentUser.uid), {
        prices: updatedPrices
      });
      toast.success("Store pricing updated successfully! 👑");
    } catch (err) {
      console.error("Save price error:", err);
      toast.error("Failed to save pricing setup.");
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !agent) return;

    const parsedAmount = Number(withdrawAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please specify a valid withdrawal amount.");
      return;
    }

    if (parsedAmount > agent.profit_balance) {
      toast.error("Insufficient profit balance for this withdrawal.");
      return;
    }

    window.alert(`You will receive GHS ${parsedAmount.toFixed(2)} in sometime and if any delay you can contact the admin.`);

    setIsWithdrawing(true);

    try {
      // Check for any pending profit requests to prevent redundant floods
      const qPending = query(
        collection(db, 'profit_requests'),
        where('agent_id', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
      );
      const pendingSnap = await getDocs(qPending);
      if (!pendingSnap.empty) {
        toast.error("You already have an active pending withdrawal request! Please wait for approval first.");
        setIsWithdrawing(false);
        return;
      }

      await addDoc(collection(db, 'profit_requests'), {
        agent_id: auth.currentUser.uid,
        agent_name: agent.agent_name,
        momo_name: agent.momo_name,
        momo_number: agent.momo_number,
        withdrawal_amount: parsedAmount,
        status: 'pending',
        created_at: serverTimestamp()
      });

      toast.success("Profit withdrawal request submitted successfully! 👑");
      setWithdrawAmount('');
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRedirectToKingJWhatsApp = async (order: any) => {
    try {
      const orderId = order.id;
      const refCode = order.referenceCode || order.reference || 'N/A';
      
      const structuredMessage = `--- AGENT REPORT ---
Agent Store: ${agent?.agent_name || 'N/A'} (Slug: ${agent?.agent_slug || 'N/A'})
Agent Phone: ${agent?.momo_number || 'N/A'}
Customer Name: ${order.customerName || 'N/A'}
Customer Email: ${order.email || 'N/A'}
Recipient Phone: ${order.phone || 'N/A'}
Network: ${order.network || 'N/A'}
Bundle Purchased: ${order.bundle || 'N/A'}
Amount Paid: GHS ${order.amount || 'N/A'}
Wholesale Price: GHS ${order.wholesalePrice || 'N/A'}
Agent Profit: GHS ${order.profit || 'N/A'}
Order ID: ${orderId}
Order Status: ${order.status || 'N/A'}
Order Date: ${order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
Reference Code: ${refCode}

*Reason customer has not received bundle:* 
[Please type your reason here...]`;

      // Update the order in firestore to set reportedToAdmin = true
      await updateDoc(doc(db, 'orders', orderId), {
        reportedToAdmin: true,
        agentReportReason: 'Reported directly to King J via WhatsApp'
      });

      const phone = '233535884851';
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(structuredMessage)}`;
      window.open(whatsappUrl, '_blank');

      toast.success("Redirecting to King J's WhatsApp...");
    } catch (error: any) {
      console.error("Report error:", error);
      toast.error(`Reporting failed: ${error.message}`);
    }
  };

  const copyStoreLink = () => {
    if (!agent) return;
    const link = `${window.location.origin}/store/${agent.agent_slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Store link copied successfully! Share it to start earning. 👑");
  };


  // Render Section
  if (loadingAgent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-black text-xs tracking-[0.2em] animate-pulse">SETTING UP ROYAL ACCESS...👑</p>
      </div>
    );
  }

  // Case A: User is not yet unlocked as an Agent in their generic Profile.
  if (!profile?.isAgent) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden">
          <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 text-center shadow-2xl relative border-4 border-slate-100 dark:border-slate-800">
             <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary text-secondary rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl -rotate-6">
                <Key className="w-10 h-10 sm:w-12 sm:h-12" />
             </div>
             
             <h2 className="text-3xl sm:text-4xl font-black mb-4 dark:text-white uppercase leading-tight">AGENT PORTAL</h2>
             <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
                Become a verified independent retail agent to unlock <span className="text-primary uppercase tracking-widest font-black">exclusive wholesale discounts</span>.
             </p>

             <Button 
               className="w-full h-14 sm:h-16 text-lg sm:text-xl font-black rounded-xl sm:rounded-2xl bg-slate-900 text-white hover:bg-black transition-all gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
               onClick={handlePayForAccess}
               disabled={isPaying}
             >
                {isPaying ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> UNLOCK ACCESS: <span className="line-through text-slate-400 mr-1 sm:mr-2">GHS 100</span> <span className="text-primary font-black">GHS 50</span></>}
             </Button>
          </div>
      </div>
    );
  }

  // Case B: Profile unlocked, but Agent Registration form not yet completed.
  if (!agent) {
    return (
      <div className="pt-24 min-h-[85vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-[2.5rem] border-4 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
          <CardHeader className="text-center p-8 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-primary text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-md">
              <UserCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-foreground dark:text-white">AGENT REGISTRATION</CardTitle>
            <CardDescription className="font-bold text-xs mt-1 lowercase">Submit your details to activate your public store link.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="regName" className="text-xs font-black uppercase tracking-wider text-slate-400">Agent Store Name</Label>
                <Input
                  id="regName"
                  placeholder="e.g. Ben's Data Hub"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="rounded-xl h-12 bg-slate-50 border-2 dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regMomoName" className="text-xs font-black uppercase tracking-wider text-slate-400">Mobile Money Account Name</Label>
                <Input
                  id="regMomoName"
                  placeholder="e.g. Ben Gyapong"
                  value={regMomoName}
                  onChange={(e) => setRegMomoName(e.target.value)}
                  className="rounded-xl h-12 bg-slate-50 border-2 dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regMomoNumber" className="text-xs font-black uppercase tracking-wider text-slate-400">Mobile Money Phone Number</Label>
                <Input
                  id="regMomoNumber"
                  placeholder="e.g. 0541234567"
                  value={regMomoNumber}
                  onChange={(e) => setRegMomoNumber(e.target.value)}
                  className="rounded-xl h-12 bg-slate-50 border-2 dark:bg-slate-900 font-bold"
                  required
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-900 flex gap-3 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">
                  Important: Your Mobile Money details will be used for profit withdrawals. Please enter correct information.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-black rounded-xl bg-slate-900 text-white hover:bg-black uppercase tracking-wide gap-2"
                disabled={isRegistering}
              >
                {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "REGISTER & LAUNCH STORE 👑"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case C: Unlocked & Registered Agent Dashboard (Main Dashboard view)
  const acceptedOrdersForTracking = orders.filter(o => o.status !== 'pending');

  return (
    <div className="pt-24 min-h-screen bg-slate-50 dark:bg-slate-900/40 pb-20">
      <div className="container mx-auto px-4 w-full max-w-7xl">
        
        {/* Header Hero Area */}
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 md:p-10 border-4 border-slate-100 dark:border-slate-800 shadow-xl mb-10 flex flex-col md:flex-row items-center md:justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-3">
              <Crown className="w-4 h-4" />
              ROYAL AGENT PARTNER
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground dark:text-white mb-2 uppercase tracking-tight">
               WELCOME, AGENT {agent.agent_name}! 👑
            </h2>
            <p className="text-sm font-bold text-slate-500 lowercase italic opacity-85">
               Manage your custom storefront prices, monitor profit accruals, and request MoMo withdrawals.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            <Button
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-foreground dark:text-white font-black text-xs gap-2 border-2"
              onClick={copyStoreLink}
            >
              <Copy className="w-4 h-4 text-primary" />
              COPY STORE LINK 👑
            </Button>
            <a 
              href={`/store/${agent.agent_slug}`} 
              target="_blank" 
              rel="noreferrer" 
              className="w-full"
            >
              <Button className="h-12 rounded-xl w-full bg-primary text-secondary font-black text-xs gap-2">
                <Store className="w-4 h-4" />
                VISIT STORE FRONT 🚀
              </Button>
            </a>
          </div>
        </div>

        {/* Tab Selection */}
        <Tabs defaultValue="pricing" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-white dark:bg-slate-950 p-1 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex flex-wrap md:flex-nowrap h-auto shadow-md w-full max-w-2xl gap-1">
              <TabsTrigger value="pricing" className="flex-1 rounded-xl font-black py-3 uppercase tracking-wider text-[10px] data-[state=active]:bg-primary data-[state=active]:text-secondary">
                <Store className="w-4 h-4 mr-1.5" />
                Pricing Control
              </TabsTrigger>
              <TabsTrigger value="profit" className="flex-1 rounded-xl font-black py-3 uppercase tracking-wider text-[10px] data-[state=active]:bg-primary data-[state=active]:text-secondary">
                <DollarSign className="w-4 h-4 mr-1.5" />
                Profit Hub
              </TabsTrigger>
              <TabsTrigger value="orders_list" className="flex-1 rounded-xl font-black py-3 uppercase tracking-wider text-[10px] data-[state=active]:bg-primary data-[state=active]:text-secondary relative">
                <FileText className="w-4 h-4 mr-1.5" />
                Sales Tracker 👑
                {orders.filter(o => o.status === 'processing').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black shadow-lg animate-pulse">
                    {orders.filter(o => o.status === 'processing').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile_edit" className="flex-1 rounded-xl font-black py-3 uppercase tracking-wider text-[10px] data-[state=active]:bg-primary data-[state=active]:text-secondary">
                <Settings className="w-4 h-4 mr-1.5" />
                Store Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Pricing Control Tab */}
          <TabsContent value="pricing" className="outline-none">
            <Card className="rounded-[2.5rem] border-2 shadow-lg overflow-hidden">
              <CardHeader className="p-8 border-b-2 bg-slate-50 dark:bg-slate-950">
                <CardTitle className="text-2xl font-black uppercase">STORE PRICING CONTROLLER 👑</CardTitle>
                <CardDescription className="opacity-80 font-bold">
                  Enter your selling prices. Selling price cannot be lower than the base wholesale price.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                {loadingBundles ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">FETCHING MASTER OFFERS...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {['MTN', 'Telecel', 'AirtelTigo', 'FC Mobile Points', 'FC Mobile Silver', 'PUBG Mobile UC'].map(net => {
                      const networkBundles = bundles
                        .filter(b => b.network === net || b.category === net)
                        .filter(b => {
                          if (b.network === 'Telecel') {
                            const amountStr = b.dataAmount || b.name || "";
                            const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
                            const gbValue = gbMatch ? parseFloat(gbMatch[1]) : 0;
                            if (gbValue < 10 || amountStr.toLowerCase().includes("mb")) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          const mbA = parseDataAmountToMB(a.dataAmount);
                          const mbB = parseDataAmountToMB(b.dataAmount);
                          if (mbA !== mbB) {
                            return mbA - mbB;
                          }
                          return Number(a.price) - Number(b.price);
                        });
                      if (networkBundles.length === 0) return null;

                      const getNetworkTheme = (n: string) => {
                        if (n === 'Telecel') return {
                          text: 'text-red-600 dark:text-red-500',
                          border: 'border-red-600/20 dark:border-red-500/20',
                          ring: 'focus-visible:ring-red-500',
                          button: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700',
                          disabledBtn: 'bg-red-500/50 text-white'
                        };
                        if (n === 'AirtelTigo') return {
                          text: 'text-blue-600 dark:text-blue-500',
                          border: 'border-blue-600/20 dark:border-blue-500/20',
                          ring: 'focus-visible:ring-blue-500',
                          button: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
                          disabledBtn: 'bg-blue-500/50 text-white'
                        };
                        if (n === 'FC Mobile Points' || n === 'FC Mobile Silver') return {
                          text: 'text-[#00FF87] dark:text-[#00FF87]',
                          border: 'border-[#00FF87]/20 dark:border-[#00FF87]/20',
                          ring: 'focus-visible:ring-[#00FF87]',
                          button: 'bg-[#00FF87] hover:bg-[#00CC6A] text-black dark:bg-[#00FF87] dark:hover:bg-[#00CC6A]',
                          disabledBtn: 'bg-[#00FF87]/50 text-black'
                        };
                        if (n === 'PUBG Mobile UC') return {
                          text: 'text-amber-500 dark:text-amber-400',
                          border: 'border-amber-500/20 dark:border-amber-400/20',
                          ring: 'focus-visible:ring-amber-500',
                          button: 'bg-amber-500 hover:bg-amber-600 text-black dark:bg-amber-500 dark:hover:bg-amber-600',
                          disabledBtn: 'bg-amber-500/50 text-black'
                        };
                        return {
                          text: 'text-primary',
                          border: 'border-primary/20',
                          ring: 'focus-visible:ring-primary',
                          button: '', // uses default button styling
                          disabledBtn: ''
                        };
                      };

                      const theme = getNetworkTheme(net);
                      
                      const displayName = net === 'FC Mobile Points' ? 'FC ™ MOBILE Points' : net === 'FC Mobile Silver' ? 'FC ™ MOBILE Silver' : net;

                      return (
                        <div key={net} className="space-y-4">
                          <h3 className={`text-lg font-black tracking-widest uppercase border-b pb-2 flex items-center gap-2 ${theme.text} ${theme.border}`}>
                            <span>{displayName} Packages</span>
                            <span className="text-[10px] font-bold text-slate-400 not-italic">({networkBundles.length} active)</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {networkBundles.map(bundle => {
                              const isFCPackage = bundle.category === 'FC Mobile Points' || bundle.category === 'FC Mobile Silver' || bundle.network === 'FC Mobile Points' || bundle.network === 'FC Mobile Silver';
                              const amountStr = String(bundle.dataAmount || bundle.name || "");
                              const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
                              const gbValue = gbMatch ? parseFloat(gbMatch[1]) : 0;
                              const isTelecelReduced = bundle.network === 'Telecel' && ((gbValue >= 1 && gbValue <= 5) || (gbValue >= 10 && gbValue <= 100));
                              const wholesaleDeduction = isFCPackage ? 1.00 : (isTelecelReduced ? 1.00 : 2.00);
                              let wholesale = Math.max(0, Number(bundle.price) - wholesaleDeduction);
                              
                              // Add +2Ghc to the wholesale prices of MTN (from 1gb-6gb) in the agent store
                              if (bundle.network === "MTN" && gbValue >= 1 && gbValue <= 6) {
                                wholesale += 2.0;
                              }
                              const currentVal = customPrices[bundle.id] ?? String(wholesale);
                              const sellingPrice = customPrices[bundle.id] ? Number(customPrices[bundle.id]) : wholesale;
                              const profit = sellingPrice - wholesale;
                              const isBelowWholesale = sellingPrice < wholesale;

                              return (
                                <div key={bundle.id} className="bg-white dark:bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                  <div>
                                    <div className="flex justify-between items-start mb-4">
                                      <span className={`font-extrabold text-lg ${theme.text}`}>{bundle.dataAmount}</span>
                                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-900 border text-slate-500 rounded-lg">wholesale: GHS {wholesale.toFixed(2)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                      <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Selling Price (GHS)</Label>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          value={currentVal}
                                          onChange={(e) => setCustomPrices(prev => ({ ...prev, [bundle.id]: e.target.value }))}
                                          className={`rounded-xl font-extrabold text-foreground ${isBelowWholesale ? 'border-red-500 focus-visible:ring-red-500' : `${theme.ring} border-slate-200`}`}
                                        />
                                      </div>
                                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 flex flex-col justify-center">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Accrued Profit</span>
                                        <span className={`text-base font-black ${isBelowWholesale ? 'text-red-500' : theme.text}`}>
                                          GHS {Math.max(0, profit).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                    {isBelowWholesale && (
                                      <p className="text-[10px] font-bold text-red-500 mb-4 flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Price cannot be lower than wholesale price.
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    className={`w-full text-xs font-black uppercase tracking-wider gap-1.5 h-10 rounded-xl ${isBelowWholesale && theme.disabledBtn ? theme.disabledBtn : theme.button}`}
                                    disabled={isBelowWholesale}
                                    onClick={() => handleSavePrice(bundle.id, wholesale)}
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    Update Price 👑
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Results Checker Section */}
                    <div className="space-y-4 pt-6 border-t-2 border-dashed border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-black tracking-widest uppercase border-b pb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                        <GraduationCap className="w-5 h-5 text-indigo-500" />
                        <span>Results Checker</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const wholesale = 19.0;
                          const currentVal = customPrices['results_checker'] ?? String(wholesale);
                          const sellingPrice = customPrices['results_checker'] ? Number(customPrices['results_checker']) : wholesale;
                          const profit = sellingPrice - wholesale;
                          const isBelowWholesale = sellingPrice < wholesale;

                          return (
                            <div className="bg-white dark:bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm relative overflow-hidden">
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <span className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">WAEC Results Checker (WASSCE, BECE, NOVDEC)</span>
                                  <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-900 border text-slate-500 rounded-lg">wholesale: GHS {wholesale.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Selling Price (GHS)</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={currentVal}
                                      onChange={(e) => setCustomPrices(prev => ({ ...prev, results_checker: e.target.value }))}
                                      className={`rounded-xl font-extrabold text-foreground ${isBelowWholesale ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-indigo-500 border-slate-200'}`}
                                    />
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Accrued Profit</span>
                                    <span className={`text-base font-black ${isBelowWholesale ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                      GHS {Math.max(0, profit).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                {isBelowWholesale && (
                                  <p className="text-[10px] font-bold text-red-500 mb-4 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Price cannot be lower than wholesale price.
                                  </p>
                                )}
                              </div>

                              <Button
                                size="sm"
                                className={`w-full text-xs font-black uppercase tracking-wider gap-1.5 h-10 rounded-xl ${isBelowWholesale ? 'bg-red-500/50 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                disabled={isBelowWholesale}
                                onClick={() => handleSavePrice('results_checker', wholesale)}
                              >
                                <Save className="w-3.5 h-3.5" />
                                Update Price 👑
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Withdrawal Hub */}
          <TabsContent value="profit" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-1 space-y-6">
                <Card className="rounded-[2.5rem] border-2 shadow-lg h-fit overflow-hidden bg-card">
                  <CardHeader className="p-8 border-b-2 bg-slate-50 dark:bg-slate-950/50 align-top relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary text-secondary rounded-2xl flex items-center justify-center shadow-md rotate-3">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black uppercase leading-none">Your Balance</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Earnings and payouts</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 text-white relative overflow-hidden shadow-inner font-sans">
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400/80 block mb-1">Available Profit Balance</span>
                      <h3 className="text-3.5xl font-black tracking-tight text-primary flex items-baseline gap-1">
                        GHS <span className="text-4xl md:text-5xl font-extrabold">{Number(agent.profit_balance || 0).toFixed(2)}</span>
                      </h3>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] bg-white/5 border border-white/10 w-fit px-3 py-1 rounded-full text-slate-300 font-bold uppercase">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Ready to Withdraw
                      </div>
                    </div>

                    {/* Receiving Destination Details */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Payout Destination</span>
                      {agent.momo_name && agent.momo_number ? (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2 relative">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center font-black text-xs">
                              MTN
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black truncate text-foreground uppercase">{agent.momo_name}</p>
                              <p className="text-[10px] font-mono font-bold text-slate-500">{agent.momo_number}</p>
                            </div>
                            <span className="text-[9px] bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              LINKED
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border-2 border-dashed border-amber-200 dark:border-amber-900 space-y-2">
                          <div className="flex gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[11px] font-black uppercase">MOMO Details Unconfigured</p>
                              <p className="text-[10px] font-medium leading-relaxed opacity-90">Please specify correct Mobile Money Details inside the "Settings" tab below to enable withdrawals.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleRequestWithdrawal} className="space-y-4 pt-4 border-t-2">
                      <div className="space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="withdrawAmount" className="text-xs font-black uppercase tracking-wider text-slate-400">Withdraw Amount (GHS)</Label>
                          {agent.profit_balance > 0 && (
                            <button
                              type="button"
                              onClick={() => setWithdrawAmount(agent.profit_balance.toFixed(2))}
                              className="text-[10px] text-primary hover:underline font-black uppercase tracking-wider cursor-pointer"
                            >
                              Use Max
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">GHS</span>
                          <Input
                            id="withdrawAmount"
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="rounded-xl h-12 bg-slate-50 dark:bg-slate-900 border-2 pl-12 font-bold focus:border-primary text-foreground"
                            required
                          />
                        </div>

                        {/* Preset Buttons */}
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          {[10, 20, 50, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setWithdrawAmount(preset.toString())}
                              className={`py-1.5 rounded-lg border text-[10px] font-black tracking-widest uppercase transition-all select-none cursor-pointer ${
                                Number(withdrawAmount) === preset
                                  ? 'bg-primary text-secondary border-primary'
                                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              GHS {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-wider gap-2 bg-slate-900 text-secondary hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-100 transition-all cursor-pointer shadow-md mt-2"
                        disabled={isWithdrawing || !agent.momo_number || !agent.momo_name || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > agent.profit_balance}
                      >
                        {isWithdrawing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>REQUEST PAYOUT</span>
                            <ArrowRight className="w-4 h-4 text-primary" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-[2.5rem] border-2 shadow-lg h-full overflow-hidden">
                  <CardHeader className="p-8 border-b-2 bg-slate-50 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                          <Activity className="w-5 h-5 text-primary" />
                          WITHDRAWALS HISTORY
                        </CardTitle>
                        <CardDescription className="opacity-80 font-semibold text-xs mt-1">Status of your MoMo profit disbursement requests</CardDescription>
                      </div>
                      {profitRequests.length > 0 && (
                        <div className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase">
                          {profitRequests.length} REQUESTS
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {profitRequests.length === 0 ? (
                      <div className="text-center py-24 border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-800">
                        <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
                        <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Empty Payout Log</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto mt-2 px-4">
                          Your accrued store sales margins will appear here whenever you submit a Mobile Money payout request.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                        {profitRequests.map(request => (
                          <div 
                            key={request.id} 
                            className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border-2 hover:border-primary/25 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                <DollarSign className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <p className="text-base font-black text-foreground">GHS {Number(request.withdrawal_amount).toFixed(2)}</p>
                                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">ID: #{request.id.slice(-6)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 font-medium text-[10px] text-slate-500">
                                  <span>{request.created_at ? new Date(request.created_at.seconds * 1000).toLocaleString() : 'Just now'}</span>
                                  <span>•</span>
                                  <span className="font-mono bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-foreground font-black">
                                    {request.momo_number}
                                  </span>
                                  <span className="truncate max-w-[120px] uppercase font-bold text-slate-400">
                                    ({request.momo_name})
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-3 self-end md:self-auto shrink-0">
                              {request.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full uppercase tracking-wider border border-amber-200/40">
                                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                  PENDING PAYOUT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-full uppercase tracking-wider border border-green-200/40">
                                  <Check className="w-3.5 h-3.5" />
                                  DISBURSED & SENT
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* Sales Tracker & Claims Hub */}
          <TabsContent value="orders_list" className="outline-none">
            <div className="space-y-8">
              {/* Stats Bento Section */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="rounded-[1.5rem] border-2 shadow-sm overflow-hidden bg-card">
                   <CardContent className="p-5 flex flex-col justify-between h-full gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Referred Sales</span>
                     <h4 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                       {acceptedOrdersForTracking.length} <span className="text-xs text-slate-400 font-bold">orders</span>
                     </h4>
                   </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border-2 shadow-sm overflow-hidden bg-card">
                   <CardContent className="p-5 flex flex-col justify-between h-full gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivered Volume</span>
                     <h4 className="text-2xl sm:text-3xl font-black text-green-600">
                       GHS {acceptedOrdersForTracking.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.amount || 0), 0).toFixed(2)}
                     </h4>
                   </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border-2 shadow-sm overflow-hidden bg-card">
                   <CardContent className="p-5 flex flex-col justify-between h-full gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Earning Margin</span>
                     <h4 className="text-2xl sm:text-3xl font-black text-primary">
                       GHS {acceptedOrdersForTracking.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.profit || 0), 0).toFixed(2)}
                     </h4>
                   </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border-2 shadow-sm overflow-hidden bg-card">
                   <CardContent className="p-5 flex flex-col justify-between h-full gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Undelivered / Processing</span>
                     <h4 className="text-2xl sm:text-3xl font-black text-yellow-600">
                       {acceptedOrdersForTracking.filter(o => o.status === 'processing').length} <span className="text-xs text-slate-400 font-bold">orders</span>
                     </h4>
                   </CardContent>
                </Card>
              </div>

              {/* Order List Card */}
              <Card className="rounded-[2rem] border-2 shadow-md overflow-hidden bg-white dark:bg-slate-950">
                <CardHeader className="p-6 sm:p-8 border-b bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      REFERRED CUSTOMER ORDERS 👑
                    </CardTitle>
                    <CardDescription className="font-semibold text-xs mt-1">
                      Real-time status of orders initiated via your store link. Support reporting is auto-linked!
                    </CardDescription>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full md:w-72 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search phone, recipient, bundle..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="rounded-xl pl-10 h-10 bg-white border-2 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {loadingOrders ? (
                    <div className="py-24 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing store sales data...</p>
                    </div>
                  ) : acceptedOrdersForTracking.length === 0 ? (
                    <div className="py-24 text-center px-4 max-w-md mx-auto">
                      <Store className="w-12 h-12 text-slate-300 dark:text-slate-755 mx-auto mb-4" />
                      <h4 className="font-black uppercase text-sm mb-2 text-slate-800 dark:text-slate-100">No Sales Completed Yet</h4>
                      <p className="text-xs font-semibold text-slate-400 leading-relaxed mb-6">
                        Configure your profit margin pricing settings, copy your unique public storefront link, and start promoting on social networks to earn high-volume commissions.
                      </p>
                      <Button onClick={copyStoreLink} className="h-10 rounded-xl font-black text-xs gap-2">
                        <Copy className="w-4 h-4" />
                        COPY STOREFRONT LINK 👑
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {acceptedOrdersForTracking
                        .filter(o => {
                          if (!orderSearchQuery.trim()) return true;
                          const q = orderSearchQuery.toLowerCase();
                          return (
                            (o.id && o.id.toLowerCase().includes(q)) ||
                            (o.phone && o.phone.toLowerCase().includes(q)) ||
                            (o.bundle && o.bundle.toLowerCase().includes(q)) ||
                            (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                            (o.network && o.network.toLowerCase().includes(q))
                          );
                        })
                        .map((order) => {
                          const isDisputed = order.reportedToAdmin === true;
                          return (
                            <div key={order.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                              
                              {/* Left Side: Order identifiers */}
                              <div className="space-y-3 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-black bg-primary/10 dark:bg-primary/20 text-primary px-2 py-0.5 rounded-md uppercase">
                                    #{order.id.slice(-6).toUpperCase()}
                                  </span>
                                  {order.status === 'pending' && (
                                    <span className="text-[9px] bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-yellow-250 px-2.5 py-0.5 rounded-full font-black uppercase shadow-xs flex items-center gap-1">
                                      PENDING
                                    </span>
                                  )}
                                  {order.status === 'unpaid' && (
                                    <span className="text-[9px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-250 px-2.5 py-0.5 rounded-full font-black uppercase shadow-xs">
                                      unpaid
                                    </span>
                                  )}
                                  {order.status === 'paid' && (
                                    <span className="text-[9px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-250 px-2.5 py-0.5 rounded-full font-black uppercase shadow-xs">
                                      paid
                                    </span>
                                  )}
                                  {order.status === 'processing' && (
                                    <span className="text-[9px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-250 px-2.5 py-0.5 rounded-full font-black uppercase shadow-xs animate-pulse">
                                      processing
                                    </span>
                                  )}
                                  {order.status === 'delivered' && (
                                    <span className="text-[9px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-250 px-2.5 py-0.5 rounded-full font-black uppercase shadow-xs">
                                      delivered 👑
                                    </span>
                                  )}
                                  {order.status === 'failed' && (
                                    <span className="text-[9px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-250 px-2.5 py-0.5 rounded-full font-black uppercase shadow-xs">
                                      failed
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase">
                                    {order.customerName || 'Royal Customer'}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[150px]" title={order.email}>
                                      {order.email || 'No email provided'}
                                    </p>
                                    {order.email && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Copy Email"
                                        className="h-4 w-4 p-0 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded cursor-pointer"
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.email);
                                          toast.success("Customer email copied! 👑");
                                        }}
                                      >
                                        <Copy className="w-2.5 h-2.5" />
                                      </Button>
                                    )}
                                  </div>
                                  {order.createdAt && (
                                    <p className="text-[9px] font-bold text-slate-400 italic">
                                      Sale registered: {new Date(order.createdAt?.seconds * 1000).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Middle Column: Target Line & Package details */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">DELIVERY TARGET</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col gap-1.5 items-start">
                                    <span className="font-sans font-black text-xs text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 p-1.5 px-3 rounded-xl border">
                                      {order.network}: <span className="text-primary tracking-tight font-mono">{order.phone}</span>
                                    </span>
                                  </div>
                                  <a 
                                    href={`https://wa.me/233${order.phone.replace(/^0/, '')}?text=${encodeURIComponent(`Hello, this is agent ${agent?.agent_name || 'storeholder'} from King J Deals. Regarding your order #${order.id.slice(-6).toUpperCase()} of ${order.bundle}...`)}`}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-1.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/30 self-stretch flex items-center"
                                    title="Chat with Customer via WhatsApp"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </a>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 bg-slate-50 dark:bg-slate-900 border px-2 py-0.5 rounded-md w-fit uppercase">
                                  {order.bundle}
                                </p>
                              </div>

                              {/* Commision Margin Block */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">RECONCILIATION</span>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                  Selling Price: <span className="font-black text-foreground">GHS {Number(order.amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                  Wholesale Cost: <span className="font-black text-slate-500">GHS {Number(order.wholesalePrice || 0).toFixed(2)}</span>
                                </div>
                                <div className="text-xs font-bold text-primary flex items-center gap-1 mt-1 font-mono">
                                  <span>Commission Margin:</span>
                                  <span className="font-extrabold bg-primary/15 px-2 py-0.5 rounded border border-primary/20">GHS {Number(order.profit || 0).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Right column: Action / Claim Status */}
                              <div className="shrink-0 flex flex-col justify-center gap-1.5">
                                {isDisputed ? (
                                  <div className="p-3 bg-amber-50/70 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 rounded-2xl w-full max-w-xs space-y-1 text-center">
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest justify-center">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      REPORTED TO ADMIN ⚠️
                                    </div>
                                    <p className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 leading-tight">
                                      {order.agentReportReason ? `"${order.agentReportReason}"` : "Re-investigation for payment delivery has been requested."}
                                    </p>
                                    <span className="inline-flex text-[8px] bg-yellow-500/10 text-yellow-600 font-extrabold px-1.5 py-0.5 rounded uppercase mt-1">
                                      Pending Verification
                                    </span>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => handleRedirectToKingJWhatsApp(order)}
                                    className="h-10 text-[10px] px-4 font-black rounded-xl border-4 bg-transparent hover:bg-red-500 hover:text-white border-red-500 text-red-500 transition-all uppercase gap-1"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    REPORT ISSUE ⚠️
                                  </Button>
                                )}
                              </div>

                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Store Settings & Edit profile */}
          <TabsContent value="profile_edit" className="outline-none">
            <Card className="max-w-xl mx-auto rounded-[2.5rem] border-2 shadow-lg overflow-hidden">
              <CardHeader className="p-8 border-b-2 bg-slate-50 dark:bg-slate-950">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  edit profiles & MoMo withdrawal channel
                </CardTitle>
                <CardDescription className="opacity-80 font-semibold text-xs mt-1">Specify correct credentials to receive profit disbursements.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="editName" className="text-xs font-black uppercase tracking-wider text-slate-400">Agent Store Name</Label>
                    <Input
                      id="editName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-xl h-12 bg-slate-50 border-2 dark:bg-slate-900 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editMomoName" className="text-xs font-black uppercase tracking-wider text-slate-400">Mobile Money Account (MoMo Name)</Label>
                    <Input
                      id="editMomoName"
                      value={editMomoName}
                      onChange={(e) => setEditMomoName(e.target.value)}
                      className="rounded-xl h-12 bg-slate-50 border-2 dark:bg-slate-900 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editMomoNumber" className="text-xs font-black uppercase tracking-wider text-slate-400">Mobile Money Phone (MoMo Number)</Label>
                    <Input
                      id="editMomoNumber"
                      value={editMomoNumber}
                      onChange={(e) => setEditMomoNumber(e.target.value)}
                      className="rounded-xl h-12 bg-slate-50 border-2 dark:bg-slate-900 font-bold"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-wide bg-slate-900 text-white hover:bg-black gap-1.5"
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 text-primary" /> SAVE SETTINGS CHANNEL 👑</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>



      </div>
    </div>
  );
}
