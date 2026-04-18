import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Calendar, Tag, CreditCard, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintOrder, setComplaintOrder] = useState<any | null>(null);
  const [complaintMsg, setComplaintMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser?.email) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('email', '==', auth.currentUser.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Query Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReportAdmin = (order: any) => {
    const phone = '233535884851';
    const refNumber = order.phone || order.reference?.slice(-8).toUpperCase() || order.id.slice(-6).toUpperCase();
    const text = `Hello King J, I have an issue with my order! 👑\n\nOrder Bundle: ${order.bundle}\nRef (Number): ${refNumber}\n\nPlease check this for me.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching your royal history...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between mb-8 text-center md:text-left flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              MY ROYAL ORDERS 👑
            </h1>
            <p className="text-slate-500 font-medium">Tracking your data bundle purchases</p>
          </div>
          <Badge variant="outline" className="border-2 border-primary/20 text-primary font-black px-4 py-1.5 rounded-xl">
            {orders.length} TOTAL
          </Badge>
        </div>

        {orders.length === 0 ? (
          <Card className="rounded-[2.5rem] border-4 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">NO ORDERS YET 👑</h2>
            <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">
              You haven't placed any orders. Start saving on data today!
            </p>
            <Button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-primary hover:bg-primary/90 text-secondary font-black rounded-xl px-8"
            >
                SHOP NOW 👑
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="rounded-3xl border-2 border-slate-100 hover:border-primary/30 transition-all hover:shadow-xl group overflow-hidden bg-white">
                  <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-secondary transition-colors">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                          {order.bundle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-500 text-xs font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('en-GB') : 'Recent'}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            Ref: {order.phone || order.reference?.slice(-8).toUpperCase() || order.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                      <p className="text-xl font-black text-primary">GHS {Number(order.amount).toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`
                            font-black text-[10px] uppercase px-3 py-0.5 rounded-lg
                            ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'processing' ? 'bg-blue-100 text-blue-700 animate-pulse' : 
                              order.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                          `}
                        >
                          {order.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 text-[10px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleReportAdmin(order)}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Report to Admin
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
