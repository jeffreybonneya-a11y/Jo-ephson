import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { StreamAccess } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock, ExternalLink, Download, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function StreamPortal() {
  const [access, setAccess] = useState<StreamAccess | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Get the latest record
        const sorted = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as StreamAccess))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAccess(sorted[0]);
      } else {
        setAccess(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500">Checking your royal access...</p>
      </div>
    );
  }

  if (!access || access.status === 'revoked') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-4 border-dashed border-primary/20 rounded-[2rem] overflow-hidden bg-white shadow-xl">
          <div className="h-48 md:h-64 relative">
            <img 
              src="https://picsum.photos/seed/football-stadium/1200/600" 
              alt="Stadium" 
              className="w-full h-full object-cover grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-secondary/80 flex flex-col items-center justify-center text-white p-4 md:p-8">
              <Lock className="w-12 h-12 md:w-16 md:h-16 mb-4 text-primary animate-pulse" />
              <h2 className="text-2xl md:text-3xl font-black text-center">ACCESS RESTRICTED 👑</h2>
              <p className="text-slate-300 text-center mt-2 max-w-md text-sm md:text-base">
                You need a Royal Stream Pass to watch live football matches. Purchase access from the deals section.
              </p>
            </div>
          </div>
          <CardContent className="p-8 md:p-12 text-center">
            <Button 
              className="h-14 md:h-16 px-6 md:px-10 text-lg md:text-xl font-black rounded-2xl bg-primary text-secondary hover:bg-primary/90 shadow-lg"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              GET ROYAL PASS NOW 👑
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (access.status === 'pending') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="rounded-[2rem] border-2 border-yellow-200 bg-yellow-50/50 p-6 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">PAYMENT VERIFICATION IN PROGRESS 👑</h2>
          <p className="text-slate-600 text-base md:text-lg mb-8 max-w-md mx-auto">
            Royal, we have received your request. Please wait while the King confirms your payment. This usually takes a few minutes.
          </p>
          <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300 px-4 py-2 text-xs md:text-sm font-bold">
            STATUS: PENDING APPROVAL
          </Badge>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-[2rem] border-4 border-primary overflow-hidden bg-white shadow-2xl">
          <div className="bg-primary p-6 md:p-8 text-secondary flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 md:p-3 bg-secondary rounded-2xl text-primary">
                <Trophy className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-black tracking-tighter">ROYAL STREAMING ACTIVE 👑</h2>
                <p className="text-secondary/70 font-bold text-[10px] md:text-sm uppercase tracking-widest">Lifetime Access Granted</p>
              </div>
            </div>
            <Badge className="bg-secondary text-primary font-black px-4 py-1 rounded-full">APPROVED</Badge>
          </div>
          
          <CardContent className="p-6 md:p-12 space-y-8">
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border-2 border-slate-100 space-y-6">
              <div className="flex items-start gap-4">
                <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">ANDROID APP DOWNLOAD</h3>
                  <p className="text-slate-500 font-medium text-sm md:text-base">
                    Download the official streaming app to watch all live football matches in HD.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  className="h-14 md:h-16 text-base md:text-lg font-black rounded-2xl bg-secondary text-white hover:bg-slate-800 gap-2"
                  onClick={() => window.open('https://cricfy.net', '_blank')}
                >
                  <ExternalLink className="w-5 h-5" />
                  OPEN STREAM SITE 👑
                </Button>
                <Button 
                  variant="outline"
                  className="h-14 md:h-16 text-base md:text-lg font-black rounded-2xl border-2 border-primary text-primary hover:bg-primary/10 gap-2"
                  onClick={() => window.open('https://cricfy.net', '_blank')} // Assuming download is on the site
                >
                  <Download className="w-5 h-5" />
                  DOWNLOAD APK 👑
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 md:p-6 rounded-r-3xl flex gap-4">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <p className="text-amber-900 font-bold text-sm md:text-base">IMPORTANT INSTRUCTIONS</p>
                <ul className="text-xs md:text-sm text-amber-800 space-y-1 list-disc list-inside font-medium">
                  <li>This service is optimized for Android devices only.</li>
                  <li>Do not share your access with others.</li>
                  <li>If the stream lags, check your internet connection.</li>
                  <li>Enjoy the matches like a King! 👑</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
