import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Bundle, Network } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'motion/react';
import { Smartphone, Wifi, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BundleListProps {
  onSelectBundle: (bundle: Bundle) => void;
}

export default function BundleList({ onSelectBundle }: BundleListProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState<Network>('MTN');

  useEffect(() => {
    const q = query(collection(db, 'bundles'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bundleData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
      setBundles(bundleData);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredBundles = bundles.filter(b => b.network === activeNetwork);

  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Bundle</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Select your network and pick a bundle that fits your needs. All bundles are non-expiry.
          </p>
        </div>

        <Tabs defaultValue="MTN" className="w-full max-w-4xl mx-auto" onValueChange={(v) => setActiveNetwork(v as Network)}>
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12">
            <TabsTrigger value="MTN" className="text-lg font-semibold">MTN</TabsTrigger>
            <TabsTrigger value="Vodafone" className="text-lg font-semibold">Vodafone</TabsTrigger>
            <TabsTrigger value="AirtelTigo" className="text-lg font-semibold">AirtelTigo</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : filteredBundles.length > 0 ? (
              filteredBundles.map((bundle, index) => (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-xl transition-shadow border-2 hover:border-primary/50 overflow-hidden group">
                    <CardHeader className="bg-slate-50 border-b p-6">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-white">{bundle.network}</Badge>
                        <Zap className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="text-2xl mt-4 flex items-baseline gap-1">
                        {bundle.dataAmount}
                        <span className="text-sm font-normal text-slate-500">Data</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500">Price</span>
                          <span className="text-3xl font-bold text-slate-900">GHS {bundle.price.toFixed(2)}</span>
                        </div>
                        <div className="p-3 rounded-full bg-primary/5 text-primary">
                          <Wifi className="w-6 h-6" />
                        </div>
                      </div>
                      <Button className="w-full h-12 text-lg font-bold rounded-xl" onClick={() => onSelectBundle(bundle)}>
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900">No bundles available</h3>
                <p className="text-slate-500">Check back later for {activeNetwork} deals.</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </section>
  );
}
