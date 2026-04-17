import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-white mb-6">
              <span className="bg-primary text-secondary px-3 py-1 rounded-lg">KING J</span>
              <span className="text-primary">DEALS 👑</span>
            </div>
            <p className="max-w-md mb-6 text-slate-400 leading-relaxed">
              Experience the <span className="text-primary font-bold">Royal Treatment</span> in data deals. Affordable, non-expiry data bundles in Ghana. 5-15 mins delivery under stable network. 👑
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
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> jeffreybonneya@gmail.com</li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /> Accra, Ghana</li>
              <li className="flex items-center gap-3">
                <a href="https://wa.me/233535884851" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors">
                  <MessageSquare className="w-4 h-4 text-primary" /> WhatsApp Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} King J Deals. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
