import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import emailjs from '@emailjs/browser';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Bundle, Order, Network, UserProfile, Message, StreamAccess, Complaint } from '@/src/types';
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
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [ghBalance, setGhBalance] = useState<number | null>(null);
  const [emailStatus, setEmailStatus] = useState<'connected' | 'error' | 'checking'>('checking');

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
    network: 'MTN',
    active: true,
    offerSlug: '',
    volume: '',
  });

  useEffect(() => {
    // 1. Fetch Announcement
    const unsubAnnouncement = onSnapshot(doc(db, 'settings', 'announcement'), (snapshot) => {
      if (snapshot.exists()) setAnnouncement(snapshot.data() as any);
    });

    // 2. Listen for Bundles
    const unsubBundles = onSnapshot(collection(db, 'bundles'), (snapshot) => {
      setBundles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle)));
      setLoading(false);
    });

    // 3. Listen for Orders
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Listen for Messages
    const unsubMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });

    // 5. Fetch Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as UserProfile)));
    });

    // 6. Listen for Complaints
    const unsubComplaints = onSnapshot(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')), (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
    });

    // Check Email Status
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (serviceId && templateId && publicKey) {
      setEmailStatus('connected');
    } else {
      setEmailStatus('error');
    }

    return () => {
      unsubAnnouncement();
      unsubBundles();
      unsubOrders();
      unsubMessages();
      unsubUsers();
      unsubComplaints();
    };
  }, []);

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...bundleForm,
        price: Number(bundleForm.price),
        updatedAt: serverTimestamp(),
      };

      if (editingBundle) {
        await updateDoc(doc(db, 'bundles', editingBundle.id), data);
        toast.success("Bundle updated!");
      } else {
        await addDoc(collection(db, 'bundles'), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success("Bundle added!");
      }
      setEditingBundle(null);
      setBundleForm({ name: '', dataAmount: '', price: '', network: 'MTN', active: true, offerSlug: '', volume: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEditBundle = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setBundleForm({
      name: bundle.name,
      dataAmount: bundle.dataAmount,
      price: String(bundle.price),
      network: bundle.network,
      active: bundle.active ?? true,
      offerSlug: bundle.offerSlug || '',
      volume: bundle.volume || '',
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, orderData?: any) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      
      // If admin delivers an agent unlock order, automatically mark user as regular agent
      if (status === 'delivered' && orderData?.bundle === 'AGENT ACCESS UNLOCK' && orderData.userId) {
          await updateDoc(doc(db, 'users', orderData.userId), { isAgent: true });
          toast.success(`Agent access granted to ${orderData.email}! 👑`);
      }
      
      toast.success(`Order marked as ${status}!`);
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">PENDING</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-black animate-pulse">PROCESSING</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">DELIVERED</Badge>;
      case 'failed': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold">FAILED</Badge>;
      default: return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success("Order deleted successfully! 👑");
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { status: 'resolved' });
      toast.success("Complaint resolved! 👑");
    } catch (error: any) {
      toast.error(`Resolution failed: ${error.message}`);
    }
  };

  const testEmail = async () => {
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        toast.error("EmailJS credentials missing in ENV 👑");
        return;
      }

      toast.info("Sending test email...");
      await emailjs.send(
        serviceId,
        templateId,
        {
          admin_emails: 'jeffreybonneya@gmail.com, emmagyapong62@gmail.com',
          customer_email: 'test@example.com',
          phone: '0XXXXXXXXX',
          network: 'SYSTEM TEST',
          bundle: 'TEST ROYAL BUNDLE',
          amount: 'GHS 0.00',
          reference: 'TEST-KING-J-' + Math.random().toString(36).substring(7).toUpperCase()
        },
        publicKey
      );
      toast.success("Royal test email sent! Check your inbox. 👑");
    } catch (err: any) {
      toast.error(`Royal mail failed: ${err.text || err.message}`);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">ROYAL COMMAND CENTER 👑</h1>
          <p className="text-slate-500 font-medium italic">Order Fulfillment Dashboard</p>
        </div>

        <div className="flex flex-wrap gap-4">
           {/* Email Status Indicator */}
           <div className={`bg-white border-2 px-6 py-4 rounded-[1.5rem] shadow-sm transition-all flex flex-col gap-4 ${emailStatus === 'connected' ? 'border-green-100 hover:border-green-300' : 'border-red-100 hover:border-red-300'}`}>
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${emailStatus === 'connected' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <MailIcon className={`w-6 h-6 ${emailStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`} />
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email System</p>
                       <div className={`w-2 h-2 rounded-full animate-pulse ${emailStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <p className="text-sm font-black uppercase">{emailStatus === 'connected' ? 'KING CONNECTED' : 'SYSTEM ERROR'}</p>
                    {emailStatus === 'connected' && (
                      <p className="text-[8px] text-slate-400 font-bold mt-1 max-w-[150px] leading-tight">
                        IMPORTANT: Check "Allow API access from non-browser environments" in EmailJS Security dashboard.
                      </p>
                    )}
                 </div>
              </div>
              <Button size="sm" variant="outline" className="w-full h-10 text-[10px] font-black uppercase border-2 rounded-lg bg-slate-50 hover:bg-white" onClick={testEmail}>
                 Test Gmail 👑
              </Button>
           </div>
        </div>
      </div>

      <Tabs defaultValue="tracking" className="space-y-8">
        <TabsList className="flex flex-wrap h-auto gap-3 bg-transparent p-0">
          <TabsTrigger value="tracking" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">TRACKING 👑</TabsTrigger>
          <TabsTrigger value="bundles" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">BUNDLES</TabsTrigger>
          <TabsTrigger value="announcement" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">ANNOUNCEMENT</TabsTrigger>
          <TabsTrigger value="users" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-secondary data-[state=active]:text-white">CUSTOMERS</TabsTrigger>
          <TabsTrigger value="complaints" className="bg-white border-2 h-12 px-6 rounded-xl font-black data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:border-red-500 relative">
            COMPLAINTS
            {complaints.filter(c => c.status === 'open').length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                {complaints.filter(c => c.status === 'open').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking">
          <Card className="rounded-[2rem] border-2 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-8">
               <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-black">Orders Tracking 👑</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b-2">
                    <TableHead className="font-black p-6">Customer</TableHead>
                    <TableHead className="font-black">Details</TableHead>
                    <TableHead className="font-black">Royal Price</TableHead>
                    <TableHead className="font-black">Status</TableHead>
                    <TableHead className="font-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold">
                        No orders yet. They show up here immediately on "BUY NOW" 👑
                      </TableCell>
                    </TableRow>
                  ) : orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{order.customerName || order.email}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{order.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                           <Badge className="w-fit mb-1 bg-secondary text-white font-black text-[10px] px-2">{order.network}</Badge>
                           <div className="flex items-center gap-2">
                             <span className="font-mono text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit">{order.phone}</span>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-6 w-16 p-0 text-[9px] font-black uppercase text-slate-500 rounded-md border text-center shadow-sm hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                               onClick={() => {
                                 navigator.clipboard.writeText(order.phone);
                                 toast.success(`Copied: ${order.phone} 👑`);
                               }}
                             >
                               Copy
                             </Button>
                           </div>
                           <span className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tight">{order.bundle}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-black text-secondary">
                          <Wallet className="w-4 h-4 text-primary" />
                          GHS {(order.amount || 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                           {getStatusBadge(order.status)}
                           {order.createdAt && <span className="text-[9px] font-mono text-slate-400">{new Date(order.createdAt?.seconds * 1000).toLocaleString()}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                              onClick={() => handleUpdateOrderStatus(order.id, 'processing', order)}
                            >
                              <Check className="w-3 h-3" />
                              Accept 👑
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button 
                              size="sm" 
                              className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered', order)}
                            >
                              <CheckCircle className="w-3 h-3" />
                              Deliver 👑
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 hover:text-red-600 border-2 transition-colors" 
                            onClick={() => handleDeleteOrder(order.id)}
                          >
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

        <TabsContent value="bundles">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-[2rem] border-2 bg-white h-fit">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black">{editingBundle ? 'EDIT BUNDLE' : 'ADD NEW BUNDLE'}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <form onSubmit={handleSaveBundle} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase">Bundle Name</Label>
                      <Input value={bundleForm.name} onChange={e => setBundleForm({...bundleForm, name: e.target.value})} placeholder="e.g. MTN Royal 10GB" required className="rounded-xl border-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Amount</Label>
                        <Input value={bundleForm.dataAmount} onChange={e => setBundleForm({...bundleForm, dataAmount: e.target.value})} placeholder="10GB" required className="rounded-xl border-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Price (GHS)</Label>
                        <Input type="number" value={bundleForm.price} onChange={e => setBundleForm({...bundleForm, price: e.target.value})} placeholder="20" required className="rounded-xl border-2" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase">Network</Label>
                      <Select value={bundleForm.network} onValueChange={(v: any) => setBundleForm({...bundleForm, network: v})}>
                        <SelectTrigger className="rounded-xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTN">MTN</SelectItem>
                          <SelectItem value="Telecel">Telecel</SelectItem>
                          <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-black bg-secondary text-white hover:bg-primary uppercase">
                       {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                    </Button>
                    {editingBundle && (
                      <Button type="button" variant="ghost" onClick={() => { setEditingBundle(null); setBundleForm({name:'',dataAmount:'',price:'',network:'MTN',active:true,offerSlug:'',volume:''})}} className="w-full">Cancel</Button>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-[2rem] border-2 bg-white overflow-hidden">
                <CardHeader className="p-8 bg-slate-50/50 border-b">
                   <CardTitle className="text-xl font-black">ACTIVE BUNDLES</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-black p-6">Info</TableHead>
                        <TableHead className="font-black text-center">Network</TableHead>
                        <TableHead className="font-black text-right">Price</TableHead>
                        <TableHead className="font-black text-right p-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundles.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="p-6">
                            <div className="flex flex-col">
                              <span className="font-black">{b.name}</span>
                              <span className="text-xs text-slate-400 font-bold">{b.dataAmount}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-2 font-black uppercase">{b.network}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-black text-secondary">GHS {b.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right p-6">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => startEditBundle(b)}><RefreshCw className="w-3 h-3" /></Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg text-red-500" onClick={() => deleteDoc(doc(db, 'bundles', b.id))}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
           </div>
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

        <TabsContent value="complaints">
           <Card className="rounded-[2rem] border-2 bg-white">
             <CardHeader className="p-8">
               <CardTitle className="text-2xl font-black text-red-600">Royal Complaints 👑</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="p-6 font-black uppercase text-xs">Customer</TableHead>
                      <TableHead className="font-black uppercase text-xs">Issue</TableHead>
                      <TableHead className="font-black uppercase text-xs">Status</TableHead>
                      <TableHead className="font-black uppercase text-xs text-right p-6">Resolve</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {complaints.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold">
                         No complaints. The system is flawless! 👑
                       </TableCell>
                     </TableRow>
                   ) : complaints.map(c => (
                     <TableRow key={c.id} className="hover:bg-slate-50">
                       <TableCell className="p-6">
                         <div className="flex flex-col">
                           <span className="font-black">{c.userEmail}</span>
                           <span className="text-[10px] text-slate-400 font-mono tracking-tighter">Order: {c.orderId.slice(-8).toUpperCase()}</span>
                         </div>
                       </TableCell>
                       <TableCell className="py-4">
                         <p className="text-sm font-medium max-w-sm line-clamp-2" title={c.message}>{c.message}</p>
                       </TableCell>
                       <TableCell>
                         <Badge 
                           className={`font-black text-[10px] uppercase ${c.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                         >
                           {c.status}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-right p-6">
                         {c.status === 'open' && (
                           <Button 
                             size="sm" 
                             className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px]"
                             onClick={() => handleResolveComplaint(c.id)}
                           >
                             <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                           </Button>
                         )}
                       </TableCell>
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
