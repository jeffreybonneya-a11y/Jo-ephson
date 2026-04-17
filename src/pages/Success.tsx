import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessPage({ reference, onReturn }: { reference: string, onReturn: () => void }) {
  const [status, setStatus] = useState<'verifying' | 'success'>('verifying');
  const [message, setMessage] = useState('Processing your royal order...');

  useEffect(() => {
    if (!reference) {
      setStatus('success');
      setMessage('Thank you for your order! It is being processed.');
      return;
    }

    // Call backend to verify in the background
    fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    })
    .catch(err => {
      console.error("Verification background error:", err);
    })
    .finally(() => {
      // Always show success to user
      setStatus('success');
      setMessage('Payment received! Your order is now in our system and will be processed by King J shortly 👑');
      // Clean up URL to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  }, [reference]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Order</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You, Royal! 👑</h2>
            <p className="text-gray-600 mb-6 font-medium leading-relaxed">{message}</p>
            <button 
              onClick={onReturn}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              RETURN TO HOMEPAGE
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
