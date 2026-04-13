import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BundleList from './components/BundleList';
import CheckoutForm from './components/CheckoutForm';
import AdminDashboard from './components/AdminDashboard';
import { Bundle } from './types';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Toaster position="top-center" richColors />
      <Navbar onAdminView={setIsAdminView} isAdminView={isAdminView} />
      
      <main>
        {isAdminView ? (
          <AdminDashboard />
        ) : (
          <>
            <Hero />
            <BundleList onSelectBundle={setSelectedBundle} />
            
            {/* How it Works */}
            <section className="py-20 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold">1</div>
                    <h3 className="text-xl font-semibold">Select Bundle</h3>
                    <p className="text-slate-600">Choose your network and the data amount you need from our list.</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold">2</div>
                    <h3 className="text-xl font-semibold">Enter Details</h3>
                    <p className="text-slate-600">Provide the phone number that will receive the data bundle.</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold">3</div>
                    <h3 className="text-xl font-semibold">Confirm & Pay</h3>
                    <p className="text-slate-600">Approve the MoMo prompt on your phone and receive your data instantly.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-slate-50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { name: "Kofi Mensah", text: "Fastest data delivery I've ever experienced. Highly recommended!", role: "Student" },
                    { name: "Ama Serwaa", text: "The prices are unbeatable. I save so much every month.", role: "Entrepreneur" },
                    { name: "John Doe", text: "Excellent customer service. They helped me when I had a payment issue.", role: "Freelancer" }
                  ].map((t, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-slate-600 italic mb-4">"{t.text}"</p>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-white">
              <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {[
                    { q: "Does the data expire?", a: "No, all our data bundles are non-expiry. They stay active until you finish using them." },
                    { q: "How long does delivery take?", a: "Delivery is usually instant after payment confirmation. In rare cases, it might take up to 5 minutes." },
                    { q: "Which networks do you support?", a: "We currently support MTN, Vodafone, and AirtelTigo." }
                  ].map((faq, i) => (
                    <div key={i} className="border-b pb-6">
                      <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                      <p className="text-slate-600">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white mb-6">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded">Jo-Ephson</span>
                <span>deals</span>
              </div>
              <p className="max-w-md mb-6">
                Your number one destination for affordable, non-expiry data bundles in Ghana. We pride ourselves on speed, security, and customer satisfaction.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white"><Facebook className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white"><Twitter className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white"><Instagram className="w-5 h-5" /></Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-primary" /> +233 53 588 4851</li>
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> support@joephson.com</li>
                <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /> Accra, Ghana</li>
                <li className="flex items-center gap-3"><MessageSquare className="w-4 h-4 text-primary" /> WhatsApp Support</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} Jo-Ephson deals. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <CheckoutForm 
        bundle={selectedBundle} 
        onClose={() => setSelectedBundle(null)} 
      />

      {/* Sticky WhatsApp Button */}
      <a 
        href="https://wa.me/0535884851" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <MessageSquare className="w-8 h-8" />
      </a>
    </div>
  );
}
