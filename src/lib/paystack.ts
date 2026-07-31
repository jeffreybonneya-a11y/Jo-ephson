/**
 * Helper utility to load the Paystack Inline JS SDK dynamically
 * and trigger the payment popup securely on the client side.
 */

export interface PaystackOptions {
  key: string;
  email: string;
  amount: number; // in subunits (pesewas/kobo)
  currency: string;
  ref: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function loadPaystackScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).PaystackPop) {
      resolve((window as any).PaystackPop);
      return;
    }
    const existing = document.querySelector('script[src*="paystack.co"]');
    if (existing) {
      let intervalCount = 0;
      const checkInterval = setInterval(() => {
        intervalCount++;
        if ((window as any).PaystackPop) {
          clearInterval(checkInterval);
          resolve((window as any).PaystackPop);
        } else if (intervalCount > 20) {
          clearInterval(checkInterval);
          reject(new Error("Paystack SDK script exists but failed to initialize."));
        }
      }, 150);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).PaystackPop) {
        resolve((window as any).PaystackPop);
      } else {
        reject(new Error("PaystackPop SDK failed to initialize after script load."));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load Paystack Inline SDK script."));
    };
    document.body.appendChild(script);
  });
}

export async function openPaystackPopup(options: PaystackOptions): Promise<void> {
  try {
    const PaystackPop = await loadPaystackScript();
    if (!PaystackPop || typeof PaystackPop.setup !== 'function') {
      throw new Error("Paystack SDK is not loaded or invalid.");
    }
    const handler = PaystackPop.setup({
      key: options.key,
      email: options.email,
      amount: options.amount,
      currency: options.currency || "GHS",
      ref: options.ref,
      callback: (response: any) => {
        console.log("[Paystack SDK] Payment successful. Reference:", response.reference);
        options.onSuccess(response?.reference || options.ref);
      },
      onClose: () => {
        console.log("[Paystack SDK] Payment window closed by customer.");
        options.onClose();
      }
    });

    if (handler && typeof handler.openIframe === 'function') {
      handler.openIframe();
    } else {
      throw new Error("Paystack setup failed to return valid handler.");
    }
  } catch (error) {
    console.error("[Paystack SDK] Error opening popup:", error);
    throw error;
  }
}
