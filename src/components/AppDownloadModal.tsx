import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  X, 
  Crown, 
  ChevronDown,
  Apple,
  Laptop,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const detectDevice = (): 'android' | 'ios' | 'desktop' => {
  if (typeof window === 'undefined') return 'android';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return 'desktop';
};

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('android');
  const [downloadStep, setDownloadStep] = useState<'ready' | 'downloading' | 'completed'>('ready');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeviceType(detectDevice());
      setDownloadStep('ready');
      setShowInstructions(false);
    }
  }, [isOpen]);

  const handleDownload = () => {
    setDownloadStep('downloading');
    
    // Create an invisible anchor to force the explicit King-J-Deals.apk filename
    const link = document.createElement('a');
    link.href = '/downloads/King-J-Deals.apk';
    link.setAttribute('download', 'King-J-Deals.apk');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Starting King-J-Deals.apk download! 👑", {
      description: "Check your browser downloads bar or notifications.",
      duration: 5000,
    });

    setTimeout(() => {
      setDownloadStep('completed');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window: Designed to fit 100% within initial phone viewport without scrolling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm sm:max-w-md bg-[#0F172A] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)] text-white z-10 overflow-hidden"
        >
          {/* Top Gold Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
            aria-label="Close download modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Section */}
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-black border border-amber-500/40 p-1 flex items-center justify-center shadow-lg">
              <img 
                src="/icon-512.png" 
                alt="King J Deals" 
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent tracking-tight">
                King J Deals App
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-snug max-w-xs mx-auto">
                {deviceType === 'android'
                  ? "Get the King J Deals Android app for a faster and easier experience."
                  : deviceType === 'ios'
                  ? "The King J Deals app is currently built for Android devices."
                  : "The King J Deals app is designed for Android mobile devices."}
              </p>
            </div>
          </div>

          {/* ANDROID DEVICE FLOW (Primary Action: Immediate Download Button) */}
          {deviceType === 'android' && (
            <div className="space-y-2.5">
              {/* Prominent Download Button */}
              <Button
                onClick={handleDownload}
                size="lg"
                className="w-full h-13 sm:h-14 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_4px_25px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-amber-300/50 cursor-pointer"
              >
                <Download className="w-5 h-5 fill-slate-950" />
                <span>
                  {downloadStep === 'downloading' 
                    ? "Downloading King-J-Deals.apk..." 
                    : downloadStep === 'completed'
                    ? "Download Again"
                    : "Download App"}
                </span>
              </Button>

              {/* Minimal Metadata Note */}
              <p className="text-[11px] text-slate-400 font-medium text-center">
                King-J-Deals.apk • Android 7.0+ • Free 👑
              </p>

              {/* Expandable "How to install" section below the main button */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-400/90 hover:text-amber-300 transition-colors py-1 cursor-pointer"
                >
                  <span>How to install the APK?</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''}`} />
                </button>

                {showInstructions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-left text-[11px] space-y-1.5 text-slate-300"
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">1</span>
                      <p>Tap <strong>Download App</strong> above to download <code>King-J-Deals.apk</code>.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">2</span>
                      <p>Open your browser notification or File Manager and tap the downloaded APK.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">3</span>
                      <p>If asked, tap <strong>Allow from this source</strong>, then tap <strong>Install</strong>.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* IPHONE / IPAD FLOW (Informative Message - No Unnecessary APK Download Button) */}
          {deviceType === 'ios' && (
            <div className="space-y-3 text-center">
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wide">
                  <Apple className="w-4 h-4" />
                  <span>iOS Notice</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Android APK packages cannot be installed on iPhone or iPad. You can continue using our full mobile website with all features and instant order delivery.
                </p>
                <div className="text-[11px] text-amber-300/90 font-medium bg-slate-900/70 p-2.5 rounded-xl border border-amber-500/20 flex items-start gap-2">
                  <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Tip: Tap Safari’s <strong>Share</strong> button and choose <strong>"Add to Home Screen"</strong> for instant 1-tap access on iPhone.</span>
                </div>
              </div>

              <Button
                onClick={onClose}
                size="lg"
                className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                Continue on Website
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setDeviceType('android')}
                  className="text-[10px] text-slate-500 hover:text-slate-400 underline cursor-pointer"
                >
                  Preview Android view
                </button>
              </div>
            </div>
          )}

          {/* DESKTOP FLOW (Informative Message - Clean and Direct) */}
          {deviceType === 'desktop' && (
            <div className="space-y-3 text-center">
              <div className="bg-[#111C38] border border-amber-500/20 rounded-2xl p-3.5 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wide">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Mobile App</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The King J Deals app is designed for Android mobile devices. Open <strong>kingjdeals.site</strong> on your Android phone to download directly, or enjoy our full website right here on your computer.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={onClose}
                  size="lg"
                  className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Continue on Website
                </Button>

                {/* Secondary Option for Manual Transfer or Testing */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 underline font-semibold cursor-pointer"
                  >
                    Download King-J-Deals.apk (for transfer to phone)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceType('android')}
                    className="text-[10px] text-slate-500 hover:text-slate-400 underline cursor-pointer"
                  >
                    Preview Android mobile view
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

