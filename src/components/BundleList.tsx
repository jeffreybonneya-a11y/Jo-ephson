import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Bundle, Network } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'motion/react';
import { Smartphone, Wifi, Zap, Tv, Crown, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BundleListProps {
  onSelectBundle: (bundle: Bundle) => void;
}

export default function BundleList({ onSelectBundle }: BundleListProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MTN');

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'MTN': return 'bg-primary text-secondary border-primary';
      case 'Telecel': return 'bg-red-600 text-white border-red-600';
      case 'AirtelTigo': return 'bg-blue-600 text-white border-blue-600';
      default: return 'bg-primary text-secondary border-primary';
    }
  };

  const getNetworkBadgeColor = (network: string) => {
    switch (network) {
      case 'MTN': return 'bg-primary text-secondary';
      case 'Telecel': return 'bg-red-600 text-white';
      case 'AirtelTigo': return 'bg-blue-600 text-white';
      default: return 'bg-primary text-secondary';
    }
  };

  useEffect(() => {
    // Listen for announcement to apply dynamic discounts
    const unsubAnnouncement = onSnapshot(doc(db, 'settings', 'announcement'), (annSnapshot) => {
      const announcementData = annSnapshot.exists() ? annSnapshot.data() : null;
      const isDiscountActive = announcementData?.active && (announcementData?.type === 'discount' || announcementData?.type === 'alert');

      // Primary source: Firestore bundles collection (allows admin to manage names/prices)
      const q = query(collection(db, 'bundles'), where('active', '==', true));
      const unsubscribeBundles = onSnapshot(q, (snapshot) => {
        const bundleData = snapshot.docs.map(doc => {
          const data = doc.data();
          const originalPrice = data.price;
          let discountedPrice = originalPrice;

          if (isDiscountActive) {
            // Deduction logic: 1 for small prices (< 10), 2 for big prices (>= 10)
            const deduction = originalPrice < 10 ? 1 : 2;
            discountedPrice = Math.max(0, originalPrice - deduction);
          }

          return { 
            id: doc.id, 
            ...data,
            originalPrice,
            price: discountedPrice,
            isDiscounted: isDiscountActive && discountedPrice < originalPrice,
            network: (data.network === 'Vodafone' ? 'Telecel' : data.network) as Network
          } as Bundle & { originalPrice: number, isDiscounted: boolean };
        });
        
        setBundles(bundleData);
        setLoading(false);
      }, (err) => {
        console.error("Firestore bundles error:", err);
        setLoading(false);
      });

      return () => unsubscribeBundles();
    });

    return () => unsubAnnouncement();
  }, []);

  const filteredBundles = bundles
    .filter(b => b.network === activeTab)
    .sort((a, b) => {
      if (activeTab === 'AirtelTigo') {
        // Sort by data amount (GB) for AirtelTigo
        const parseGB = (amountStr: string) => {
          const match = amountStr.match(/([\d.]+)\s*(GB|MB)/i);
          if (!match) return 0;
          const val = parseFloat(match[1]);
          return match[2].toUpperCase() === 'MB' ? val / 1024 : val;
        };
        return parseGB(a.dataAmount) - parseGB(b.dataAmount);
      }
      // Default sort by price for others
      return a.price - b.price;
    });

  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-tighter mb-4"
          >
            <Crown className="w-4 h-4" />
            Royal Selection 👑
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">CHOOSE YOUR <span className="text-primary">DEAL</span> 👑</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Select your network and enjoy the <span className="text-primary font-bold">King's treatment</span> with our premium data bundles.
          </p>
        </div>

        <Tabs defaultValue="MTN" className="w-full max-w-6xl mx-auto" onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-4 mb-8 no-scrollbar">
            <TabsList className="flex w-max md:grid md:w-full md:grid-cols-4 h-auto gap-4 bg-transparent p-0">
              {['MTN', 'Telecel', 'AirtelTigo', 'streaming'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className={`text-lg md:text-xl font-black h-14 md:h-16 px-6 md:px-0 min-w-[140px] md:min-w-0 border-2 rounded-2xl transition-all hover:border-primary/50 shadow-sm data-[state=active]:shadow-xl data-[state=active]:scale-105 ${
                    tab === activeTab ? getNetworkColor(tab) : 'border-primary/20'
                  }`}
                >
                  {tab === 'streaming' ? (
                    <div className="flex items-center gap-2">
                      <Tv className="w-5 h-5 md:w-6 md:h-6" />
                      TV 👑
                    </div>
                  ) : tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="streaming" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden rounded-[2rem] border-2 hover:border-primary transition-all group bg-white">
                  <div className="h-40 md:h-48 relative overflow-hidden">
                    <img 
                      src="https://picsum.photos/seed/football-pitch/800/400" 
                      alt="Football Pitch" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 md:p-6">
                      <Badge className="bg-primary text-secondary font-black text-[10px] md:text-sm">LIVE SPORTS 👑</Badge>
                    </div>
                  </div>
                  <CardHeader className="p-6 md:p-8">
                    <CardTitle className="text-2xl md:text-3xl font-black tracking-tight">STREAM FOOTBALL LIVE MATCHES 👑</CardTitle>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">
                      Stream live sports here by downloading the app after payment, suitable for Android systems only!
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 pt-0">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Access</span>
                        <div className="flex flex-col">
                          {/* We can apply the same logic for the stream access if needed */}
                          <span className="text-3xl md:text-4xl font-black text-slate-900">GHS 50.00</span>
                        </div>
                      </div>
                      <div className="p-3 md:p-4 rounded-2xl bg-primary/10 text-primary">
                        <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                    <Button 
                      className="w-full h-14 md:h-16 text-lg md:text-xl font-black rounded-2xl shadow-lg bg-secondary text-white hover:bg-primary hover:text-secondary transition-all gap-2"
                      onClick={() => {
                        // Calculate discount for stream access too
                        const originalPrice = 50;
                        const deduction = 2; // Since 50 >= 10
                        // Check if discount bar is active (this would need a global state or another listener)
                        // For simplicity, we'll keep it static here or pass the announcement state down
                        onSelectBundle({
                          id: 'football-stream',
                          name: 'Stream Football Live Matches',
                          dataAmount: 'LIFETIME',
                          price: originalPrice,
                          network: 'MTN',
                          active: true
                        });
                      }}
                    >
                      GET ACCESS NOW 👑
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="flex flex-col justify-center items-center p-8 md:p-12 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200 text-center">
                <Tv className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-slate-400">MORE SERVICES COMING SOON</h3>
                <p className="text-slate-400 text-xs md:text-sm">Netflix, Spotify, and more for the Kings.</p>
              </div>
            </div>
          </TabsContent>

          {['MTN', 'Telecel', 'AirtelTigo'].map((network) => (
            <TabsContent key={network} value={network} className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden rounded-[2rem] border-2">
                      <CardHeader className="p-8">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2" />
                      </CardHeader>
                      <CardContent className="p-8 pt-0">
                        <Skeleton className="h-14 w-full rounded-2xl" />
                      </CardContent>
                    </Card>
                  ))
                ) : filteredBundles.length > 0 ? (
                  filteredBundles.map((bundle, index) => (
                    <motion.div
                      key={bundle.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className={`hover:shadow-[0_20px_50px_rgba(255,215,0,0.15)] transition-all border-2 rounded-[2rem] overflow-hidden group relative bg-white ${
                        bundle.network === 'Telecel' ? 'hover:border-red-600' : 
                        bundle.network === 'AirtelTigo' ? 'hover:border-blue-600' : 
                        'hover:border-primary'
                      }`}>
                        <div className="absolute top-0 right-0 p-4">
                          <Crown className={`w-6 h-6 transition-all group-hover:rotate-12 ${
                            bundle.network === 'Telecel' ? 'text-red-600/20 group-hover:text-red-600' : 
                            bundle.network === 'AirtelTigo' ? 'text-blue-600/20 group-hover:text-blue-600' : 
                            'text-primary/20 group-hover:text-primary'
                          }`} />
                        </div>
                        <CardHeader className={`${
                          bundle.network === 'Telecel' ? 'bg-red-50 border-red-100' : 
                          bundle.network === 'AirtelTigo' ? 'bg-blue-50 border-blue-100' : 
                          'bg-primary/5 border-primary/10'
                        } border-b-2 p-8`}>
                          <div className="flex justify-between items-start mb-4">
                            <Badge className={`${getNetworkBadgeColor(bundle.network)} font-black px-4 py-1 rounded-full`}>{bundle.network}</Badge>
                            <Zap className={`w-6 h-6 animate-bounce ${
                              bundle.network === 'Telecel' ? 'text-red-600 fill-red-600' : 
                              bundle.network === 'AirtelTigo' ? 'text-blue-600 fill-blue-600' : 
                              'text-primary fill-primary'
                            }`} />
                          </div>
                          <CardTitle className="text-4xl font-black mt-2 flex items-baseline gap-2">
                            {bundle.dataAmount}
                            <span className="text-lg font-medium text-slate-500 uppercase tracking-widest">Data</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Royal Price</span>
                              <div className="flex flex-col">
                                {(bundle as any).isDiscounted && (
                                  <span className="text-sm font-bold text-red-500 line-through decoration-2">
                                    GHS {(bundle as any).originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-4xl font-black text-slate-900">GHS {bundle.price.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${
                              bundle.network === 'Telecel' ? 'bg-red-50 text-red-600' : 
                              bundle.network === 'AirtelTigo' ? 'bg-blue-50 text-blue-600' : 
                              'bg-primary/10 text-primary'
                            }`}>
                              <Wifi className="w-8 h-8" />
                            </div>
                          </div>
                          <Button 
                            className={`w-full h-16 text-xl font-black rounded-2xl shadow-lg transition-all gap-2 ${
                              bundle.network === 'Telecel' ? 'bg-red-600 text-white hover:bg-red-700' : 
                              bundle.network === 'AirtelTigo' ? 'bg-blue-600 text-white hover:bg-blue-700' : 
                              'bg-secondary text-white hover:bg-primary hover:text-secondary'
                            }`} 
                            onClick={() => onSelectBundle(bundle)}
                          >
                            BUY NOW 👑
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-24 bg-white rounded-[2rem] border-4 border-dashed border-primary/10">
                    <Smartphone className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">NO BUNDLES YET 👑</h3>
                    <p className="text-slate-500 text-lg">Check back later for {network} Royal deals.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
