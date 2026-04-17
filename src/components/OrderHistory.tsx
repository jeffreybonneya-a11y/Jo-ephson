import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { Order } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Clock, CheckCircle2, XCircle, Loader2, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(orderData);
      setLoading(false);
    }, (error) => {
      console.error("Order history error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Your Orders</h1>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent>
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-slate-500">When you buy data bundles, they will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <h3 className="text-xl font-bold">{order.bundleName}</h3>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Smartphone className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Recipient</span>
                          <span>{order.recipientPhone} ({order.recipientNetwork})</span>
                        </div>
                      </div>
                      {order.dataAmount && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="w-4 h-4" />
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Data Amount</span>
                            <span>{order.dataAmount}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                          <span>{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Package className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Reference</span>
                          <span className="font-mono">{order.referenceCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 md:w-48 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l">
                    <span className="text-xs text-slate-500 mb-1">Amount Sent</span>
                    <span className="text-2xl font-bold">GHS {order.amountSent.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
