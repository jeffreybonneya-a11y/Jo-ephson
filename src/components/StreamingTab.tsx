import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Tv, Lock, PlayCircle, Smartphone, Video, X, Crown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Bundle } from '../types';

interface StreamingTabProps {
  onSelectBundle?: (bundle: Bundle) => void;
  bundles?: Bundle[];
}

const getBundleCategory = (b: Bundle): string => {
  if (b.category) return b.category;
  if (b.network === 'FCMobile') return 'Game Coins';
  return b.network;
};

const ProductCard: React.FC<{ bundle: Bundle; onSelect: (bundle: Bundle) => void }> = ({ bundle, onSelect }) => {
  // Determine premium real background cover image fallback
  let displayImage = bundle.imageUrl;
  if (!displayImage) {
    const nameLower = bundle.name.toLowerCase();
    if (nameLower.includes('netflix')) {
      displayImage = 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('spotify')) {
      displayImage = 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('canva')) {
      displayImage = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('chatgpt') || nameLower.includes('gpt')) {
      displayImage = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('capcut')) {
      displayImage = 'https://images.unsplash.com/photo-1621574539437-4b7cb63120b8?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('gta')) {
      displayImage = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('fc') || nameLower.includes('fifa') || nameLower.includes('pubg') || nameLower.includes('free fire') || nameLower.includes('coins')) {
      displayImage = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('playstation') || nameLower.includes('psn') || nameLower.includes('sony')) {
      displayImage = 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=600&auto=format&fit=crop';
    } else if (nameLower.includes('bece') || nameLower.includes('wassce') || nameLower.includes('checker')) {
      displayImage = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop';
    } else {
      displayImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop';
    }
  }

  return (
    <div className="hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 group border-2 rounded-3xl overflow-hidden bg-[#0A192F] border-slate-800 flex flex-col h-full shadow-lg">
      <div className="relative h-[220px] md:h-[240px] w-full overflow-hidden border-b border-slate-800 shrink-0">
        <img 
          src={displayImage} 
          alt={bundle.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-[#0A192F]/80 backdrop-blur-md border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
          {bundle.category || bundle.network}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-base md:text-lg font-black mb-1 text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors line-clamp-1">{bundle.name}</h3>
          <p className="text-slate-400 text-xs font-bold leading-relaxed line-clamp-2 h-10">
            {bundle.description || `Get instant delivery on ${bundle.name}. ${bundle.dataAmount ? `Volume: ${bundle.dataAmount}.` : ''}`}
          </p>
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Royal Price</span>
            <span className="text-lg font-black text-amber-500 font-mono">GHS {bundle.price.toFixed(2)}</span>
          </div>
          <Button 
            className="rounded-xl px-4 h-9 bg-amber-500 text-slate-950 hover:bg-amber-600 font-black uppercase tracking-wider text-[10px] shadow-md transition-all active:scale-95 cursor-pointer"
            onClick={() => onSelect(bundle)}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};

const EmptyCategory: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col justify-center items-center py-16 px-4 bg-[#0A192F] rounded-3xl border-2 border-dashed border-slate-800 text-center w-full">
    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
      <Crown className="w-6 h-6" />
    </div>
    <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tight">{title}</h3>
    <p className="text-slate-400 text-xs max-w-sm">{subtitle}</p>
  </div>
);

export default function StreamingTab({ onSelectBundle, bundles = [] }: StreamingTabProps) {
  const [loading, setLoading] = useState(true);
  const [isProcessingLive, setIsProcessingLive] = useState(false);
  const [isProcessingOneTime, setIsProcessingOneTime] = useState(false);
  const [streamList, setStreamList] = useState<any[]>([]);
  const [activePlayer, setActivePlayer] = useState<{ url: string, title: string } | null>(null);
  
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
      const preOrderRef = doc(collection(db, 'orders'));
      const preOrderId = preOrderRef.id;

      await setDoc(preOrderRef, {
          userId: auth.currentUser.uid,
          customerName: auth.currentUser.displayName || auth.currentUser.email || 'Royal Customer',
          email: auth.currentUser.email || 'no-email@example.com',
          phone: "N/A",
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

  // Categorized live bundles list
  const gameCoinsItems = bundles.filter(b => getBundleCategory(b) === 'Game Coins');
  const pcGamesItems = bundles.filter(b => getBundleCategory(b) === 'PC Games');
  const playStationItems = bundles.filter(b => getBundleCategory(b) === 'PlayStation');
  const resultsCheckerItems = bundles.filter(b => getBundleCategory(b) === 'Results Checker');
  const premiumAppsItems = bundles.filter(b => getBundleCategory(b) === 'Premium Apps');

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

            <TabsContent value="game_coins" className="animate-in fade-in zoom-in-95 duration-300">
              {gameCoinsItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gameCoinsItems.map(item => (
                    <ProductCard key={item.id} bundle={item} onSelect={(selected) => onSelectBundle?.(selected)} />
                  ))}
                </div>
              ) : (
                <EmptyCategory 
                  title="No Game Coin offers available" 
                  subtitle="The King is preparing new FC Mobile Points, PUBG UC, Free Fire Diamonds, and Call of Duty Points offers. Stay tuned!" 
                />
              )}
            </TabsContent>
            
            <TabsContent value="pc_games" className="animate-in fade-in zoom-in-95 duration-300">
              {pcGamesItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pcGamesItems.map(item => (
                    <ProductCard key={item.id} bundle={item} onSelect={(selected) => onSelectBundle?.(selected)} />
                  ))}
                </div>
              ) : (
                <EmptyCategory 
                  title="PC Games Coming Soon 👑" 
                  subtitle="The King is preparing awesome game cover offers (GTA V, EA Sports FC, Call of Duty, Red Dead Redemption, Need for Speed). Stay tuned!" 
                />
              )}
            </TabsContent>
            
            <TabsContent value="ps_games" className="animate-in fade-in zoom-in-95 duration-300">
              {playStationItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playStationItems.map(item => (
                    <ProductCard key={item.id} bundle={item} onSelect={(selected) => onSelectBundle?.(selected)} />
                  ))}
                </div>
              ) : (
                <EmptyCategory 
                  title="PlayStation Offers Coming Soon 👑" 
                  subtitle="Get ready for official PlayStation game covers and PSN gift card deals. Coming very soon!" 
                />
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="results_checker" className="animate-in fade-in zoom-in-95 duration-300">
          {resultsCheckerItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resultsCheckerItems.map(item => (
                <ProductCard key={item.id} bundle={item} onSelect={(selected) => onSelectBundle?.(selected)} />
              ))}
            </div>
          ) : (
            <EmptyCategory 
              title="Results Checker Coming Soon 👑" 
              subtitle="The King is curating secure and instant-delivery vouchers for BECE, WASSCE, and NovDec checkers. Stay tuned!" 
            />
          )}
        </TabsContent>

        <TabsContent value="premium_apps" className="animate-in fade-in zoom-in-95 duration-300">
          {premiumAppsItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumAppsItems.map(item => (
                <ProductCard key={item.id} bundle={item} onSelect={(selected) => onSelectBundle?.(selected)} />
              ))}
            </div>
          ) : (
            <EmptyCategory 
              title="Premium Apps Subscriptions Coming Soon 👑" 
              subtitle="Get ready for genuine, reliable premium subscriptions including Netflix, Spotify, Canva Pro, ChatGPT Plus, and CapCut Pro." 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
