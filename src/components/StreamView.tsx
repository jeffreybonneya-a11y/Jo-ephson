import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tv, ShieldCheck, Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { StreamAccess } from '../types';
import { toast } from 'sonner';

export default function StreamView() {
  const [access, setAccess] = useState<StreamAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'streamAccess'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAccess({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StreamAccess);
      } else {
        setAccess(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRequestAccess = async () => {
    if (!auth.currentUser) return;
    setRequesting(true);
    try {
      await addDoc(collection(db, 'streamAccess'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Royal User',
        userEmail: auth.currentUser.email,
        status: 'pending',
        amountPaid: 0,
        referenceCode: 'REQUESTED-' + Math.random().toString(36).substring(7).toUpperCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Request sent! King J will review it soon. 👑");
    } catch (error) {
      toast.error("Failed to send request.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Connecting to Royal Stream... 👑</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <Badge className="bg-primary text-secondary font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest">
            Royal Entertainment
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9]">
            LIVE <span className="text-primary italic">STREAM</span> ACCESS 👑
          </h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">
            Experience premium entertainment and private streams exclusively for the Royals.
          </p>
        </div>

        {!access ? (
          <Card className="rounded-[3rem] border-4 border-slate-100 overflow-hidden bg-white shadow-2xl">
            <CardHeader className="p-8 md:p-12 text-center bg-slate-50/50 border-b relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
               <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-primary text-secondary rounded-3xl flex items-center justify-center shadow-xl rotate-3">
                    <Tv className="w-10 h-10" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black">GET ACCESS NOW</CardTitle>
                    <CardDescription className="text-lg font-medium mt-2">Join the elite list for live streams.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8 md:p-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <h4 className="font-black text-slate-900">Secure Link</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Encrypted private access to all live sessions.</p>
                  </div>
                  <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                    <Clock className="w-8 h-8 text-primary" />
                    <h4 className="font-black text-slate-900">24/7 Priority</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Royals get notified first before any public stream.</p>
                  </div>
                  <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                    <Play className="w-8 h-8 text-primary" />
                    <h4 className="font-black text-slate-900">HD Quality</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Ultra-smooth 4K streaming experience guaranteed.</p>
                  </div>
               </div>

               <Button 
                onClick={handleRequestAccess}
                disabled={requesting}
                className="w-full h-20 text-2xl font-black rounded-3xl bg-primary hover:bg-primary/90 text-secondary shadow-xl hover:scale-[1.02] transition-all"
               >
                 {requesting ? <Loader2 className="animate-spin w-8 h-8" /> : "REQUEST ACCESS NOW 👑"}
               </Button>
            </CardContent>
          </Card>
        ) : access.status === 'pending' ? (
          <Card className="rounded-[3rem] border-4 border-amber-100 bg-amber-50/30 p-12 text-center">
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
              <Clock className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">REQUEST UNDER REVIEW 👑</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-8 font-medium text-lg leading-relaxed">
              Your request is sitting on the King's desk. You will be granted access once your identity is royal-verified!
            </p>
            <Badge variant="outline" className="border-2 border-amber-200 text-amber-700 font-black px-6 py-2 rounded-full">
              STATUS: PENDING
            </Badge>
          </Card>
        ) : access.status === 'approved' ? (
          <div className="space-y-8">
            <Card className="rounded-[3rem] border-4 border-green-200 overflow-hidden bg-white shadow-2xl">
               <div className="bg-green-600 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">ACCESS GRANTED 👑</h2>
                      <p className="text-green-100 font-medium opacity-90">Welcome to the inner circle.</p>
                    </div>
                  </div>
                  <Button className="bg-white text-green-600 hover:bg-white/90 font-black px-8 py-6 rounded-2xl h-auto text-lg flex items-center gap-2">
                    <Play className="fill-current w-5 h-5" />
                    START STREAMING
                  </Button>
               </div>
               <div className="p-8 md:p-12 text-center bg-slate-900 aspect-video flex flex-col items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/stream/1920/1080')] bg-cover bg-center opacity-30 group-hover:opacity-10 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full flex items-center justify-center backdrop-blur-lg cursor-pointer transition-all scale-100 hover:scale-110 active:scale-95 group/play shadow-2xl">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                    <p className="text-white/60 font-black tracking-widest uppercase text-sm">Waiting for live signal...</p>
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="rounded-[2.5rem] p-8 border-2 bg-slate-50">
                  <div className="flex items-center gap-4 mb-4">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <h4 className="font-black text-slate-900 uppercase">ACCESS CODE</h4>
                  </div>
                  <p className="text-2xl font-mono font-black text-primary tracking-wider">{access.referenceCode}</p>
                  <p className="text-xs text-slate-400 font-medium mt-2">Treat this as your royal key. Do not share.</p>
               </Card>
               <Card className="rounded-[2.5rem] p-8 border-2 bg-slate-50">
                  <div className="flex items-center gap-4 mb-4">
                    <AlertCircle className="w-6 h-6 text-blue-500" />
                    <h4 className="font-black text-slate-900 uppercase">STREAM STATUS</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-2xl font-black text-slate-900 tracking-tight italic">OFFLINE</p>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-2">Next session scheduled for Sunday 👑</p>
               </Card>
            </div>
          </div>
        ) : (
          <Card className="rounded-[3rem] border-4 border-red-100 bg-red-50/30 p-12 text-center">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">ACCESS REVOKED 👑</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-8 font-medium text-lg leading-relaxed">
              Your royal access has been suspended. Please contact support if you believe this is a mistake.
            </p>
            <Button 
                variant="outline"
                className="border-2 border-red-200 text-red-600 font-black px-8 rounded-xl h-12"
                onClick={() => window.open('https://wa.me/233535884851')}
            >
              CONTACT KING J 👑
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
