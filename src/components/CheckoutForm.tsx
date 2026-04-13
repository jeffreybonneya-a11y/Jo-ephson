import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bundle, Network } from '@/src/types';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Smartphone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").max(15),
  network: z.enum(['MTN', 'Vodafone', 'AirtelTigo']),
});

interface CheckoutFormProps {
  bundle: Bundle | null;
  onClose: () => void;
}

export default function CheckoutForm({ bundle, onClose }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      network: bundle?.network || 'MTN',
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!bundle) return;
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        customerPhone: data.phone,
        customerNetwork: data.network,
        bundleId: bundle.id,
        bundleName: bundle.name,
        price: bundle.price,
        status: 'pending',
        paymentMethod: `${data.network} MoMo`,
        createdAt: serverTimestamp(),
      });
      setOrderId(docRef.id);
      setOrderComplete(true);
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bundle) return null;

  return (
    <Dialog open={!!bundle} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {!orderComplete ? (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Purchase</DialogTitle>
              <DialogDescription>
                Buying {bundle.dataAmount} {bundle.network} Data for GHS {bundle.price.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number to receive data</Label>
                <Input 
                  id="phone" 
                  placeholder="024XXXXXXX" 
                  {...register('phone')} 
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="network">Network Provider</Label>
                <Select 
                  defaultValue={bundle.network} 
                  onValueChange={(v) => setValue('network', v as Network)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="Vodafone">Vodafone</SelectItem>
                    <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Payment Instructions
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  After clicking "Confirm Order", you will receive a prompt on your phone to authorize the payment of <strong>GHS {bundle.price.toFixed(2)}</strong>.
                </p>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Received!</h2>
            <p className="text-slate-600 mb-6">
              Your order ID is <strong>#{orderId.slice(-6).toUpperCase()}</strong>. <br />
              Please complete the payment prompt on your phone.
            </p>
            
            <div className="space-y-3">
              <Button className="w-full h-12 gap-2" onClick={() => window.open(`https://wa.me/0535884851?text=Hello, I just placed an order %23${orderId.slice(-6).toUpperCase()} and I want to confirm payment.`, '_blank')}>
                <MessageSquare className="w-5 h-5" />
                Confirm on WhatsApp
              </Button>
              <Button variant="outline" className="w-full h-12" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
