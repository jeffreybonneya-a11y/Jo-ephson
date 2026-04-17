import { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Order } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Zap, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export default function Leaderboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankings = () => {
    const customerStats: Record<string, { email: string, name: string, total: number, count: number }> = {};
    
    // Admin emails to exclude
    const adminEmails = ['jeffreybonneya@gmail.com', 'emmagyapong62@gmail.com'];
    
    orders.forEach(order => {
      const email = order.userEmail || 'Unknown';
      
      // Exclude admins
      if (adminEmails.includes(email.toLowerCase())) return;
      
      if (!customerStats[email]) {
        customerStats[email] = { email, name: order.customerName || 'Customer', total: 0, count: 0 };
      }
      customerStats[email].total += order.amountSent || 0;
      customerStats[email].count += 1;
    });

    return Object.values(customerStats).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.total - a.total;
    });
  };

  const rankings = getRankings();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="font-black text-slate-500 uppercase tracking-widest">Loading Rankings... 👑</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-3xl mb-6"
        >
          <Trophy className="w-16 h-16 text-primary" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">TOP CUSTOMER <span className="text-primary">RACE</span> 👑</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          The ultimate battle for the <span className="text-primary font-black">Royal Crown</span>!
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white mb-12">
        <CardHeader className="bg-primary text-secondary p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Zap className="absolute top-4 left-4 w-12 h-12 rotate-12" />
            <Crown className="absolute bottom-4 right-4 w-16 h-16 -rotate-12" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-black mb-4">WIN 1GB DATA EVERY WEEK! 🎁</CardTitle>
          <CardDescription className="text-secondary/80 text-lg font-bold leading-relaxed">
            The customer who finishes <span className="text-white underline decoration-wavy underline-offset-4">1st Place</span> at the end of the week will receive a <span className="text-white font-black">FREE 1GB DATA BUNDLE</span>! 👑
            <br />
            <span className="text-sm mt-4 block opacity-70 italic">Rankings are based on purchase frequency and total amount.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b-2 border-slate-100">
                  <TableHead className="w-[100px] font-black text-slate-900 px-8 py-6">RANK</TableHead>
                  <TableHead className="font-black text-slate-900">ROYAL CUSTOMER</TableHead>
                  <TableHead className="font-black text-slate-900 text-center px-8">PURCHASES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((customer, index) => (
                  <TableRow 
                    key={customer.email} 
                    className={`group transition-colors hover:bg-primary/5 ${index === 0 ? 'bg-amber-50/50' : ''}`}
                  >
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg relative">
                        {index === 0 ? (
                          <div className="relative">
                            <Crown className="w-8 h-8 text-amber-500" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">1st</span>
                          </div>
                        ) : index === 1 ? (
                          <Medal className="w-7 h-7 text-slate-400" />
                        ) : index === 2 ? (
                          <Medal className="w-7 h-7 text-amber-700" />
                        ) : (
                          <span className="text-slate-400">#{index + 1}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-black text-lg ${index === 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                          {customer.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-8">
                      <Badge variant="outline" className={`font-black px-3 py-1 rounded-lg ${index === 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                        {customer.count} ORDERS
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {rankings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-24">
                      <div className="flex flex-col items-center gap-4">
                        <Star className="w-12 h-12 text-slate-200 animate-pulse" />
                        <p className="font-black text-slate-400 uppercase tracking-widest">The race hasn't started yet! Be the first! 👑</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-100 rounded-[2rem] p-8 border-2 border-dashed border-slate-200 text-center">
        <h3 className="font-black text-xl mb-2 text-slate-900 uppercase">How to win? 👑</h3>
        <p className="text-slate-500 font-medium">
          Simply keep buying your data bundles from King J Deals. Every purchase counts! 
          The more you buy, the higher you climb. Check back every Sunday to see the final winner!
        </p>
      </div>
    </div>
  );
}
