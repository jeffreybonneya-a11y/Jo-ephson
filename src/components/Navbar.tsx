import { useState, useEffect } from 'react';
import { auth } from '@/src/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

interface NavbarProps {
  onAdminView: (isAdmin: boolean) => void;
  isAdminView: boolean;
}

export default function Navbar({ onAdminView, isAdminView }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else if (user.email === 'jeffreybonneya@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        onAdminView(false);
      }
    });
    return unsubscribe;
  }, [onAdminView]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onAdminView(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter cursor-pointer" onClick={() => onAdminView(false)}>
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded">Jo-Ephson</span>
          <span className="text-primary">deals</span>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button 
              variant={isAdminView ? "default" : "ghost"} 
              size="sm" 
              onClick={() => onAdminView(!isAdminView)}
              className="gap-2"
            >
              {isAdminView ? <ShoppingBag className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
              {isAdminView ? "Shop" : "Admin"}
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border" referrerPolicy="no-referrer" />
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleLogin} className="gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
