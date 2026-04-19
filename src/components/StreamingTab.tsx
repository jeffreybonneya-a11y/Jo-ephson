import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Tv, Lock, PlayCircle, Smartphone, Video, X, Crown } from 'lucide-react';
import { toast } from 'sonner';
import PaystackPop from '@paystack/inline-js';

export default function StreamingTab() {
  const [loading, setLoading] = useState(true);
  const [isProcessingLive, setIsProcessingLive] = useState(false);
  const [isProcessingOneTime, setIsProcessingOneTime] = useState(false);
  const [streamList, setStreamList] = useState<any[]>([]);
  const [activePlayer, setActivePlayer] = useState<{ url: string, title: string } | null>(null);

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
          customerName: auth.currentUser.displayName || auth.currentUser.email,
          email: auth.currentUser.email,
          phone: "N/A", // Needed for Admin table to not crash visually
          bundle: type === 'live' ? 'LIVE ACCESS' : 'ONE-TIME STREAM',
          network: 'STREAM',
          type: 'stream',
          streamType: type,
          streamStatus: type === 'live' ? 'pending' : 'pending_approval',
          status: 'pending',
          paymentStatus: 'pending',
          amount: price,
          createdAt: serverTimestamp()
      });

      // 2. Open Paystack
      const handler = PaystackPop.setup({
        key: publicKey,
        email: auth.currentUser.email || 'guest@kingjdeals.com',
        amount: Math.round(price * 100),
        currency: "GHS",
        metadata: {
          type: 'stream',
          streamType: type,
          userId: auth.currentUser.uid,
          customerName: auth.currentUser.displayName || auth.currentUser.email,
          phone: 'N/A',
          internalOrderId: preOrderId,
          originalAmount: price
        },
        callback: async (response: any) => {
          try {
            const res = await fetch('/api/verifyPayment', {
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
            const verifyData = await res.json();
            if (verifyData.success) {
               toast.success("Payment Received! Updating access...");
            }
          } catch (err) {
             toast.error("Error verifying stream payment. Support will be notified.");
          } finally {
            if (type === 'live') setIsProcessingLive(false);
            if (type === 'onetime') setIsProcessingOneTime(false);
          }
        },
        onClose: () => {
          if (type === 'live') setIsProcessingLive(false);
          if (type === 'onetime') setIsProcessingOneTime(false);
          toast.info("Payment window closed. Order preserved in system.");
        }
      });
      
      handler.openIframe();
      
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
      <Tabs defaultValue="football" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1 mb-8">
            <TabsTrigger value="football" className="rounded-xl font-black uppercase text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-secondary">Football Stream</TabsTrigger>
            <TabsTrigger value="coming_soon" className="rounded-xl font-black uppercase text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-secondary">More Services</TabsTrigger>
        </TabsList>

        <TabsContent value="football" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
           {/* Header with Image */}
           <div className="relative w-full h-[200px] md:h-[300px] rounded-[2rem] overflow-hidden mb-8 shadow-md">
              <img 
                 src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop" 
                 alt="Football" 
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-8">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 text-white font-black uppercase text-[10px] tracking-widest w-fit mb-3">
                     <Tv className="w-3 h-3" />
                     Live Now
                 </div>
                 <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">ROYAL FOOTBALL</h2>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
              {/* LIVE ACCESS - 50 GHS */}
              <Card className="hover:border-primary/30 transition-all shadow-md group border-2 rounded-[2rem] overflow-hidden">
                 <CardContent className="p-8 flex flex-col items-center text-center h-full">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                       <Smartphone className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">LIVE ACCESS 👑</h3>
                    <p className="text-slate-500 mb-6 text-sm">Download the official app or use our secure embedded viewer. Strictly for Android devices.</p>
                    <div className="text-3xl font-black text-slate-900 mb-8">
                       50 <span className="text-sm text-slate-400 font-bold uppercase tracking-widest relative -top-2">GHS</span>
                    </div>
                    
                    <div className="mt-auto w-full">
                       {activeLiveStream ? (
                         <div className="space-y-3">
                            <div className="bg-green-50 text-green-700 font-bold p-3 rounded-xl text-sm border-2 border-green-100 flex items-center justify-center gap-2">
                                <PlayCircle className="w-5 h-5" /> Access Granted
                            </div>
                            <Button onClick={() => watchStream('live')} className="w-full h-14 rounded-2xl bg-primary text-secondary hover:bg-slate-900 font-black uppercase tracking-widest text-sm">
                                Open Stream
                            </Button>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Requires Android</p>
                         </div>
                       ) : pendingLiveStream ? (
                         <div className="space-y-3">
                           <Button disabled className="w-full h-14 rounded-2xl bg-amber-100 text-amber-700 font-black uppercase tracking-widest text-[10px] sm:text-xs">
                              Processing Order...
                           </Button>
                           <Button onClick={() => handlePayForStream('live', 50)} variant="outline" className="w-full font-bold text-xs">
                              Retry Payment
                           </Button>
                         </div>
                       ) : (
                         <Button 
                            disabled={isProcessingLive}
                            onClick={() => handlePayForStream('live', 50)} 
                            className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-primary font-black uppercase tracking-widest text-sm"
                         >
                            {isProcessingLive ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" /> Pay to Access</>}
                         </Button>
                       )}
                    </div>
                 </CardContent>
              </Card>

              {/* ONE-TIME ACCESS - 5 GHS */}
              <Card className="hover:border-primary/30 transition-all shadow-md group border-2 rounded-[2rem] overflow-hidden">
                 <CardContent className="p-8 flex flex-col items-center text-center h-full">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                       <Video className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">ONE-TIME STREAM</h3>
                    <p className="text-slate-500 mb-6 text-sm">Temporary secure session for mobile, iOS, and PC. Needs admin manual approval after payment.</p>
                    <div className="text-3xl font-black text-slate-900 mb-8">
                       5 <span className="text-sm text-slate-400 font-bold uppercase tracking-widest relative -top-2">GHS</span>
                    </div>
                    
                    <div className="mt-auto w-full">
                       {activeOneTime ? (
                         <div className="space-y-3">
                            <div className="bg-green-50 text-green-700 font-bold p-3 rounded-xl text-sm border-2 border-green-100 flex items-center justify-center gap-2">
                                <PlayCircle className="w-5 h-5" /> Access Granted
                            </div>
                            <Button onClick={() => watchStream('onetime')} className="w-full h-14 rounded-2xl bg-primary text-secondary hover:bg-slate-900 font-black uppercase tracking-widest text-sm">
                                Watch Stream
                            </Button>
                         </div>
                       ) : pendingOneTime ? (
                         <div className="space-y-3">
                           <div className="bg-amber-50 text-amber-700 font-bold p-3 rounded-xl text-sm border-2 border-amber-100 flex items-center justify-center gap-2">
                               <Loader2 className="w-4 h-4 animate-spin" /> Waiting for Admin...
                           </div>
                           <Button onClick={() => handlePayForStream('onetime', 5)} variant="outline" className="w-full font-bold text-xs mt-2 border-amber-200">
                               Retry Payment
                           </Button>
                         </div>
                       ) : (
                         <Button 
                            disabled={isProcessingOneTime}
                            onClick={() => handlePayForStream('onetime', 5)} 
                            className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-primary font-black uppercase tracking-widest text-sm"
                         >
                            {isProcessingOneTime ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" /> Pay to Access</>}
                         </Button>
                       )}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="coming_soon" className="animate-in fade-in zoom-in-95 duration-300">
           <div className="flex flex-col justify-center items-center py-24 bg-white rounded-[2rem] border-4 border-dashed border-primary/10 text-center">
              <Tv className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">SERVICES COMING SOON 👑</h3>
              <p className="text-slate-500">The King is preparing more TV and Streaming services.</p>
           </div>
        </TabsContent>
      </Tabs>

      {/* Embedded Stream Player Overlay */}
      {activePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl h-[80vh] md:h-[90vh] bg-black rounded-3xl overflow-hidden flex flex-col relative border border-slate-800 shadow-2xl">
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
              <h3 className="text-white font-black uppercase text-sm flex items-center gap-2">
                 <PlayCircle className="w-5 h-5 text-primary" /> {activePlayer.title}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActivePlayer(null)} 
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full w-10 h-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 w-full bg-black relative">
              {/* Top Blur Mask to hide "Soccer hd tv" or other branding from source header */}
              <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-black/60 backdrop-blur-xl z-20 border-b border-white/10 flex items-center justify-center pointer-events-none">
                 <div className="flex items-center gap-2">
                    <Crown className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Royal Secure Session</span>
                    <Crown className="w-3 h-3 text-primary animate-pulse" />
                 </div>
              </div>
              
              {/* Overlay block to intercept clicks, discouraging simple right-click / inspection interactions on the iframe */}
              <div className="absolute inset-0 z-10 pointer-events-none" style={{boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'}} />
              <iframe
                src={activePlayer.url}
                allowFullScreen
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-forms"
                title={activePlayer.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
