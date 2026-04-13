import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Bundle, Order, Network } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // New Bundle Form State
  const [newBundle, setNewBundle] = useState({
    name: '',
    dataAmount: '',
    price: '',
    network: 'MTN' as Network,
  });

  useEffect(() => {
    const bundlesUnsubscribe = onSnapshot(collection(db, 'bundles'), (snapshot) => {
      setBundles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle)));
    });

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    return () => {
      bundlesUnsubscribe();
      ordersUnsubscribe();
    };
  }, []);

  const handleAddBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'bundles'), {
        ...newBundle,
        price: parseFloat(newBundle.price),
        active: true,
      });
      setNewBundle({ name: '', dataAmount: '', price: '', network: 'MTN' });
      toast.success("Bundle added successfully!");
    } catch (error) {
      toast.error("Failed to add bundle.");
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

  const handleUpdateOrderStatus = async (orderId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success(`Order ${status}!`);
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="bundles">Manage Bundles</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customerPhone}</span>
                          <span className="text-xs text-slate-500">{order.customerNetwork}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.bundleName}</TableCell>
                      <TableCell>GHS {order.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'confirmed' ? 'default' : 
                          order.status === 'cancelled' ? 'destructive' : 'outline'
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
                <CardTitle>Add New Bundle</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBundle} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bundle Name</Label>
                    <Input value={newBundle.name} onChange={e => setNewBundle({...newBundle, name: e.target.value})} placeholder="e.g. 1GB Non-Expiry" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Amount</Label>
                    <Input value={newBundle.dataAmount} onChange={e => setNewBundle({...newBundle, dataAmount: e.target.value})} placeholder="e.g. 1GB" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (GHS)</Label>
                    <Input type="number" step="0.01" value={newBundle.price} onChange={e => setNewBundle({...newBundle, price: e.target.value})} placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Select value={newBundle.network} onValueChange={(v) => setNewBundle({...newBundle, network: v as Network})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="Vodafone">Vodafone</SelectItem>
                        <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    <Plus className="w-4 h-4" /> Add Bundle
                  </Button>
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
                        <TableCell>GHS {bundle.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleBundle(bundle)}>
                            <Badge variant={bundle.active ? "default" : "secondary"}>
                              {bundle.active ? "Active" : "Inactive"}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteBundle(bundle.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
