import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  X, 
  Crown, 
  ChevronDown,
  Apple,
  CheckCircle2,
  Share2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logAppDownload } from '@/src/lib/downloadTracking';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PRODUCTION_APK_URL = 'https://kingjdeals.site/downloads/King-J-Deals.apk';
export const APK_FILENAME = 'King-J-Deals.apk';
export const APK_SIZE_LABEL = '9.97 MB';

export const detectDevice = (): 'android' | 'ios' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return 'desktop';
};

export const triggerApkDownload = () => {
  try {
    const link = document.createElement('a');
    link.href = PRODUCTION_APK_URL;
    link.setAttribute('download', APK_FILENAME);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 300);
  } catch (err) {
    console.warn('Direct anchor download failed, fallback to location.assign:', err);
    window.location.assign(PRODUCTION_APK_URL);
  }
};

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('android');
  const [downloadStep, setDownloadStep] = useState<'ready' | 'downloading' | 'completed'>('ready');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const detected = detectDevice();
      setDeviceType(detected);
      setShowInstructions(false);

      if (detected === 'android') {
        // Immediately start downloading the APK on Android
        setDownloadStep('downloading');
        triggerApkDownload();
        logAppDownload({ deviceType: 'android', source: 'website_modal_android_auto' });
        toast.success("Downloading King-J-Deals.apk! 👑", {
          description: "Check your phone notification bar for download progress.",
          duration: 5000,
        });
        const timer = setTimeout(() => {
          setDownloadStep('completed');
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setDownloadStep('ready');
      }
    }
  }, [isOpen]);

  const handleDownload = () => {
    setDownloadStep('downloading');
    triggerApkDownload();
    logAppDownload({ deviceType, source: 'website_modal_button_click', force: true });

    toast.success("Downloading King-J-Deals.apk! 👑", {
      description: "Look in your phone's notification bar for download progress.",
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
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window: Designed to fit 100% within initial phone viewport without scrolling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm sm:max-w-md bg-[#0F172A] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.2)] text-white z-10 overflow-hidden"
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
          <div className="flex flex-col items-center text-center space-y-1.5 mb-3.5">
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
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 leading-snug max-w-xs mx-auto">
                {deviceType === 'android'
                  ? "Get the King J Deals Android app for a faster and easier experience."
                  : deviceType === 'ios'
                  ? "The King J Deals app is currently available for Android devices."
                  : "The King J Deals app is designed for Android mobile devices."}
              </p>
            </div>
          </div>

          {/* ANDROID DEVICE FLOW (Immediate direct download • No Continue to Website option • No scrolling) */}
          {deviceType === 'android' && (
            <div className="space-y-2.5">
              {/* Status Feedback Card */}
              {downloadStep === 'downloading' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Downloading King-J-Deals.apk ({APK_SIZE_LABEL})...</span>
                </div>
              )}

              {downloadStep === 'completed' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Download Started! Check notifications to install.</span>
                </div>
              )}

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
                King-J-Deals.apk • {APK_SIZE_LABEL} • Android 7.0+ • Free 👑
              </p>

              {/* Expandable "How to install" section below the main button */}
              <div className="pt-1.5 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-400/90 hover:text-amber-300 transition-colors py-0.5 cursor-pointer"
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
                      <p>Open your browser notification or Downloads folder and tap <strong>King-J-Deals.apk</strong>.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">2</span>
                      <p>If prompted, tap <strong>Allow from this source</strong> in Android Settings.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">3</span>
                      <p>Tap <strong>Install</strong> to start using King J Deals on your phone!</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* IPHONE / IPAD FLOW (Informative Message - Explains Android availability & iOS coming soon) */}
          {deviceType === 'ios' && (
            <div className="space-y-3 text-center">
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wide">
                  <Apple className="w-4 h-4" />
                  <span>iOS Availability Notice</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The King J Deals app is currently available for <strong>Android</strong> devices. <strong>iOS support is coming later!</strong>
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You can continue using our full mobile website with all features, instant airtime, and data deliveries directly on Safari.
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
            </div>
          )}

          {/* DESKTOP FLOW (Informative Message & Direct APK Download Option) */}
          {deviceType === 'desktop' && (
            <div className="space-y-3 text-center">
              <div className="bg-[#111C38] border border-amber-500/20 rounded-2xl p-3.5 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wide">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Mobile App</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The King J Deals app is designed for Android mobile devices. Open <strong>kingjdeals.site</strong> on your Android phone to download directly, or download the APK below to transfer it to your phone.
                </p>
              </div>

              <div className="space-y-2">
                {/* Prominent APK Download Button on Desktop */}
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-amber-300/50 cursor-pointer"
                >
                  <Download className="w-4 h-4 fill-slate-950" />
                  <span>
                    {downloadStep === 'downloading' 
                      ? "Downloading King-J-Deals.apk..." 
                      : downloadStep === 'completed'
                      ? "Download Again (King-J-Deals.apk)"
                      : `Download King-J-Deals.apk (${APK_SIZE_LABEL})`}
                  </span>
                </Button>

                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="w-full h-11 rounded-2xl font-bold text-xs bg-slate-900/60 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
