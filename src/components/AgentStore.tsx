import { useState } from 'react';
import BundleList from './BundleList';
import PaystackPop from '@paystack/inline-js';
import { Button } from '@/components/ui/button';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Bundle, UserProfile } from '../types';
import { Crown, Key, Loader2, Store, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyOrders from './MyOrders';

interface AgentStoreProps {
  profile: UserProfile | null;
  onSelectBundle: (bundle: Bundle) => void;
}

export default function AgentStore({ profile, onSelectBundle }: AgentStoreProps) {
  const [isPaying, setIsPaying] = useState(false);

  const handlePayForAccess = async () => {
    if (!auth.currentUser) return toast.error("Please login to access the Agent Store.");
    
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Paystack configuration is missing.");
      return;
    }

    setIsPaying(true);

    try {
      // Create pre-order record for AGENT ACCESS
      const preOrderRef = doc(collection(db, 'orders'));
      const preOrderId = preOrderRef.id;

      await setDoc(preOrderRef, {
        email: auth.currentUser.email,
        phone: profile?.phoneNumber || "0000000000",
        network: "SYSTEM",
        bundle: "AGENT ACCESS UNLOCK",
        amount: 40,
        status: "pending",
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        customerName: profile?.fullName || auth.currentUser.displayName || 'Aspiring Agent'
      });

      const handler = PaystackPop.setup({
        key: publicKey,
        email: auth.currentUser.email || '',
        amount: 4000, // 40 GHS
        currency: 'GHS',
        metadata: {
           custom_fields: [
              { display_name: "Purpose", variable_name: "purpose", value: "Agent Access Unlock" },
              { display_name: "Order ID", variable_name: "order_id", value: preOrderId }
           ]
        },
        callback: async (response: any) => {
          try {
            await fetch('/api/verifyPayment', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                  reference: response.reference,
                  metadata: { purpose: "Agent Access Unlock", email: auth.currentUser!.email, internalOrderId: preOrderId }
               })
            });
            
            toast.success("Payment successful! The King will review your request shortly. 👑");
          } catch (err) {
            console.error("Agent verification error:", err);
            toast.error("An error occurred. If you were charged, contact King J.");
          } finally {
            setIsPaying(false);
          }
        },
        onClose: () => setIsPaying(false)
      });
      
      handler.openIframe();

    } catch (err) {
      console.error("Agent pre-order error:", err);
      toast.error("Failed to start checkout. Please try again.");
      setIsPaying(false);
    }
  };

  if (profile?.isAgent) {
     return (
       <div className="pt-24 min-h-screen">
          <div className="container mx-auto px-4 max-w-5xl">
             <Tabs defaultValue="store" className="space-y-6">
                <div className="flex flex-col items-center max-w-sm mx-auto mb-8">
                   <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest mb-4 shadow-lg shrink-0">
                      <Crown className="w-4 h-4 text-primary" />
                      AGENT PORTAL
                   </div>
                   
                   <TabsList className="bg-slate-100/50 p-1 rounded-2xl w-full border-2 border-slate-100 flex h-auto shadow-inner mt-4">
                      <TabsTrigger value="store" className="flex-1 rounded-xl font-black py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all uppercase tracking-widest text-[10px]">
                         <Store className="w-4 h-4 mr-2" />
                         Store
                      </TabsTrigger>
                      <TabsTrigger value="tracking" className="flex-1 rounded-xl font-black py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all uppercase tracking-widest text-[10px]">
                         <Activity className="w-4 h-4 mr-2" />
                         Tracking
                      </TabsTrigger>
                   </TabsList>
                </div>
                
                <TabsContent value="store" className="animate-in fade-in-50 zoom-in-[0.98] duration-300">
                    <BundleList onSelectBundle={onSelectBundle} isAgentMode={true} />
                </TabsContent>

                <TabsContent value="tracking" className="animate-in fade-in-50 zoom-in-[0.98] duration-300">
                    <div className="bg-slate-50/50 rounded-3xl pb-8 border border-slate-100">
                       <MyOrders />
                    </div>
                </TabsContent>
             </Tabs>
          </div>
       </div>
     );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative z-10 border-4 border-slate-100">
           <div className="w-24 h-24 bg-primary text-secondary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl -rotate-6">
              <Key className="w-12 h-12" />
           </div>
           
           <h2 className="text-4xl font-black mb-4">AGENT ACCESS</h2>
           <p className="text-slate-500 font-bold leading-relaxed mb-6">
              Become a verified agent to unlock <span className="text-primary uppercase tracking-widest">exclusive wholesale discounts</span>.
           </p>

           <Button 
             className="w-full h-16 text-xl font-black rounded-2xl bg-slate-900 text-white hover:bg-black transition-all gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
             onClick={handlePayForAccess}
             disabled={isPaying}
           >
              {isPaying ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Crown className="w-6 h-6 text-primary" /> UNLOCK FOR 40 GHS</>}
           </Button>
        </div>
    </div>
  );
}
