import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessPage({ reference, onReturn }: { reference: string, onReturn: () => void }) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No transaction reference found.');
      return;
    }

    // Call backend to verify
    fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setStatus('success');
        setMessage('Your payment was successful and the order is being processed!');
        // Clean up URL to prevent re-triggering
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setStatus('failed');
        setMessage(data.message || 'Verification failed. Please contact admin.');
      }
    })
    .catch(err => {
      console.error(err);
      setStatus('failed');
      setMessage('An error occurred during verification.');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button 
              onClick={onReturn}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button 
              onClick={onReturn}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
