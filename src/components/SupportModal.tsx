import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Send, MessageSquare, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/src/types';

const messageSchema = z.object({
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function SupportModal({ isOpen, onClose, profile }: SupportModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        userId: profile?.uid || 'anonymous',
        userEmail: profile?.email || 'anonymous',
        userName: profile?.fullName || 'Anonymous User',
        subject: data.subject,
        message: data.message,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      
      toast.success("Message sent to King J! 👑");
      reset();
      onClose();
    } catch (error: any) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-slate-50">
        <div className="bg-secondary p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-3xl font-black text-center tracking-tight">
              ROYAL SUPPORT 👑
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 mt-2">
              Send a message to King J. We'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-slate-700 font-bold">Subject</Label>
              <Input 
                id="subject"
                placeholder="What can we help you with?"
                className="h-12 border-slate-200 focus:border-primary rounded-xl"
                {...register('subject')}
              />
              {errors.subject && <p className="text-xs text-red-500 font-medium">{errors.subject.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-slate-700 font-bold">Your Message</Label>
              <Textarea 
                id="message"
                placeholder="Tell King J your concerns..."
                className="min-h-[150px] border-slate-200 focus:border-primary rounded-xl resize-none"
                {...register('message')}
              />
              {errors.message && <p className="text-xs text-red-500 font-medium">{errors.message.message}</p>}
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              type="button"
              variant="outline"
              className="flex-1 h-14 font-bold rounded-xl border-2"
              onClick={onClose}
              disabled={isLoading}
            >
              CANCEL
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] h-14 font-black text-lg bg-primary text-secondary hover:bg-primary/90 rounded-xl shadow-lg transition-all active:scale-95 gap-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  SEND MESSAGE 👑
                </>
              )}
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <Crown className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-xs text-amber-800 leading-relaxed font-bold">
                Your messages are handled with royal priority. Reach us instantly via WhatsApp for faster response:
              </p>
              <div className="flex flex-col gap-1">
                <a href="https://wa.me/233535884851" target="_blank" rel="noreferrer" className="text-[10px] text-primary font-black hover:underline">👑 CHAT WITH KING J: 0535884851</a>
                <a href="https://wa.me/233541557530" target="_blank" rel="noreferrer" className="text-[10px] text-primary font-black hover:underline">👑 CHAT WITH YHAW: 0541557530</a>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
