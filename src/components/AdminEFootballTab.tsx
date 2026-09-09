import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { EFootballProduct, EFootballOrder } from '../types';
import { 
  seedEFootballProducts, 
  DEFAULT_EFOOTBALL_COIN_IMAGE,
  DEFAULT_EFOOTBALL_COVER_IMAGE
} from '../lib/efootballData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Coins,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Mail,
  Clock,
  CheckCircle2,
  Send,
  Smartphone,
  Monitor,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Apple,
  RotateCcw,
  ImageIcon
} from 'lucide-react';
import { CloudinaryImageUploader } from './CloudinaryImageUploader';
import { toast } from 'sonner';

interface AdminEFootballTabProps {
  adminEmail?: string;
}

export default function AdminEFootballTab({ adminEmail }: AdminEFootballTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'products' | 'cover'>('orders');
  const [orders, setOrders] = useState<EFootballOrder[]>([]);
  const [products, setProducts] = useState<EFootballProduct[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Cover image states
  const [coverUrl, setCoverUrl] = useState<string>(DEFAULT_EFOOTBALL_COVER_IMAGE);
  const [customCoverInput, setCustomCoverInput] = useState<string>('');
  const [isSavingCover, setIsSavingCover] = useState(false);

  // Search and Filter states for orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all'); // 'all' | 'ios' | 'android' | 'steam'

  // Product tab platform filter
  const [productPlatformFilter, setProductPlatformFilter] = useState<string>('all');

  // Product modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EFootballProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    coinAmount: 1000,
    platform: 'android', // 'ios' | 'android' | 'steam'
    price: 100,
    currency: 'GHS',
    active: true,
    displayOrder: 1,
    description: '',
    imageUrl: '',
    badge: '',
  });

  // Delivery / Cancellation modal states
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<EFootballOrder | null>(null);
  const [actionType, setActionType] = useState<'deliver' | 'cancel' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentAdmin = auth.currentUser?.email || adminEmail || 'admin@kingjdeals.com';

  // 1. Real-time Subscription to eFootball Cover Setting
  useEffect(() => {
    const unsubCover = onSnapshot(
      doc(db, 'settings', 'efootball_cover'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.coverUrl) {
            setCoverUrl(data.coverUrl);
            setCustomCoverInput(data.coverUrl);
          } else {
            setCoverUrl(DEFAULT_EFOOTBALL_COVER_IMAGE);
          }
        } else {
          setCoverUrl(DEFAULT_EFOOTBALL_COVER_IMAGE);
        }
      },
      (err) => {
        console.warn('[Admin eFootball Cover Error]:', err);
      }
    );

    return () => unsubCover();
  }, []);

  // 2. Real-time Subscription to eFootball Orders
  useEffect(() => {
    const colRef = collection(db, 'efootballOrders');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const orderList: EFootballOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const identifier = data.accountIdentifier || data.konamiId || '';
          const idType = data.accountIdentifierType || (identifier.includes('@') ? 'email' : 'konami_id');
          
          // Clean up platform presentation: iOS, Android, Steam
          const rawPlat = data.platform || '';
          const normalizedPlat = 
            rawPlat.toLowerCase() === 'ios' ? 'iOS' :
            rawPlat.toLowerCase() === 'steam' ? 'Steam' :
            rawPlat.toLowerCase() === 'android' ? 'Android' :
            rawPlat;

          orderList.push({
            id: docSnap.id,
            orderId: data.orderId || docSnap.id,
            customerId: data.customerId || data.userId,
            userId: data.userId || data.customerId,
            customerName: data.customerName || 'Customer',
            customerEmail: data.customerEmail || data.email || 'No email',
            customerPhone: data.customerPhone || data.phone || '',
            phone: data.phone || data.customerPhone || '',
            email: data.email || data.customerEmail || '',
            productId: data.productId || '',
            productName: data.productName || data.bundle || 'eFootball Coins',
            bundle: data.bundle || data.productName,
            coinAmount: Number(data.coinAmount) || 0,
            platform: normalizedPlat,
            accountIdentifier: identifier,
            accountIdentifierType: idType,
            konamiId: identifier,
            amount: Number(data.amount) || 0,
            currency: data.currency || 'GHS',
            paymentStatus: data.paymentStatus || 'PAYMENT_PENDING',
            fulfillmentStatus: data.fulfillmentStatus || 'AWAITING_FULFILLMENT',
            adminStatus: data.adminStatus,
            status: data.status || 'pending',
            paystackReference: data.paystackReference || data.reference || docSnap.id,
            reference: data.reference || data.paystackReference || docSnap.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            paidAt: data.paidAt,
            acceptedAt: data.acceptedAt,
            acceptedBy: data.acceptedBy,
            deliveredAt: data.deliveredAt,
            deliveredBy: data.deliveredBy,
            deliveryNote: data.deliveryNote,
            cancellationReason: data.cancellationReason,
          });
        });

        // Sort descending by creation date in memory
        orderList.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setOrders(orderList);
        setLoadingOrders(false);
      },
      (err) => {
        console.warn('[Admin eFootball Orders Error]:', err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Real-time Subscription to eFootball Products
  useEffect(() => {
    const colRef = collection(db, 'efootballProducts');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If empty, auto-seed in background
          seedEFootballProducts().catch(console.warn);
        }

        const prodList: EFootballProduct[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawPlat = data.platform || 'android';
          const platformKey = rawPlat === 'steam' ? 'steam' : rawPlat === 'ios' ? 'ios' : 'android';
          const platformLabel = data.platformLabel || (platformKey === 'ios' ? 'iOS' : platformKey === 'android' ? 'Android' : 'Steam');

          prodList.push({
            id: docSnap.id,
            name: data.name || '',
            coinAmount: Number(data.coinAmount) || 0,
            platform: platformKey,
            platformLabel: platformLabel,
            price: Number(data.price) || 0,
            currency: data.currency || 'GHS',
            active: data.active !== false,
            displayOrder: Number(data.displayOrder) || 99,
            description: data.description || '',
            imageUrl: data.imageUrl || DEFAULT_EFOOTBALL_COIN_IMAGE,
            badge: data.badge || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });

        // Sort by platform and displayOrder
        prodList.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
        setProducts(prodList);
        setLoadingProducts(false);
      },
      (err) => {
        console.warn('[Admin eFootball Products Error]:', err);
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: EFootballProduct) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      coinAmount: prod.coinAmount,
      platform: prod.platform,
      price: prod.price,
      currency: prod.currency || 'GHS',
      active: prod.active !== false,
      displayOrder: prod.displayOrder || 1,
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      badge: prod.badge || '',
    });
    setIsProductModalOpen(true);
  };

  // Open Create Product
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      coinAmount: 1000,
      platform: 'android',
      price: 100,
      currency: 'GHS',
      active: true,
      displayOrder: products.length + 1,
      description: '',
      imageUrl: DEFAULT_EFOOTBALL_COIN_IMAGE,
      badge: '',
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const platKey = productForm.platform as 'ios' | 'android' | 'steam';
      const platLabel = platKey === 'ios' ? 'iOS' : platKey === 'android' ? 'Android' : 'Steam';
      
      const payload: Partial<EFootballProduct> = {
        name: productForm.name.trim(),
        coinAmount: Number(productForm.coinAmount),
        platform: platKey,
        platformLabel: platLabel,
        price: Number(productForm.price),
        currency: productForm.currency.trim() || 'GHS',
        active: Boolean(productForm.active),
        displayOrder: Number(productForm.displayOrder) || 1,
        description: productForm.description.trim(),
        imageUrl: productForm.imageUrl.trim() || DEFAULT_EFOOTBALL_COIN_IMAGE,
        badge: productForm.badge.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'efootballProducts', editingProduct.id), payload);
        toast.success(`Updated ${productForm.name} successfully!`);
      } else {
        const newId = `ef_${platKey}_${productForm.coinAmount}_${Date.now().toString(36)}`;
        await setDoc(doc(db, 'efootballProducts', newId), {
          ...payload,
          id: newId,
          createdAt: serverTimestamp(),
        });
        toast.success(`Added new coin package for ${platLabel}!`);
      }

      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast.error(`Failed to save package: ${err.message}`);
    }
  };

  // Toggle Product Active
  const handleToggleProductActive = async (prod: EFootballProduct) => {
    try {
      const newActive = !prod.active;
      await updateDoc(doc(db, 'efootballProducts', prod.id), {
        active: newActive,
        updatedAt: serverTimestamp(),
      });
      toast.success(`${prod.name} is now ${newActive ? 'Active' : 'Disabled'}`);
    } catch (err: any) {
      toast.error('Failed to update package status');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod: EFootballProduct) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'efootballProducts', prod.id));
      toast.success(`Deleted ${prod.name}`);
    } catch (err: any) {
      toast.error('Failed to delete package');
    }
  };

  // Accept Order
  const handleAcceptOrder = async (order: EFootballOrder) => {
    try {
      const updateData = {
        fulfillmentStatus: 'PROCESSING',
        adminStatus: 'PROCESSING',
        acceptedAt: serverTimestamp(),
        acceptedBy: currentAdmin,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'efootballOrders', order.id), updateData);
      try {
        await updateDoc(doc(db, 'orders', order.id), updateData);
      } catch (_) {}
      toast.success(`Accepted Order #${order.orderId}! Status set to Processing.`);
    } catch (err: any) {
      toast.error('Failed to accept order');
    }
  };

  // Open Action Modal (Deliver or Cancel)
  const handleOpenActionModal = (order: EFootballOrder, type: 'deliver' | 'cancel') => {
    setSelectedOrderForAction(order);
    setActionType(type);
    setActionNote('');
  };

  // Submit Action (Deliver or Cancel)
  const handleSubmitOrderAction = async () => {
    if (!selectedOrderForAction || !actionType) return;
    setIsSubmittingAction(true);

    try {
      if (actionType === 'deliver') {
        const updateData = {
          fulfillmentStatus: 'DELIVERED',
          adminStatus: 'DELIVERED',
          status: 'completed',
          deliveredAt: serverTimestamp(),
          deliveredBy: currentAdmin,
          deliveryNote: actionNote.trim() || 'eFootball coins loaded successfully to account.',
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, 'efootballOrders', selectedOrderForAction.id), updateData);
        try {
          await updateDoc(doc(db, 'orders', selectedOrderForAction.id), updateData);
        } catch (_) {}
        toast.success(`Order #${selectedOrderForAction.orderId} marked as DELIVERED! ✅`);
      } else if (actionType === 'cancel') {
        const updateData = {
          fulfillmentStatus: 'CANCELLED',
          adminStatus: 'CANCELLED',
          status: 'cancelled',
          cancellationReason: actionNote.trim() || 'Cancelled by admin.',
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, 'efootballOrders', selectedOrderForAction.id), updateData);
        try {
          await updateDoc(doc(db, 'orders', selectedOrderForAction.id), updateData);
        } catch (_) {}
        toast.info(`Order #${selectedOrderForAction.orderId} marked as CANCELLED.`);
      }

      setSelectedOrderForAction(null);
      setActionType(null);
      setActionNote('');
    } catch (err: any) {
      toast.error(`Action failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Save / Update Cover URL
  const handleSaveCoverUrl = async (newUrl: string) => {
    setIsSavingCover(true);
    try {
      await setDoc(
        doc(db, 'settings', 'efootball_cover'),
        {
          coverUrl: newUrl.trim(),
          updatedAt: serverTimestamp(),
          updatedBy: currentAdmin,
        },
        { merge: true }
      );
      setCoverUrl(newUrl.trim());
      setCustomCoverInput(newUrl.trim());
      toast.success('eFootball section cover updated successfully! ⚽');
    } catch (err: any) {
      console.error('Error saving cover:', err);
      toast.error(`Failed to update cover: ${err.message}`);
    } finally {
      setIsSavingCover(false);
    }
  };

  // Reset Cover to Default
  const handleResetCoverToDefault = async () => {
    if (!window.confirm('Reset eFootball section cover to the official default artwork?')) return;
    setIsSavingCover(true);
    try {
      await setDoc(
        doc(db, 'settings', 'efootball_cover'),
        {
          coverUrl: DEFAULT_EFOOTBALL_COVER_IMAGE,
          updatedAt: serverTimestamp(),
          updatedBy: currentAdmin,
        },
        { merge: true }
      );
      setCoverUrl(DEFAULT_EFOOTBALL_COVER_IMAGE);
      setCustomCoverInput(DEFAULT_EFOOTBALL_COVER_IMAGE);
      toast.success('Reset to official eFootball Mobile cover! ⚽');
    } catch (err: any) {
      toast.error('Failed to reset cover');
    } finally {
      setIsSavingCover(false);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    // 1. Search filter
    const matchesSearch =
      !searchQuery ||
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.accountIdentifier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.konamiId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.paystackReference?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status filter
    let matchesStatus = true;
    if (statusFilter === 'awaiting') {
      matchesStatus =
        order.fulfillmentStatus === 'AWAITING_FULFILLMENT' ||
        order.fulfillmentStatus === 'pending' ||
        order.status === 'pending';
    } else if (statusFilter === 'processing') {
      matchesStatus =
        order.fulfillmentStatus === 'PROCESSING' || order.status === 'processing';
    } else if (statusFilter === 'delivered') {
      matchesStatus =
        order.fulfillmentStatus === 'DELIVERED' || order.status === 'delivered';
    } else if (statusFilter === 'cancelled') {
      matchesStatus =
        order.fulfillmentStatus === 'CANCELLED' || order.status === 'cancelled';
    }

    // 3. Platform filter (strictly iOS, Android, Steam)
    let matchesPlatform = true;
    if (platformFilter !== 'all') {
      const platStr = (order.platform || '').toLowerCase();
      if (platformFilter === 'ios') {
        matchesPlatform = platStr.includes('ios');
      } else if (platformFilter === 'android') {
        matchesPlatform = platStr.includes('android');
      } else if (platformFilter === 'steam') {
        matchesPlatform = platStr.includes('steam');
      }
    }

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Filter Products for product management tab
  const filteredProducts = products.filter((prod) => {
    if (productPlatformFilter === 'all') return true;
    return prod.platform === productPlatformFilter;
  });

  // Calculate stats
  const awaitingCount = orders.filter(
    (o) => o.fulfillmentStatus === 'AWAITING_FULFILLMENT' || o.status === 'pending'
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.fulfillmentStatus === 'DELIVERED' || o.status === 'delivered'
  ).length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID' || o.paymentStatus === 'success')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              eFootball™ Coins Administration
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer coin orders, configure iOS/Android/Steam coin packages, and customize the official section cover.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setActiveSubTab('orders')}
            className={`h-10 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'orders'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Coins className="w-4 h-4 text-yellow-400" />
            eFootball Orders ({orders.length})
            {awaitingCount > 0 && (
              <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {awaitingCount}
              </span>
            )}
          </Button>

          <Button
            onClick={() => setActiveSubTab('products')}
            className={`h-10 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'products'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Packages & Pricing ({products.length})
          </Button>

          <Button
            onClick={() => setActiveSubTab('cover')}
            className={`h-10 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'cover'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-yellow-400" />
            Section Cover Artwork
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ORDERS MANAGEMENT VIEW                                 */}
      {/* ========================================================= */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Total Orders</p>
                  <h3 className="text-2xl font-black">{orders.length}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Coins className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase">Awaiting Delivery</p>
                  <h3 className="text-2xl font-black text-amber-500">{awaitingCount}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase">Delivered</p>
                  <h3 className="text-2xl font-black text-emerald-500">{deliveredCount}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Total Revenue</p>
                  <h3 className="text-2xl font-black text-yellow-500">GH₵ {totalRevenue.toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border shadow-sm">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Order ID, KONAMI ID, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                {['all', 'awaiting', 'processing', 'delivered', 'cancelled'].map((st) => (
                  <Button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    variant={statusFilter === st ? 'default' : 'ghost'}
                    className="h-8 px-2.5 text-[11px] font-black uppercase rounded-lg cursor-pointer"
                  >
                    {st}
                  </Button>
                ))}
              </div>

              {/* THREE SEPARATE PLATFORM FILTERS: ALL, iOS, Android, Steam */}
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 p-1 rounded-xl">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 px-1.5 hidden sm:inline">
                  Platform:
                </span>
                {[
                  { key: 'all', label: 'ALL' },
                  { key: 'ios', label: 'iOS', icon: Apple },
                  { key: 'android', label: 'Android', icon: Smartphone },
                  { key: 'steam', label: 'Steam', icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = platformFilter === item.key;
                  return (
                    <Button
                      key={item.key}
                      onClick={() => setPlatformFilter(item.key)}
                      variant={isSelected ? 'default' : 'ghost'}
                      className={`h-8 px-2.5 text-[11px] font-black uppercase rounded-lg flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-400 text-slate-950 hover:bg-yellow-300'
                          : 'text-foreground hover:bg-background'
                      }`}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Orders Cards List */}
          {loadingOrders ? (
            <div className="p-12 text-center text-muted-foreground">Loading eFootball Orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border bg-card space-y-2">
              <Coins className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold">No eFootball orders found</h3>
              <p className="text-xs text-muted-foreground">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isDelivered =
                  order.fulfillmentStatus === 'DELIVERED' || order.status === 'delivered';
                const isProcessing =
                  order.fulfillmentStatus === 'PROCESSING' || order.status === 'processing';
                const isCancelled =
                  order.fulfillmentStatus === 'CANCELLED' || order.status === 'cancelled';
                const isPaid =
                  order.paymentStatus === 'PAID' ||
                  order.paymentStatus === 'success' ||
                  order.status === 'paid';

                const customerEmail = (order.customerEmail || order.email || '').trim();
                const accountIdentifier = (order.accountIdentifier || order.konamiId || '').trim();
                const isEmailIdentifier =
                  order.accountIdentifierType === 'email' ||
                  (accountIdentifier.includes('@') && accountIdentifier.includes('.'));

                // Formatted Date
                let formattedDate = 'Recent';
                if (order.createdAt?.seconds) {
                  formattedDate = new Date(order.createdAt.seconds * 1000).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }

                // Platform formatting
                const platformDisplay =
                  order.platform?.toLowerCase() === 'ios'
                    ? 'iOS'
                    : order.platform?.toLowerCase() === 'steam'
                    ? 'Steam'
                    : 'Android';

                // Mailto link for customer's authenticated website Gmail
                const mailtoLink = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(
                  `King J Deals - eFootball Order #${order.orderId} (${order.productName})`
                )}&body=${encodeURIComponent(
                  `Hello ${order.customerName},\n\nThis is King J Deals regarding your eFootball Coins order #${order.orderId} (${order.productName}).\n\nPlatform: ${platformDisplay}\nAccount: ${accountIdentifier}\n\n`
                )}`;

                return (
                  <Card
                    key={order.id}
                    className={`rounded-2xl border-2 transition-all p-4 sm:p-5 ${
                      isDelivered
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isProcessing
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : isCancelled
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-amber-500/40 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Comprehensive Order Info */}
                      <div className="space-y-3 flex-1">
                        {/* Status Badges Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-slate-950 text-white font-mono text-xs px-2.5 py-0.5 font-black">
                            ORDER #{order.orderId}
                          </Badge>

                          <Badge
                            className={`text-[10px] font-black uppercase ${
                              isDelivered
                                ? 'bg-emerald-600 text-white'
                                : isProcessing
                                ? 'bg-blue-600 text-white'
                                : isCancelled
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            Fulfillment: {order.fulfillmentStatus || 'AWAITING_FULFILLMENT'}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-black ${
                              isPaid
                                ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                                : 'border-amber-500 text-amber-600'
                            }`}
                          >
                            Payment: {order.paymentStatus || 'PENDING'}
                          </Badge>

                          {/* Explicit Platform Badge: iOS, Android, Steam */}
                          <Badge
                            className={`text-[11px] font-black uppercase px-2.5 py-0.5 flex items-center gap-1 ${
                              platformDisplay === 'iOS'
                                ? 'bg-slate-800 text-white'
                                : platformDisplay === 'Steam'
                                ? 'bg-blue-700 text-white'
                                : 'bg-emerald-700 text-white'
                            }`}
                          >
                            {platformDisplay === 'iOS' ? (
                              <Apple className="w-3 h-3" />
                            ) : platformDisplay === 'Steam' ? (
                              <Monitor className="w-3 h-3" />
                            ) : (
                              <Smartphone className="w-3 h-3" />
                            )}
                            Platform: {platformDisplay}
                          </Badge>

                          <span className="text-[11px] text-muted-foreground ml-auto">
                            Date: {formattedDate}
                          </span>
                        </div>

                        {/* Customer & Account Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                          {/* 1. Website Gmail Box */}
                          <div className="p-3 rounded-xl bg-card border flex items-center justify-between">
                            <div className="overflow-hidden pr-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Mail className="w-3 h-3 text-blue-500" />
                                Website Customer Gmail
                              </span>
                              <p className="font-semibold text-xs text-foreground truncate" title={customerEmail}>
                                {customerEmail || 'No website email recorded'}
                              </p>
                              <span className="text-[10px] text-muted-foreground block">
                                Customer: <strong>{order.customerName}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                onClick={() => handleCopy(customerEmail, `email_${order.id}`)}
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs cursor-pointer"
                                title="Copy customer email"
                              >
                                {copiedId === `email_${order.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>

                              {/* EMAIL CUSTOMER BUTTON */}
                              <a
                                href={mailtoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
                              >
                                <Mail className="w-3 h-3" />
                                EMAIL CUSTOMER
                              </a>
                            </div>
                          </div>

                          {/* 2. eFootball Account Identifier Box */}
                          <div className="p-3 rounded-xl bg-card border flex items-center justify-between">
                            <div className="overflow-hidden pr-2">
                              <span className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                {isEmailIdentifier ? 'eFootball Account Email' : 'Customer KONAMI ID'}
                              </span>
                              <p className="font-mono font-black text-sm text-foreground truncate">
                                {accountIdentifier || 'Not Provided'}
                              </p>
                              <span className="text-[10px] text-muted-foreground block italic">
                                {isEmailIdentifier ? 'Type: Linked Email' : 'Type: KONAMI ID'}
                              </span>
                            </div>

                            <Button
                              onClick={() => handleCopy(accountIdentifier, `id_${order.id}`)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-bold text-yellow-600 hover:bg-yellow-500/10 cursor-pointer"
                            >
                              {copiedId === `id_${order.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 mr-1" />
                              )}
                              Copy ID
                            </Button>
                          </div>
                        </div>

                        {/* Package and Payment Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                          <span>
                            <strong>Package:</strong> {order.productName} ({order.coinAmount.toLocaleString()} Coins)
                          </span>
                          <span>
                            <strong>Amount:</strong>{' '}
                            <span className="font-black text-foreground text-sm">
                              GH₵ {order.amount?.toFixed(2)}
                            </span>
                          </span>
                          {order.customerPhone && (
                            <span className="flex items-center gap-1">
                              <strong>Phone:</strong> {order.customerPhone}
                              <a
                                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-500 hover:underline inline-flex items-center gap-0.5 ml-1 font-bold"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                            </span>
                          )}
                          {order.deliveryNote && (
                            <span className="text-emerald-600 dark:text-emerald-400 italic">
                              <strong>Delivery Note:</strong> "{order.deliveryNote}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0">
                        {!isDelivered && !isCancelled && (
                          <>
                            {order.fulfillmentStatus !== 'PROCESSING' && (
                              <Button
                                onClick={() => handleAcceptOrder(order)}
                                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                ACCEPT ORDER ⏳
                              </Button>
                            )}

                            <Button
                              onClick={() => handleOpenActionModal(order, 'deliver')}
                              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              MARK AS DELIVERED ✅
                            </Button>

                            <Button
                              onClick={() => handleOpenActionModal(order, 'cancel')}
                              variant="outline"
                              className="h-9 px-3 text-red-600 border-red-500/30 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Cancel Order ❌
                            </Button>
                          </>
                        )}

                        {isDelivered && (
                          <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                            <span className="text-emerald-600 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Delivered Successfully
                            </span>
                            {order.deliveredBy && (
                              <span className="block text-[10px]">By: {order.deliveredBy}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PACKAGES & PRICING MANAGEMENT                          */}
      {/* ========================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-sm">
            {/* Filter by platform */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              {[
                { key: 'all', label: 'All Platforms' },
                { key: 'ios', label: 'iOS' },
                { key: 'android', label: 'Android' },
                { key: 'steam', label: 'Steam' },
              ].map((pl) => (
                <Button
                  key={pl.key}
                  onClick={() => setProductPlatformFilter(pl.key)}
                  variant={productPlatformFilter === pl.key ? 'default' : 'ghost'}
                  className="h-8 px-3 text-xs font-black uppercase rounded-lg cursor-pointer"
                >
                  {pl.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => seedEFootballProducts()}
                variant="outline"
                className="h-10 border-blue-500/30 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                title="Reset or synchronize 28 official coin packages"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Sync 28 Official Packages
              </Button>

              <Button
                onClick={handleOpenCreateProduct}
                className="h-10 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Coin Package
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => (
              <Card
                key={prod.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                  prod.active ? 'bg-card' : 'opacity-60 bg-muted/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`text-[10px] font-black uppercase ${
                        prod.platform === 'ios'
                          ? 'bg-slate-800 text-white'
                          : prod.platform === 'steam'
                          ? 'bg-blue-700 text-white'
                          : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {prod.platformLabel || prod.platform}
                    </Badge>
                    <Badge
                      className={`text-[9px] font-black uppercase ${
                        prod.active ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                      }`}
                    >
                      {prod.active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>

                  <div className="w-full h-24 bg-slate-900/10 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={prod.imageUrl || DEFAULT_EFOOTBALL_COIN_IMAGE}
                      alt={prod.name}
                      className="h-full object-contain"
                    />
                  </div>

                  <div>
                    <h4 className="font-black text-sm line-clamp-1">{prod.name}</h4>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-bold">
                      {prod.coinAmount.toLocaleString()} Coins
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Price</span>
                    <span className="text-base font-black text-foreground">
                      GH₵ {prod.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      onClick={() => handleToggleProductActive(prod)}
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-8 font-bold px-1 cursor-pointer"
                    >
                      {prod.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      onClick={() => handleOpenEditProduct(prod)}
                      size="sm"
                      variant="secondary"
                      className="text-[10px] h-8 font-bold px-1 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(prod)}
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-8 font-bold text-red-600 px-1 flex items-center justify-center gap-1 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Del
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SECTION COVER ARTWORK MANAGEMENT                       */}
      {/* ========================================================= */}
      {activeSubTab === 'cover' && (
        <div className="space-y-6 max-w-4xl">
          <Card className="rounded-3xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-yellow-500" />
                  EFOOTBALL COINS COVER
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set the hero banner image displayed at the top of the eFootball Coins store section.
                </p>
              </div>

              <Button
                onClick={handleResetCoverToDefault}
                variant="outline"
                disabled={isSavingCover}
                className="h-9 px-3.5 border-blue-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default Cover
              </Button>
            </div>

            {/* Current Cover Preview */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Current Cover Live Preview
              </Label>
              <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden border-2 border-blue-500/30 bg-[#040C1D] shadow-lg flex items-end p-5">
                <img
                  src={coverUrl || DEFAULT_EFOOTBALL_COVER_IMAGE}
                  alt="Current eFootball Cover"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040C1D] via-[#040C1D]/60 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-1">
                  <Badge className="bg-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5">
                    Official Mobile Artwork Preview
                  </Badge>
                  <h4 className="text-2xl sm:text-3xl font-black text-white">EFOOTBALL COINS</h4>
                </div>
              </div>
            </div>

            {/* Upload Option 1: Cloudinary / Local File Picker */}
            <div className="p-4 rounded-2xl bg-muted/40 border space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Option A: Upload Image File (Cloudinary / Storage)
              </h4>
              <CloudinaryImageUploader
                label="Select New Cover Image"
                description="Upload an official eFootball artwork (16:9 banner or landscape image recommended)."
                currentImageUrl={coverUrl}
                previewAspectRatio="banner"
                folder="efootball_covers"
                onImageUploaded={(url) => handleSaveCoverUrl(url)}
                onImageRemoved={handleResetCoverToDefault}
              />
            </div>

            {/* Upload Option 2: Direct Image URL */}
            <div className="p-4 rounded-2xl bg-muted/40 border space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Option B: Set via Image URL
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={customCoverInput}
                  onChange={(e) => setCustomCoverInput(e.target.value)}
                  className="flex-1 h-10 rounded-xl text-xs font-medium"
                />
                <Button
                  onClick={() => handleSaveCoverUrl(customCoverInput)}
                  disabled={isSavingCover || !customCoverInput.trim()}
                  className="h-10 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Save URL
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* CREATE / EDIT PRODUCT MODAL                               */}
      {/* ========================================================= */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editingProduct ? 'Edit Coin Package' : 'Add New Coin Package'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure package name, coins, platform (iOS, Android, Steam), and price in GH¢.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Package Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g. eFootball™ Coin 1,092"
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Coin Amount</Label>
                <Input
                  type="number"
                  value={productForm.coinAmount}
                  onChange={(e) =>
                    setProductForm({ ...productForm, coinAmount: Number(e.target.value) })
                  }
                  required
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Price (GH₵)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: Number(e.target.value) })
                  }
                  required
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Platform Selection: iOS, Android, or Steam */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Platform</Label>
                <select
                  value={productForm.platform}
                  onChange={(e) => setProductForm({ ...productForm, platform: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium"
                >
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="steam">Steam</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Badge (Optional)</Label>
                <Input
                  value={productForm.badge}
                  onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  placeholder="e.g. POPULAR, BEST VALUE"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Display Order</Label>
                <Input
                  type="number"
                  value={productForm.displayOrder}
                  onChange={(e) =>
                    setProductForm({ ...productForm, displayOrder: Number(e.target.value) })
                  }
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Currency</Label>
                <Input
                  value={productForm.currency}
                  onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Coin Image URL</Label>
              <Input
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="Image URL"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Description (Optional)</Label>
              <Input
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Package notes..."
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="prodActive"
                checked={productForm.active}
                onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
              />
              <Label htmlFor="prodActive" className="text-xs font-bold cursor-pointer">
                Visible & Active for customers
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
                className="h-10 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Save Package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* ORDER ACTION MODAL (DELIVER / CANCEL)                     */}
      {/* ========================================================= */}
      <Dialog
        open={Boolean(selectedOrderForAction)}
        onOpenChange={(open) => !open && !isSubmittingAction && setSelectedOrderForAction(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {actionType === 'deliver' ? 'Confirm Coin Delivery ✅' : 'Cancel Order ❌'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionType === 'deliver'
                ? `Mark Order #${selectedOrderForAction?.orderId} as successfully delivered to the customer.`
                : `Cancel Order #${selectedOrderForAction?.orderId}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-muted/60 border text-xs space-y-1">
              <p>
                <strong>Customer:</strong> {selectedOrderForAction?.customerName}
              </p>
              <p>
                <strong>Website Gmail:</strong> {selectedOrderForAction?.customerEmail}
              </p>
              <p>
                <strong>
                  {selectedOrderForAction?.accountIdentifierType === 'email'
                    ? 'Account Email:'
                    : 'KONAMI ID:'}
                </strong>{' '}
                <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">
                  {selectedOrderForAction?.accountIdentifier || selectedOrderForAction?.konamiId}
                </span>
              </p>
              <p>
                <strong>Platform:</strong> {selectedOrderForAction?.platform}
              </p>
              <p>
                <strong>Package:</strong> {selectedOrderForAction?.productName} (
                {selectedOrderForAction?.coinAmount} Coins)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                {actionType === 'deliver' ? 'Delivery Note (Optional)' : 'Reason for Cancellation *'}
              </Label>
              <Input
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === 'deliver'
                    ? 'e.g. Coins loaded successfully via Konami link.'
                    : 'e.g. Invalid account ID provided or customer request.'
                }
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmittingAction}
              onClick={() => setSelectedOrderForAction(null)}
              className="h-10 rounded-xl text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSubmitOrderAction}
              disabled={isSubmittingAction}
              className={`h-10 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer ${
                actionType === 'deliver'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isSubmittingAction
                ? 'Saving...'
                : actionType === 'deliver'
                ? 'Confirm Delivered'
                : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
