import React, { useState, useEffect } from 'react';
import { db, auth } from '@/src/lib/firebase';
import emailjs from '@emailjs/browser';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Bundle, Order, Network, UserProfile, Message, StreamAccess } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Check, X, RefreshCw, Edit2, Wallet, CheckCircle, XCircle, ShoppingBag, MessageSquare, Mail as MailIcon, Trophy, Lock, Unlock, Zap, Users, Star, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamAccess, setStreamAccess] = useState<StreamAccess[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [ghBalance, setGhBalance] = useState<number | null>(null);
  const [configStatus, setConfigStatus] = useState({
    emailService: false,
    emailTemplate: false,
    paystackPublic: false,
    paystackSecret: false,
    gigshubKey: false,
  });

  const [announcement, setAnnouncement] = useState({
    id: 'discount-bar',
    text: '',
    active: false,
    type: 'discount' as 'discount' | 'info' | 'alert'
  });

  // New/Edit Bundle Form State
  const [bundleForm, setBundleForm] = useState({
    name: '',
    dataAmount: '',
    price: '',
    network: 'MTN' as Network,
    offerSlug: '',
    volume: '',
  });

  useEffect(() => {
    // Fetch GigsHub balance if available
    fetch('/api/balance')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'error') {
          console.warn("GigsHub Balance Error:", data.message);
          setGhBalance(-1); // Use -1 to indicate error
        } else if (data.balance !== undefined) {
          setGhBalance(data.balance);
        }
      })
      .catch(err => console.error("Failed to fetch balance:", err));

    // Fetch config status from backend
    fetch('/api/config-status')
      .then(res => res.json())
      .then(data => setConfigStatus(data))
      .catch(err => console.error("Failed to fetch config status:", err));

    // Fetch announcement status
    const announcementDoc = doc(db, 'settings', 'announcement');
    const unsubAnnouncement = onSnapshot(announcementDoc, (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncement(snapshot.data() as any);
      }
    });

    const bundlesUnsubscribe = onSnapshot(collection(db, 'bundles'), (snapshot) => {
      setBundles(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          network: (data.network === 'Vodafone' ? 'Telecel' : data.network) as Network
        } as Bundle;
      }));
    });

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });

    const streamQuery = query(collection(db, 'streamAccess'), orderBy('createdAt', 'desc'));
    const streamUnsubscribe = onSnapshot(streamQuery, (snapshot) => {
      setStreamAccess(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StreamAccess)));
    });

    const usersQuery = query(collection(db, 'users'));
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as UserProfile)));
    });

    return () => {
      bundlesUnsubscribe();
      ordersUnsubscribe();
      messagesUnsubscribe();
      streamUnsubscribe();
      usersUnsubscribe();
      unsubAnnouncement();
    };
  }, []);

  const handleAddOrUpdateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...bundleForm,
        price: parseFloat(bundleForm.price),
      };

      if (editingBundle) {
        await updateDoc(doc(db, 'bundles', editingBundle.id), payload);
        toast.success("Bundle updated successfully!");
        setEditingBundle(null);
      } else {
        await addDoc(collection(db, 'bundles'), {
          ...payload,
          active: true,
        });
        toast.success("Bundle added successfully!");
      }
      setBundleForm({ name: '', dataAmount: '', price: '', network: 'MTN', offerSlug: '', volume: '' });
    } catch (error: any) {
      console.error("Bundle operation error:", error);
      toast.error(editingBundle ? `Failed to update bundle: ${error.message}` : `Failed to add bundle: ${error.message}`);
    }
  };

  const handleEditClick = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setBundleForm({
      name: bundle.name,
      dataAmount: bundle.dataAmount,
      price: bundle.price.toString(),
      network: (bundle.network as string) === 'Vodafone' ? 'Telecel' : bundle.network,
      offerSlug: bundle.offerSlug || '',
      volume: bundle.volume || '',
    });
  };

  const handleClearOrders = async () => {
    try {
      if (orders.length === 0) return;
      const deletePromises = orders.map(order => deleteDoc(doc(db, 'orders', order.id)));
      await Promise.all(deletePromises);
      toast.success("All orders have been permanently cleared! 👑");
    } catch (error) {
      console.error("Clear orders error:", error);
      toast.error("Failed to clear orders.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success("Order permanently deleted! 👑");
    } catch (error) {
      toast.error("Failed to delete order.");
    }
  };

  const handleToggleBundle = async (bundle: Bundle) => {
    try {
      await updateDoc(doc(db, 'bundles', bundle.id), { active: !bundle.active });
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  const handleDeleteBundle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bundles', id));
      toast.success("Bundle deleted.");
    } catch (error) {
      toast.error("Delete failed.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], order: Order) => {
    try {
      let gigshubSuccess = false;
      if (status === 'processing' && order.recipientPhone && order.offerSlug && order.volume) {
        toast.info("Sending to GigsHub...");
        try {
          const res = await fetch('/api/buy-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              network: order.recipientNetwork,
              phone: order.recipientPhone,
              volume: order.volume,
              offerSlug: order.offerSlug,
              orderId: orderId,
            }),
          });
          
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'GigsHub proxy failed');
          }
          toast.success("Successfully processed via GigsHub!");
          gigshubSuccess = true;
        } catch (hubErr: any) {
             console.error("GigsHub trigger error", hubErr);
             toast.error(`GigsHub Processing Failed: ${hubErr.message}. Marked as processing locally.`);
        }
      }

      // If GigsHub succeeds, it updates the firestore order automatically. We only manually update for failures or manual actions.
      if (!gigshubSuccess) {
        await updateDoc(doc(db, 'orders', orderId), { status });
      }
      
      if (status === 'processing' && !gigshubSuccess) {
        // Notify user that process is accepted
        await addDoc(collection(db, 'messages'), {
          userId: order.userId,
          userEmail: 'admin@kingjdeals.com',
          userName: 'Admin King J',
          subject: 'Order Update',
          message: `🟢 Process accepted, Royal. Please check your history to track your order delivery. Order ID: ${orderId}`,
          status: 'unread',
          createdAt: serverTimestamp(),
        });
      }

      if (status === 'delivered') {
        // 1. Notify user in portal
        await addDoc(collection(db, 'messages'), {
          userId: order.userId,
          userEmail: 'admin@kingjdeals.com',
          userName: 'King J Deals 👑',
          subject: '👑 ORDER DELIVERED! 👑',
          message: `Royal ${order.customerName}, your order for ${order.bundleName} has been DELIVERED! 👑

Thank you for choosing King J Deals. We hope to see you again soon! 👑`,
          status: 'unread',
          createdAt: serverTimestamp(),
        });

        // 2. Send Email to Customer via EmailJS
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey && order.userEmail) {
          const emailParams = {
            to_name: order.customerName,
            to_email: order.userEmail,
            order_id: orderId,
            service_name: order.bundleName,
            amount: `GHS ${order.amountSent.toFixed(2)}`,
            message: `👑 THANK YOU FOR PURCHASING FROM KING J DEALS! 👑

Your order has been successfully delivered.

Order Details:
- Service: ${order.bundleName}
- Amount: GHS ${order.amountSent.toFixed(2)}
- Reference: ${order.referenceCode}

We appreciate your business, Royal! 👑`,
            site_name: "King J Deals Site 👑"
          };

          emailjs.send(serviceId, templateId, emailParams, publicKey)
            .then(() => console.log('Thank you email sent to customer!'))
            .catch(err => console.error('Failed to send thank you email:', err));
        }
      }

      toast.success(`Order marked as ${status}!`);
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { status: 'read' });
      toast.success("Message marked as read.");
    } catch (error) {
      toast.error("Failed to update message.");
    }
  };

  const handleTestEmail = async () => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      toast.error("EmailJS settings are missing in Secrets! ❌");
      console.error("Missing config:", { serviceId: !!serviceId, templateId: !!templateId, publicKey: !!publicKey });
      return;
    }

    toast.info("Sending test email... ⏳");

    const testParams = {
      to_name: "Admins (King J & Yhaw)",
      customer_name: "TEST CUSTOMER",
      order_id: "TEST-12345",
      service_name: "TEST SERVICE",
      amount: "GHS 0.00",
      reference: "TEST-REF",
      recipient_info: "0000000000 (TEST)",
      customer_email: "test@example.com",
      site_name: "King J Deals Site 👑",
      admin_emails: "jeffreybonneya@gmail.com, emmagyapong62@gmail.com"
    };

    try {
      await emailjs.send(serviceId, templateId, testParams, publicKey);
      toast.success("Test email sent successfully! Check your Gmail. ✅");
    } catch (error: any) {
      console.error("EmailJS Test Error:", error);
      toast.error(`Email failed: ${error.text || error.message || "Unknown error"}`);
    }
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const announcementDoc = doc(db, 'settings', 'announcement');
      const docSnap = await getDoc(announcementDoc);
      
      if (docSnap.exists()) {
        await updateDoc(announcementDoc, announcement);
      } else {
        // If it doesn't exist, we create it
        const { setDoc } = await import('firebase/firestore');
        await setDoc(announcementDoc, announcement);
      }
      
      toast.success("Discount bar updated successfully! 👑");
    } catch (error: any) {
      console.error("Announcement update error:", error);
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  const handleTestSMS = async () => {
    toast.info("Notification feature is now handled via EmailJS. 👑");
  };
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      toast.success("Message deleted.");
    } catch (error) {
      toast.error("Failed to delete message.");
    }
  };

  const handleUpdateStreamAccess = async (accessId: string, status: StreamAccess['status']) => {
    try {
      await updateDoc(doc(db, 'streamAccess', accessId), { 
        status,
        updatedAt: serverTimestamp()
      });
      toast.success(`Stream access ${status}!`);
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTopCustomer = () => {
    if (orders.length === 0) return null;
    const customerStats: Record<string, { email: string, name: string, total: number, count: number }> = {};
    
    // Admin emails to exclude
    const adminEmails = ['jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
    
    orders.filter(order => order.paymentStatus === 'success').forEach(order => {
      const email = order.userEmail || 'Unknown';
      
      // Exclude admins
      if (adminEmails.includes(email.toLowerCase())) return;
      
      if (!customerStats[email]) {
        customerStats[email] = { email, name: order.customerName || 'Customer', total: 0, count: 0 };
      }
      customerStats[email].total += order.amountSent || 0;
      customerStats[email].count += 1;
    });

    const statsArray = Object.values(customerStats);
    if (statsArray.length === 0) return null;

    // Sort by count (frequency) primarily, then total amount secondarily
    return statsArray.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.total - a.total;
    })[0];
  };

  const topCustomer = getTopCustomer();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-xl border border-blue-100">
            <Users className="w-4 h-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Total Users</span>
              <span className="text-sm font-black text-blue-700">{users.length}</span>
            </div>
          </div>
          {ghBalance !== null && (
            <div className={`flex items-center gap-2 px-3 py-1 ${ghBalance === -1 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} rounded-xl border`}>
              <Wallet className={`w-4 h-4 ${ghBalance === -1 ? 'text-red-600' : 'text-green-600'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">GigsHub Balance</span>
                <span className={`text-sm font-black ${ghBalance === -1 ? 'text-red-700' : 'text-green-700'}`}>
                  {ghBalance === -1 ? 'API REVOKED/ERROR' : `GHS ${ghBalance.toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
          {topCustomer && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-xl border border-amber-100">
              <Star className="w-4 h-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Top Customer</span>
                <span className="text-sm font-black text-amber-700 truncate max-w-[120px]">{topCustomer.name}</span>
              </div>
            </div>
          )}
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.emailService ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Email Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.emailTemplate ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Email Template</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.gigshubKey ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase">GigsHub API</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          <Button variant="outline" size="sm" onClick={handleTestEmail} className="gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 h-8">
            <MailIcon className="w-4 h-4" />
            Test Gmail
          </Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
          <TabsTrigger value="orders" className="bg-white border shadow-sm">Orders ({orders.filter(o => o.paymentStatus === 'success').length})</TabsTrigger>
          <TabsTrigger value="discounts" className="bg-white border shadow-sm">Discount Bar 👑</TabsTrigger>
          <TabsTrigger value="users" className="bg-white border shadow-sm">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="stream" className="bg-white border shadow-sm">Stream Access ({streamAccess.filter(s => s.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="messages" className="bg-white border shadow-sm">Messages ({messages.filter(m => m.status === 'unread').length})</TabsTrigger>
          <TabsTrigger value="bundles" className="bg-white border shadow-sm">Manage Bundles</TabsTrigger>
        </TabsList>

        <TabsContent value="discounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Manage Discount Bar & Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAnnouncement} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Announcement Text</Label>
                    <Input 
                      value={announcement.text} 
                      onChange={e => setAnnouncement({...announcement, text: e.target.value})} 
                      placeholder="e.g. 👑 MASSIVE DISCOUNT: Get 10GB for only GHS 10 today!" 
                    />
                    <p className="text-xs text-slate-500">This text will appear at the very top of the site for all customers.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Bar Type</Label>
                    <Select 
                      value={announcement.type} 
                      onValueChange={(v) => setAnnouncement({...announcement, type: v as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount (Gold/Primary)</SelectItem>
                        <SelectItem value="info">Information (Blue)</SelectItem>
                        <SelectItem value="alert">Alert (Red)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border">
                  <div className="flex-1">
                    <h4 className="font-bold">Active Status</h4>
                    <p className="text-sm text-slate-500">Turn this on to show the bar to customers.</p>
                  </div>
                  <Button 
                    type="button"
                    variant={announcement.active ? "default" : "outline"}
                    onClick={() => setAnnouncement({...announcement, active: !announcement.active})}
                    className="gap-2"
                  >
                    {announcement.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {announcement.active ? "Currently Visible" : "Hidden"}
                  </Button>
                </div>

                <Button type="submit" className="w-full md:w-auto px-8 gap-2">
                  <Check className="w-4 h-4" />
                  Save Changes
                </Button>
              </form>

              <div className="mt-8 p-6 border-2 border-dashed rounded-3xl">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Preview</h4>
                {announcement.active ? (
                  <div className={`p-3 rounded-xl text-center font-bold text-sm ${
                    announcement.type === 'discount' ? 'bg-primary text-white' :
                    announcement.type === 'alert' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {announcement.text || "No text provided"}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 italic">
                    Discount bar is currently hidden.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Registered Royal Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isAdminUser = u.role === 'admin' || ['jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'].includes(u.email?.toLowerCase() || '');
                    
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold">{u.fullName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={isAdminUser ? 'default' : 'outline'}>
                            {isAdminUser ? 'admin' : u.role || 'user'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stream">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Football Stream Access Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streamAccess.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="text-xs">
                        {access.createdAt?.toDate ? access.createdAt.toDate().toLocaleString() : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{access.userName}</span>
                          <span className="text-xs text-slate-500">{access.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{access.referenceCode}</TableCell>
                      <TableCell className="font-black">GHS {(access.amountPaid || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={access.status === 'approved' ? 'default' : access.status === 'pending' ? 'outline' : 'destructive'}>
                          {access.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {access.status !== 'approved' && (
                            <Button size="sm" variant="outline" className="text-green-600 gap-1" onClick={() => handleUpdateStreamAccess(access.id, 'approved')}>
                              <Unlock className="w-4 h-4" /> Allow Access
                            </Button>
                          )}
                          {access.status === 'approved' && (
                            <Button size="sm" variant="outline" className="text-red-600 gap-1" onClick={() => handleUpdateStreamAccess(access.id, 'revoked')}>
                              <Lock className="w-4 h-4" /> Revoke Access
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {streamAccess.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">No stream access requests found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Customer Support Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id} className={msg.status === 'unread' ? 'bg-primary/5' : ''}>
                      <TableCell className="text-xs">
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{msg.userName}</span>
                          <span className="text-xs text-slate-500">{msg.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{msg.subject || 'No Subject'}</TableCell>
                      <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                      <TableCell>
                        <Badge variant={msg.status === 'unread' ? 'default' : 'outline'}>
                          {msg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {msg.status === 'unread' && (
                            <Button size="sm" variant="outline" className="text-green-600 gap-1" onClick={() => handleMarkMessageRead(msg.id)}>
                              <Check className="w-4 h-4" /> Read
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-red-600 gap-1" onClick={() => handleDeleteMessage(msg.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {messages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">No support messages found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              {orders.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearOrders} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All Orders
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Recipient (Data)</TableHead>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className={order.paymentStatus !== 'success' ? 'opacity-70 bg-slate-50 relative' : ''}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex flex-col">
                          <span>#{order.id.slice(-6).toUpperCase()}</span>
                          {order.externalOrderId && (
                            <Badge variant="outline" className="text-[8px] h-3 px-1 mt-1 bg-green-50">GH: {order.externalOrderId}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{order.recipientPhone}</span>
                          <span className="text-[10px] text-slate-500">{order.recipientNetwork}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.bundleName}</span>
                          {order.dataAmount && <span className="text-[10px] text-primary font-bold uppercase">{order.dataAmount}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-black">GHS {(order.amountSent || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{order.referenceCode}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.paymentStatus !== 'success' ? (
                             <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">Awaiting Payment</Badge>
                          ) : (
                             <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold tracking-widest uppercase text-[10px]">Paid</Badge>
                          )}
                          {order.paymentStatus === 'success' && getStatusBadge(order.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {order.paymentStatus === 'success' && (order.status === 'pending' || order.status === 'processing') && (
                            <Button size="sm" variant="outline" className="h-8 text-blue-600 gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200" onClick={() => handleUpdateOrderStatus(order.id, 'processing', order)}>
                              <RefreshCw className="h-3 w-3" />
                              Send to GigsHub
                            </Button>
                          )}
                          {order.paymentStatus === 'success' && order.status === 'processing' && (
                            <Button size="sm" variant="outline" className="h-8 text-green-600 gap-1" onClick={() => handleUpdateOrderStatus(order.id, 'delivered', order)}>
                              <Check className="h-3 w-3" />
                              Mark Delivered
                            </Button>
                          )}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Button size="sm" variant="outline" className="h-8 text-red-600 gap-1" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled', order)}>
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          )}
                          {order.paymentStatus === 'success' && (order.status === 'cancelled' || order.status === 'delivered') && (
                            <Button size="sm" variant="outline" className="h-8 text-amber-600 gap-1" onClick={() => handleUpdateOrderStatus(order.id, 'pending', order)}>
                              <RotateCcw className="h-3 w-3" />
                              Recall
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-8 text-slate-600 gap-1" onClick={() => handleDeleteOrder(order.id)}>
                            <Trash2 className="h-3 w-3" />
                            Delete
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
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{editingBundle ? 'Edit Bundle' : 'Add New Bundle'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddOrUpdateBundle} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bundle Name</Label>
                    <Input value={bundleForm.name} onChange={e => setBundleForm({...bundleForm, name: e.target.value})} placeholder="e.g. 1GB Non-Expiry" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Amount</Label>
                    <Input value={bundleForm.dataAmount} onChange={e => setBundleForm({...bundleForm, dataAmount: e.target.value})} placeholder="e.g. 1GB" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (GHS)</Label>
                    <Input type="number" step="0.01" value={bundleForm.price} onChange={e => setBundleForm({...bundleForm, price: e.target.value})} placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Select value={bundleForm.network} onValueChange={(v) => setBundleForm({...bundleForm, network: v as Network})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="Telecel">Telecel</SelectItem>
                        <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>GigsHub Offer Slug (Optional for Auto-Fulfillment)</Label>
                    <Input value={bundleForm.offerSlug} onChange={e => setBundleForm({...bundleForm, offerSlug: e.target.value})} placeholder="e.g. mtn_data_bundle" />
                    <p className="text-[10px] text-slate-500 italic">If provided, this bundle will be automatically fulfilled via GigsHub API.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>GigsHub Volume (Optional)</Label>
                    <Input value={bundleForm.volume} onChange={e => setBundleForm({...bundleForm, volume: e.target.value})} placeholder="e.g. 1" />
                    <p className="text-[10px] text-slate-500 italic">The numeric volume for GigsHub (e.g., 1 for 1GB). If empty, we extract it from Data Amount.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 gap-2">
                      {editingBundle ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingBundle ? 'Update Bundle' : 'Add Bundle'}
                    </Button>
                    {editingBundle && (
                      <Button type="button" variant="outline" onClick={() => {
                        setEditingBundle(null);
                        setBundleForm({ name: '', dataAmount: '', price: '', network: 'MTN' });
                      }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Existing Bundles</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles.map((bundle) => (
                      <TableRow key={bundle.id}>
                        <TableCell className="font-medium">{bundle.name}</TableCell>
                        <TableCell><Badge variant="outline">{bundle.network}</Badge></TableCell>
                        <TableCell>GHS {(bundle.price || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleBundle(bundle)}>
                            <Badge variant={bundle.active ? "default" : "secondary"}>
                              {bundle.active ? "Active" : "Inactive"}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditClick(bundle)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteBundle(bundle.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </Tabs>
    </div>
  );
}
