import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import emailjs from '@emailjs/browser';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Bundle, Order, Network, UserProfile, Message, StreamAccess } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Check, RefreshCw, ShoppingBag, MessageSquare, Mail as MailIcon, Trophy, Zap, Users, Star, CheckCircle, XCircle, Wallet, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [ghBalance, setGhBalance] = useState<number | null>(null);

  const [announcement, setAnnouncement] = useState({
    id: 'discount-bar',
    text: '',
    active: false,
    type: 'discount' as 'discount' | 'info' | 'alert'
  });

  const [bundleForm, setBundleForm] = useState({
    name: '',
    dataAmount: '',
    price: '',
    network: 'MTN' as Network,
    offerSlug: '',
    volume: '',
  });

  useEffect(() => {
    // 1. Fetch GigsHub Balance
    const fetchBalance = () => {
      fetch('/api/balance')
        .then(res => res.json())
        .then(data => {
          if (data.balance !== undefined) setGhBalance(data.balance);
        })
        .catch(console.error);
    };
    fetchBalance();
    const balanceInterval = setInterval(fetchBalance, 60000); // Pulse every minute

    // 2. Fetch Announcement
    const unsubAnnouncement = onSnapshot(doc(db, 'settings', 'announcement'), (snapshot) => {
      if (snapshot.exists()) setAnnouncement(snapshot.data() as any);
    });

    // 3. Listen for Orders (Real-time)
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    // 4. Listen for Messages
    const unsubMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });

    // 5. Fetch Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as UserProfile)));
    });

    return () => {
      clearInterval(balanceInterval);
      unsubAnnouncement();
      unsubOrders();
      unsubMessages();
      unsubUsers();
    };
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], order: Order) => {
    try {
      if (status === 'processing' && order.recipientPhone) {
        toast.info("Manually triggering GigsHub fulfillment...");
        const res = await fetch('/api/buy-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            network: order.recipientNetwork,
            phone: order.recipientPhone,
            volume: order.volume || order.dataAmount?.replace(/[^0-9.]/g, ''),
            offerSlug: order.offerSlug,
            orderId: orderId
          })
        });
        if (!res.ok) throw new Error("GigsHub Trigger Failed");
        toast.success("Fulfillment triggered! 👑");
      } else {
        await updateDoc(doc(db, 'orders', orderId), { status });
        toast.success(`Order marked as ${status}!`);
      }
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    }
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'settings', 'announcement'), announcement);
      toast.success("Announcement updated! 👑");
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-50 text-blue-700">Processing</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700">Delivered</Badge>;
      case 'failed': return <Badge variant="outline" className="bg-red-50 text-red-700 font-bold uppercase">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">ROYAL COMMAND CENTER 👑</h1>
          <p className="text-slate-500 font-medium italic">Automated Data Distribution Dashboard</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
           {ghBalance !== null && (
             <div className="bg-secondary text-white px-6 py-4 rounded-[1.5rem] shadow-xl border-l-4 border-primary group hover:scale-105 transition-transform cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/20 rounded-lg">
                   <Wallet className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-0.5">GigsHub Wallet</p>
                   <p className="text-2xl font-black">GHS {ghBalance.toFixed(2)}</p>
                 </div>
               </div>
             </div>
           )}
           
           <div className="bg-white border-2 border-slate-100 px-6 py-4 rounded-[1.5rem] shadow-md group hover:border-primary/20 transition-all">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 rounded-lg">
                 <ShoppingBag className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Orders</p>
                 <p className="text-2xl font-black text-slate-900">{orders.length}</p>
               </div>
             </div>
           </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <TabsList className="flex flex-wrap h-auto gap-3 bg-transparent p-0">
          <TabsTrigger value="orders" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">ORDERS 👑</TabsTrigger>
          <TabsTrigger value="announcement" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">ANNOUNCEMENT</TabsTrigger>
          <TabsTrigger value="users" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">CUSTOMERS</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="rounded-[2rem] border-2 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-8">
               <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-black">Active Stream</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2 rounded-xl h-10 border-2">
                    <RefreshCw className="w-4 h-4" /> REFRESH
                  </Button>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b-2">
                    <TableHead className="font-black p-6">Customer</TableHead>
                    <TableHead className="font-black">Details</TableHead>
                    <TableHead className="font-black">Payment</TableHead>
                    <TableHead className="font-black">Fulfillment</TableHead>
                    <TableHead className="font-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{order.customerName}</span>
                          <span className="text-xs text-slate-400 uppercase font-bold">{order.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <Badge className="w-fit mb-1 bg-secondary text-white">{order.recipientNetwork}</Badge>
                           <span className="font-mono text-sm font-bold">{order.recipientPhone}</span>
                           <span className="text-[10px] font-black text-primary mt-1">{order.bundleName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={order.paymentStatus === 'success' ? 'default' : 'outline'}
                            className={`font-black uppercase text-[10px] ${order.paymentStatus === 'success' ? 'bg-green-600' : 'text-slate-400'}`}
                          >
                            {order.paymentStatus || 'pending'}
                          </Badge>
                          <span className="text-[10px] font-mono opacity-50">{order.referenceCode?.slice(0, 10)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                           {getStatusBadge(order.status)}
                           {order.externalOrderId && (
                             <span className="text-[9px] font-mono text-blue-600 font-bold">GH: {order.externalOrderId}</span>
                           )}
                           {order.failureReason && (
                             <span className="text-[9px] text-red-500 max-w-[150px] truncate">{order.failureReason}</span>
                           )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status !== 'delivered' && (
                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-green-50 hover:text-green-600" onClick={() => handleUpdateOrderStatus(order.id, 'delivered', order)}>
                              <Check className="w-5 h-5" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600" onClick={() => deleteDoc(doc(db, 'orders', order.id))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcement">
           <Card className="rounded-[2rem] border-2 bg-white">
             <CardHeader className="p-8">
               <CardTitle className="text-2xl font-black">Discount Settings 👑</CardTitle>
             </CardHeader>
             <CardContent className="p-8 pt-0">
               <form onSubmit={handleUpdateAnnouncement} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <Label className="font-bold underline underline-offset-4">Top Bar Text</Label>
                    <Input 
                      value={announcement.text} 
                      onChange={e => setAnnouncement({...announcement, text: e.target.value})} 
                      placeholder="e.g. 👑 MASSIVE DISCOUNT: Get 10GB for only GHS 10 today!" 
                      className="rounded-xl h-12 border-2"
                    />
                  </div>
                  
                  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2">
                    <div className="flex-1">
                      <h4 className="font-black text-sm uppercase">Active Status</h4>
                      <p className="text-xs text-slate-500 font-medium">When active, the top bar appears and dynamic pricing is applied.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAnnouncement({...announcement, active: !announcement.active})}
                      className={`w-16 h-8 rounded-full transition-all relative ${announcement.active ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all transform ${announcement.active ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>

                  <Button type="submit" className="h-14 px-10 rounded-2xl font-black text-lg bg-secondary text-white shadow-lg hover:bg-primary transition-all">
                    SAVE ROYAL STATUS 👑
                  </Button>
               </form>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="users">
           <Card className="rounded-[2rem] border-2 bg-white">
             <CardHeader className="p-8">
               <CardTitle className="text-2xl font-black">Customer Base</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="p-6 font-black uppercase text-xs">Royal Customer</TableHead>
                      <TableHead className="font-black uppercase text-xs">Email</TableHead>
                      <TableHead className="font-black uppercase text-xs">Balance</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {users.map(u => (
                     <TableRow key={u.id} className="hover:bg-slate-50">
                       <TableCell className="p-6 font-bold">{u.fullName}</TableCell>
                       <TableCell className="font-mono text-sm">{u.email}</TableCell>
                       <TableCell className="font-black text-primary">GHS {u.walletBalance?.toFixed(2) || '0.00'}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
