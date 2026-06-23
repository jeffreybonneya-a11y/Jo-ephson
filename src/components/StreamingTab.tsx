import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Tv, Lock, PlayCircle, Smartphone, Video, X, Crown, Search } from 'lucide-react';
import { toast } from 'sonner';
import fcMobilePointsImg from '../assets/images/ea_fc_mobile_points_1781985298107.jpg';
import { Bundle } from '../types';

interface StreamingTabProps {
  onSelectBundle?: (bundle: Bundle) => void;
  bundles?: Bundle[];
}

export default function StreamingTab({ onSelectBundle, bundles = [] }: StreamingTabProps) {
  const [loading, setLoading] = useState(true);
  const [isProcessingLive, setIsProcessingLive] = useState(false);
  const [isProcessingOneTime, setIsProcessingOneTime] = useState(false);
  const [streamList, setStreamList] = useState<any[]>([]);
  const [activePlayer, setActivePlayer] = useState<{ url: string, title: string } | null>(null);
  const [showFcMobileDialog, setShowFcMobileDialog] = useState(false);
  
  const [activeTab, setActiveTab] = useState('buy_games');
  const [activeSubTab, setActiveSubTab] = useState('game_coins');

  useEffect(() => {
    const handleNav = () => {
      setActiveTab('buy_games');
      setActiveSubTab('pc_games');
    };
    window.addEventListener('NAVIGATE_TO_PC_GAMES', handleNav);
    return () => window.removeEventListener('NAVIGATE_TO_PC_GAMES', handleNav);
  }, []);

  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'stream')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStreamList(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePayForStream = async (type: 'live' | 'onetime', price: number) => {
    if (!auth.currentUser) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Paystack Public Key is missing! Please set it in settings. 👑");
      return;
    }

    if (type === 'live') setIsProcessingLive(true);
    if (type === 'onetime') setIsProcessingOneTime(true);

    try {
      // 1. Create order immediately in tracking tab just like CheckoutForm
      const preOrderRef = doc(collection(db, 'orders'));
      const preOrderId = preOrderRef.id;

      await setDoc(preOrderRef, {
          userId: auth.currentUser.uid,
          customerName: auth.currentUser.displayName || auth.currentUser.email || 'Royal Customer',
          email: auth.currentUser.email || 'no-email@example.com',
          phone: "N/A", // Needed for Admin table to not crash visually
          bundle: type === 'live' ? 'LIVE ACCESS' : 'ONE-TIME STREAM',
          network: 'STREAM',
          type: 'stream',
          streamType: type,
          streamStatus: type === 'live' ? 'pending' : 'pending_approval',
          status: 'pending',
          paymentStatus: 'pending',
          amount: Number(price),
          createdAt: serverTimestamp()
      });

      // 2. Open Paystack
      const mod = await import('@paystack/inline-js');
      let PaystackCtor: any = mod.default || mod;
      if (typeof PaystackCtor !== 'function' && PaystackCtor.default) {
        PaystackCtor = PaystackCtor.default;
      }

      const paystack = new PaystackCtor();
      paystack.newTransaction({
        key: publicKey,
        email: auth.currentUser.email || 'guest@kingjdeals.com',
        amount: Math.round(price * 100),
        currency: "GHS",
        metadata: {
          type: 'stream',
          streamType: type,
          userId: auth.currentUser.uid,
          customerName: auth.currentUser.displayName || auth.currentUser.email,
          phone: "N/A",
          internalOrderId: preOrderId,
          originalAmount: price
        },
        onSuccess: async (response: any) => {
          try {
            await fetch('/api/verifyPayment', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                  reference: response.reference,
                  metadata: {
                    type: 'stream',
                    streamType: type,
                    userId: auth.currentUser?.uid,
                    internalOrderId: preOrderId,
                    originalAmount: price
                  }
               })
            });
          } catch (err) {
             console.error("Error verifying stream payment:", err);
          } finally {
            if (type === 'live') setIsProcessingLive(false);
            if (type === 'onetime') setIsProcessingOneTime(false);
          }
        },
        onCancel: () => {
          if (type === 'live') setIsProcessingLive(false);
          if (type === 'onetime') setIsProcessingOneTime(false);
        }
      });
      
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with server.");
      if (type === 'live') setIsProcessingLive(false);
      if (type === 'onetime') setIsProcessingOneTime(false);
    }
  };

  const watchStream = (streamType: 'live' | 'onetime') => {
    if (streamType === 'live') {
      toast.success("Redirecting to Live Stream... 👑");
      setTimeout(() => {
        window.location.href = 'https://cricfy.net/android-8-apk-214/';
      }, 1200);
    } else {
      setActivePlayer({ url: 'https://www.soccertvhd.com/hesgoal-hes-goal-live-streaming/', title: 'One-Time Stream Access' });
    }
  };

  const pendingLiveStream = streamList.find(s => s.streamType === 'live' && s.streamStatus === 'pending');
  const activeLiveStream = streamList.find(s => s.streamType === 'live' && s.streamStatus === 'approved');
  
  const pendingOneTime = streamList.find(s => s.streamType === 'onetime' && s.streamStatus === 'pending_approval');
  const activeOneTime = streamList.find(s => s.streamType === 'onetime' && s.streamStatus === 'approved');

  if (loading) {
     return <div className="py-20 flex justify-center text-primary"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-card border-border border rounded-2xl p-1 mb-8">
          <TabsTrigger value="buy_games" className="rounded-xl font-black uppercase text-[10px] md:text-sm py-3 data-[state=active]:bg-primary data-[state=active]:text-secondary whitespace-normal h-full flex flex-col items-center gap-1">Buy Game & Coins</TabsTrigger>
          <TabsTrigger value="results_checker" className="rounded-xl font-black uppercase text-[10px] md:text-sm py-3 data-[state=active]:bg-primary data-[state=active]:text-secondary whitespace-normal h-full flex flex-col items-center gap-1">Results Checker</TabsTrigger>
          <TabsTrigger value="premium_apps" className="rounded-xl font-black uppercase text-[10px] md:text-sm py-3 data-[state=active]:bg-primary data-[state=active]:text-secondary whitespace-normal h-full flex flex-col items-center gap-1">Premium Apps</TabsTrigger>
        </TabsList>

        <TabsContent value="buy_games" className="animate-in fade-in zoom-in-95 duration-300">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 rounded-xl p-1 mb-6">
              <TabsTrigger value="game_coins" className="rounded-lg font-bold uppercase text-[9px] sm:text-xs">Game Coins</TabsTrigger>
              <TabsTrigger value="pc_games" className="rounded-lg font-bold uppercase text-[9px] sm:text-xs">PC Games</TabsTrigger>
              <TabsTrigger value="ps_games" className="rounded-lg font-bold uppercase text-[9px] sm:text-xs">PlayStation</TabsTrigger>
            </TabsList>

            <TabsContent value="game_coins">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:border-primary/30 transition-all shadow-md group border-2 rounded-3xl overflow-hidden bg-card border-border flex flex-col">
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
                    <img 
                      src={fcMobilePointsImg}
                      alt="EA Sports FC Mobile" 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                         e.currentTarget.src = "https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=1000&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col flex-1 items-center text-center">
                    <div className="mb-4">
                      <h3 className="text-xl font-black mb-1 text-foreground dark:text-white uppercase tracking-tight">EA Sports FC™ Mobile</h3>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">FC Mobile Points & Silver</p>
                    </div>
                    <div className="mt-auto w-full pt-4">
                       <Button className="w-full rounded-2xl h-12 bg-primary text-secondary hover:bg-slate-900 font-black uppercase tracking-widest text-xs" onClick={() => setShowFcMobileDialog(true)}>
                         <Lock className="w-4 h-4 mr-2" /> Buy Points & Silver
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="pc_games">
              <div className="flex flex-col justify-center items-center py-20 bg-card rounded-[2rem] border-2 border-dashed border-primary/10 text-center border-border">
                <h3 className="text-xl font-black text-foreground mb-2 dark:text-white">PC GAMES COMING SOON 👑</h3>
                <p className="text-muted-foreground text-sm">The King is preparing this service.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="ps_games">
              <div className="flex flex-col justify-center items-center py-20 bg-card rounded-[2rem] border-2 border-dashed border-primary/10 text-center border-border">
                <h3 className="text-xl font-black text-foreground mb-2 dark:text-white">PLAYSTATION GAMES COMING SOON 👑</h3>
                <p className="text-muted-foreground text-sm">The King is preparing this service.</p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="results_checker" className="animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col justify-center items-center py-24 bg-card rounded-[2rem] border-4 border-dashed border-primary/10 text-center border-border">
            <h3 className="text-2xl font-black text-foreground mb-2 dark:text-white">RESULTS CHECKER COMING SOON 👑</h3>
            <p className="text-muted-foreground">The King is preparing this service.</p>
          </div>
        </TabsContent>

        <TabsContent value="premium_apps" className="animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col justify-center items-center py-24 bg-card rounded-[2rem] border-4 border-dashed border-primary/10 text-center border-border">
            <Smartphone className="w-16 h-16 text-muted-foreground/20 mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2 dark:text-white">PREMIUM APPS COMING SOON 👑</h3>
            <p className="text-muted-foreground">The King is preparing this service.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* FC Mobile Dialog */}
      <Dialog open={showFcMobileDialog} onOpenChange={setShowFcMobileDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-3xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-center">Buy FC Mobile</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="points" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 rounded-xl p-1 mb-6">
              <TabsTrigger value="points" className="rounded-lg font-bold uppercase text-xs">Points</TabsTrigger>
              <TabsTrigger value="silver" className="rounded-lg font-bold uppercase text-xs">Silver</TabsTrigger>
            </TabsList>
            
            <TabsContent value="points" className="animate-in fade-in zoom-in-95 duration-300">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
                  {bundles.filter(b => b.network === 'FCMobile' && !b.name.toLowerCase().includes('silver')).sort((a,b) => a.price - b.price).map(bundle => (
                    <button
                      key={bundle.id}
                      onClick={() => {
                        setShowFcMobileDialog(false);
                        if (onSelectBundle) onSelectBundle(bundle);
                      }}
                      className="flex bg-card items-center justify-between p-4 rounded-xl border border-border hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group text-left w-full animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <p className="font-black text-sm uppercase text-foreground">{bundle.name}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase">{bundle.network}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 relative z-10">
                        <p className="font-black text-lg text-emerald-500">GHS {bundle.price}</p>
                        <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-lg font-black uppercase shadow-sm group-hover:scale-105 transition-transform">Buy Now</span>
                      </div>
                    </button>
                  ))}
                  {bundles.filter(b => b.network === 'FCMobile' && !b.name.toLowerCase().includes('silver')).length === 0 && (
                     <div className="col-span-full py-12 text-center text-muted-foreground font-bold">No points packages available right now</div>
                  )}
               </div>
            </TabsContent>
            
            <TabsContent value="silver" className="animate-in fade-in zoom-in-95 duration-300">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
                  {bundles.filter(b => b.network === 'FCMobile' && b.name.toLowerCase().includes('silver')).sort((a,b) => a.price - b.price).map(bundle => (
                    <button
                      key={bundle.id}
                      onClick={() => {
                        setShowFcMobileDialog(false);
                        if (onSelectBundle) onSelectBundle(bundle);
                      }}
                      className="flex bg-card items-center justify-between p-4 rounded-xl border border-border hover:border-slate-400/50 transition-all shadow-sm hover:shadow-md group text-left w-full animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-slate-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <p className="font-black text-sm uppercase text-foreground">{bundle.name}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase">{bundle.network}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 relative z-10">
                        <p className="font-black text-lg text-slate-500 dark:text-slate-400">GHS {bundle.price}</p>
                        <span className="text-[10px] bg-slate-600 dark:bg-slate-500 text-white px-3 py-1 rounded-lg font-black uppercase shadow-sm group-hover:scale-105 transition-transform">Buy Now</span>
                      </div>
                    </button>
                  ))}
                  {bundles.filter(b => b.network === 'FCMobile' && b.name.toLowerCase().includes('silver')).length === 0 && (
                     <div className="col-span-full py-12 text-center text-muted-foreground font-bold">No silver packages available right now</div>
                  )}
               </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
