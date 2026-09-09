import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Monitor, Gamepad2, ShieldAlert, CheckCircle2, HelpCircle, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KonamiIdGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: string;
}

export default function KonamiIdGuideModal({
  isOpen,
  onClose,
  defaultPlatform = 'Android',
}: KonamiIdGuideModalProps) {
  const platLower = defaultPlatform.toLowerCase();
  const initialTab = platLower.includes('steam')
    ? 'steam'
    : platLower.includes('ios')
    ? 'ios'
    : platLower.includes('console')
    ? 'console'
    : 'android';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0B1A3D] text-white border-2 border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-yellow-400 font-black text-xs uppercase tracking-widest">
            <HelpCircle className="w-4 h-4" />
            Official eFootball™ Account Guide
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            How to Find Your Account Identifier
          </DialogTitle>
          <DialogDescription className="text-blue-200 text-xs sm:text-sm">
            You can provide your <strong>KONAMI ID</strong> or the <strong>email address associated with your eFootball account</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Mandatory Security Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 my-2">
          <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-black text-yellow-300">
              SECURITY WARNING: NEVER ENTER YOUR PASSWORD
            </p>
            <p className="text-[11px] sm:text-xs text-yellow-100/90 leading-relaxed font-medium">
              King J Deals only requires your public <span className="font-bold underline">KONAMI ID</span> or the <span className="font-bold underline">email address</span> associated with your eFootball account. <strong>Never enter or share your KONAMI/eFootball password</strong> with anyone.
            </p>
          </div>
        </div>

        <Tabs defaultValue={initialTab} className="w-full mt-2">
          <TabsList className="grid grid-cols-4 bg-[#061026] p-1 rounded-2xl border border-blue-500/20">
            <TabsTrigger
              value="android"
              className="font-black text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center justify-center gap-1.5 py-2.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Android
            </TabsTrigger>
            <TabsTrigger
              value="ios"
              className="font-black text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center justify-center gap-1.5 py-2.5"
            >
              <Apple className="w-3.5 h-3.5" />
              iOS
            </TabsTrigger>
            <TabsTrigger
              value="steam"
              className="font-black text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center justify-center gap-1.5 py-2.5"
            >
              <Monitor className="w-3.5 h-3.5" />
              Steam
            </TabsTrigger>
            <TabsTrigger
              value="console"
              className="font-black text-xs rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center justify-center gap-1.5 py-2.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              Console
            </TabsTrigger>
          </TabsList>

          {/* Android Guide */}
          <TabsContent value="android" className="space-y-4 mt-4 outline-none">
            <div className="bg-[#0e224e] p-5 rounded-2xl border border-blue-500/20 space-y-3.5 text-left">
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Android Mobile App Steps
              </h4>
              <ol className="space-y-3 text-xs sm:text-sm text-blue-100">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Open the <strong>eFootball™</strong> app on your Android smartphone.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Tap <strong>Extras</strong> on the top or navigation menu.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Select <strong>Support</strong> → then tap <strong>Link Data</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>Note down your linked <strong>KONAMI ID</strong> number OR the <strong>email address</strong> registered to that KONAMI ID.</span>
                </li>
              </ol>
              <div className="p-3 bg-blue-950/60 rounded-xl border border-blue-400/20 text-[11px] text-blue-200">
                💡 <em>You can enter either your KONAMI ID or the email associated with your eFootball account. No password needed!</em>
              </div>
            </div>
          </TabsContent>

          {/* iOS Guide */}
          <TabsContent value="ios" className="space-y-4 mt-4 outline-none">
            <div className="bg-[#0e224e] p-5 rounded-2xl border border-blue-500/20 space-y-3.5 text-left">
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <Apple className="w-4 h-4" />
                iOS (iPhone / iPad) Steps
              </h4>
              <ol className="space-y-3 text-xs sm:text-sm text-blue-100">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Open <strong>eFootball™</strong> on your iPhone or iPad.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>From the home screen, navigate to <strong>Extras</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Support</strong> → <strong>Link Data</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>Copy your linked <strong>KONAMI ID</strong> or the <strong>email address</strong> shown on your Konami Account.</span>
                </li>
              </ol>
            </div>
          </TabsContent>

          {/* Steam / PC Guide */}
          <TabsContent value="steam" className="space-y-4 mt-4 outline-none">
            <div className="bg-[#0e224e] p-5 rounded-2xl border border-blue-500/20 space-y-3.5 text-left">
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Steam (PC) Steps
              </h4>
              <ol className="space-y-3 text-xs sm:text-sm text-blue-100">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Launch <strong>eFootball™</strong> on Steam on your PC.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Go to <strong>Settings</strong> or <strong>Extras</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Select <strong>Support</strong> → <strong>Link Data / KONAMI ID</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>Your linked KONAMI ID or associated email will be displayed.</span>
                </li>
              </ol>
            </div>
          </TabsContent>

          {/* Console Guide */}
          <TabsContent value="console" className="space-y-4 mt-4 outline-none">
            <div className="bg-[#0e224e] p-5 rounded-2xl border border-blue-500/20 space-y-3.5 text-left">
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                PlayStation & Xbox Steps
              </h4>
              <ol className="space-y-3 text-xs sm:text-sm text-blue-100">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Navigate to <strong>Extras</strong> → <strong>Support</strong> → <strong>Link Data</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Scan the QR code on your mobile device to view your registered KONAMI ID or Konami email.</span>
                </li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl px-6 h-11 uppercase tracking-wider text-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            I Understand, Return to Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
