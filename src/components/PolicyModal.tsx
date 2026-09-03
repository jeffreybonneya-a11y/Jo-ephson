import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Crown, ShieldCheck, FileText, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';

export type PolicyType = 'about' | 'terms' | 'privacy' | 'contact' | 'refund' | null;

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
}

export default function PolicyModal({ type, onClose }: PolicyModalProps) {
  if (!type) return null;

  return (
    <Dialog open={type !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto bg-slate-950 text-slate-100 border-amber-500/30 p-6 md:p-8">
        {type === 'about' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                About King J Deals
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Ghana's Premier Digital Dealership &amp; Mobile Data Hub
              </DialogDescription>
            </DialogHeader>

            <div className="text-sm text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>King J Deals</strong> is a verified Ghanaian digital service provider specializing in affordable, non-expiry mobile data bundles across MTN, Telecel, and AirtelTigo networks.
              </p>
              <p>
                Our platform operates an automated dispatch architecture that delivers non-expiry data directly to your mobile phone number within 5 to 15 minutes under normal network conditions.
              </p>
              <p>
                In addition to mobile data bundles, King J Deals offers digital vouchers, result checker PINs (WAEC WASSCE/BECE/NOVDEC), and gaming top-ups with instant electronic delivery and 24/7 dedicated support.
              </p>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <Phone className="w-6 h-6 text-amber-400" />
                Contact Customer Support
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                We are available 24/7 to assist you with order inquiries and top-ups.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm text-slate-300 pt-2">
              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Phone Hotline</div>
                  <a href="tel:+233535884851" className="font-bold text-white hover:text-amber-400 transition-colors">+233 53 588 4851</a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Official Email</div>
                  <a href="mailto:support@kingjdeals.site" className="font-bold text-white hover:text-amber-400 transition-colors">support@kingjdeals.site</a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Office Location</div>
                  <div className="font-bold text-white">Accra, Ghana</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'privacy' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                Privacy Policy
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                How King J Deals collects and protects your personal information.
              </DialogDescription>
            </DialogHeader>

            <div className="text-xs text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>Information We Collect:</strong> When you purchase data or digital products on King J Deals, we collect your phone number, email address, transaction references, and network carrier details necessary to fulfill your order.
              </p>
              <p>
                <strong>How Information Is Used:</strong> Your contact information is strictly used for order processing, automated dispatching, payment verification, and sending order confirmation updates via SMS/Email.
              </p>
              <p>
                <strong>Payment Security:</strong> All financial transactions are securely processed via licensed payment gateways (Paystack and Korapay). King J Deals does not store or handle raw bank card numbers or Mobile Money PINs.
              </p>
              <p>
                <strong>Data Protection:</strong> We implement bank-grade encryption and Firestore access rules. Your information is never sold, rented, or shared with third parties.
              </p>
            </div>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <FileText className="w-6 h-6 text-amber-400" />
                Terms of Service
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Terms and conditions for using King J Deals.
              </DialogDescription>
            </DialogHeader>

            <div className="text-xs text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>Order Processing:</strong> Orders are processed automatically upon successful payment verification. Data bundle top-ups are credited directly to the beneficiary phone number provided during checkout.
              </p>
              <p>
                <strong>Accuracy of Details:</strong> Customers must ensure that the recipient phone number and mobile network selected during checkout are correct. King J Deals is not liable for orders fulfilled to incorrectly typed recipient numbers.
              </p>
              <p>
                <strong>Service Availability:</strong> Top-up delivery speeds depend on telecom network uptime in Ghana (MTN, Telecel, AirtelTigo). Standard delivery window is 5 to 15 minutes.
              </p>
            </div>
          </div>
        )}

        {type === 'refund' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-amber-400" />
                Refund &amp; Cancellation Policy
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Our policy regarding failed orders, cancellations, and refunds.
              </DialogDescription>
            </DialogHeader>

            <div className="text-xs text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>Failed Deliveries:</strong> If a paid order fails to deliver due to a system error or telecom network blockage, King J Deals will automatically re-attempt delivery or issue a full refund to your Mobile Money account or bank card.
              </p>
              <p>
                <strong>Refund Timeframe:</strong> Approved refunds are processed within 24 to 48 hours upon verification by our support desk.
              </p>
              <p>
                <strong>Non-Refundable Cases:</strong> Successful orders dispatched to a valid recipient phone number specified by the customer are non-refundable once credited by the network provider.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
