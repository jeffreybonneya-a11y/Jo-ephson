import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { BookingCode, BookingCodePurchase } from "@/src/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  RefreshCw,
  Trophy,
  History,
  TrendingUp,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { PlatformLogo } from "./BookingCodePlatformLogos";
import { CloudinaryImageUploader } from "@/src/components/CloudinaryImageUploader";

export default function AdminBookingCodesManager() {
  const [bookingCodes, setBookingCodes] = useState<BookingCode[]>([]);
  const [purchases, setPurchases] = useState<BookingCodePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"manage" | "sales">("manage");

  // Form State
  const [editingCode, setEditingCode] = useState<BookingCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBookmaker, setFormBookmaker] = useState("SportyBet");
  const [formCode, setFormCode] = useState("");
  const [formOdds, setFormOdds] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPreviewImageUrl, setFormPreviewImageUrl] = useState("");
  const [formSport, setFormSport] = useState("Football");
  const [formCategory, setFormCategory] = useState("VIP Banker");
  const [formActive, setFormActive] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [salesSearchQuery, setSalesSearchQuery] = useState("");

  // Real-time listener for booking codes
  useEffect(() => {
    const q = query(collection(db, "booking_codes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BookingCode[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          title: docSnap.data().title || "",
          bookmaker: docSnap.data().bookmaker || "SportyBet",
          code: docSnap.data().code || "",
          odds: Number(docSnap.data().odds) || 1.0,
          price: Number(docSnap.data().price) || 0,
          expiresAt: docSnap.data().expiresAt || null,
          description: docSnap.data().description || "",
          previewImageUrl: docSnap.data().previewImageUrl || "",
          sport: docSnap.data().sport || "Football",
          category: docSnap.data().category || "VIP Banker",
          active: docSnap.data().active !== false,
          totalPurchases: Number(docSnap.data().totalPurchases) || 0,
          createdAt: docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt,
        }));
        setBookingCodes(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading booking codes:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time listener for purchases
  useEffect(() => {
    const qPurchases = query(
      collection(db, "booking_code_purchases"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      qPurchases,
      (snapshot) => {
        const list: BookingCodePurchase[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            bookingCodeId: d.bookingCodeId || "",
            userId: d.userId || "",
            customerName: d.customerName || "",
            customerEmail: d.customerEmail || d.email || "",
            customerPhone: d.customerPhone || d.phone || "",
            title: d.title || "Booking Code Purchase",
            bookmaker: d.bookmaker || "SportyBet",
            code: d.code || "",
            odds: Number(d.odds) || 1.0,
            price: Number(d.price) || 0,
            paymentMethod: d.paymentMethod || "Paystack",
            paymentReference: d.paymentReference || d.reference || docSnap.id,
            status: d.status || "paid",
            createdAt: d.createdAt,
          };
        });
        setPurchases(list);
      },
      (err) => {
        console.error("Error loading purchases:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setEditingCode(null);
    setFormTitle("");
    setFormBookmaker("SportyBet");
    setFormCode("");
    setFormOdds("");
    setFormPrice("");
    setFormExpiresAt("");
    setFormDescription("");
    setFormPreviewImageUrl("");
    setFormSport("Football");
    setFormCategory("VIP Banker");
    setFormActive(true);
  };

  const handleStartEdit = (code: BookingCode) => {
    setEditingCode(code);
    setFormTitle(code.title);
    setFormBookmaker(code.bookmaker);
    setFormCode(code.code);
    setFormOdds(String(code.odds));
    setFormPrice(String(code.price));

    // Format expiry for datetime-local input
    if (code.expiresAt) {
      let d: Date | null = null;
      if (typeof code.expiresAt === "string") {
        d = new Date(code.expiresAt);
      } else if (code.expiresAt?.seconds) {
        d = new Date(code.expiresAt.seconds * 1000);
      } else if (code.expiresAt instanceof Date) {
        d = code.expiresAt;
      }
      if (d && !isNaN(d.getTime())) {
        const iso = d.toISOString().slice(0, 16);
        setFormExpiresAt(iso);
      }
    } else {
      setFormExpiresAt("");
    }

    setFormDescription(code.description || "");
    setFormPreviewImageUrl(code.previewImageUrl || "");
    setFormSport(code.sport || "Football");
    setFormCategory(code.category || "VIP Banker");
    setFormActive(code.active);

    // Scroll to form
    const formEl = document.getElementById("booking-code-form");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a title for the booking slip.");
      return;
    }
    if (!formCode.trim()) {
      toast.error("Please enter the actual booking code.");
      return;
    }
    if (!formOdds || Number(formOdds) <= 0) {
      toast.error("Please enter valid odds (e.g. 15.5).");
      return;
    }
    if (formPrice === "" || isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      toast.error("Please enter a valid price in GHS (set 0 for FREE).");
      return;
    }

    setIsSaving(true);
    try {
      const codeData: any = {
        title: formTitle.trim(),
        bookmaker: formBookmaker,
        code: formCode.trim().toUpperCase(),
        odds: Number(formOdds),
        price: Number(formPrice),
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        description: formDescription.trim(),
        previewImageUrl: formPreviewImageUrl.trim(),
        sport: formSport,
        category: formCategory,
        active: formActive,
        updatedAt: serverTimestamp(),
      };

      if (editingCode) {
        await updateDoc(doc(db, "booking_codes", editingCode.id), codeData);
        toast.success("Booking Code updated successfully! 👑");
      } else {
        codeData.createdAt = serverTimestamp();
        codeData.totalPurchases = 0;
        await addDoc(collection(db, "booking_codes"), codeData);
        toast.success("New Booking Code created & live! 👑");
      }

      resetForm();
    } catch (err: any) {
      console.error("Error saving booking code:", err);
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCode = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you sure you want to delete "${title}"?`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "booking_codes", id));
      toast.success("Booking Code deleted! 🗑️");
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, "booking_codes", id), {
        active: !currentActive,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Booking Code is now ${!currentActive ? "ACTIVE" : "INACTIVE"}`);
    } catch (err: any) {
      toast.error(`Toggle failed: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text} 📋`);
  };

  // Quick Expiry Format
  const formatExpiryString = (expiresAt: any) => {
    if (!expiresAt) return "No expiration";
    let d: Date | null = null;
    if (typeof expiresAt === "string") d = new Date(expiresAt);
    else if (expiresAt?.seconds) d = new Date(expiresAt.seconds * 1000);
    else if (expiresAt instanceof Date) d = expiresAt;

    if (!d || isNaN(d.getTime())) return "Invalid date";
    const isPast = d.getTime() < Date.now();
    return (
      <span className={isPast ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
        {d.toLocaleString()} {isPast && "(EXPIRED)"}
      </span>
    );
  };

  // Summary Metrics
  const totalRevenue = purchases.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const totalActiveCodes = bookingCodes.filter((c) => c.active).length;

  // Filtered lists
  const filteredCodes = bookingCodes.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.bookmaker.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
  });

  const filteredPurchases = purchases.filter((p) => {
    if (!salesSearchQuery.trim()) return true;
    const q = salesSearchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.customerEmail.toLowerCase().includes(q) ||
      (p.customerPhone || "").toLowerCase().includes(q) ||
      (p.customerName || "").toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.paymentReference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border bg-slate-900/60 border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-2xl font-black text-white">
              GH₵ {totalRevenue.toFixed(2)}
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-slate-900/60 border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Code Sales
            </span>
            <span className="text-2xl font-black text-white">{purchases.length}</span>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-slate-900/60 border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Codes
            </span>
            <span className="text-2xl font-black text-white">
              {totalActiveCodes} / {bookingCodes.length}
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-slate-900/60 border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
            <History className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Platforms Supported
            </span>
            <span className="text-2xl font-black text-white">Sporty & More</span>
          </div>
        </Card>
      </div>

      {/* 2. SUB-TAB SWITCHER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-[#111C38] p-1.5 rounded-2xl border border-amber-500/20">
          <Button
            variant={activeSubTab === "manage" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSubTab("manage")}
            className={`rounded-xl text-xs font-black uppercase tracking-wider ${
              activeSubTab === "manage"
                ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            Manage Codes ({bookingCodes.length})
          </Button>

          <Button
            variant={activeSubTab === "sales" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSubTab("sales")}
            className={`rounded-xl text-xs font-black uppercase tracking-wider ${
              activeSubTab === "sales"
                ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1" />
            Sales History ({purchases.length})
          </Button>
        </div>

        {activeSubTab === "manage" && (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              const formEl = document.getElementById("booking-code-form");
              if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase"
          >
            <Plus className="w-4 h-4 mr-1" /> Add New Code
          </Button>
        )}
      </div>

      {/* 3. MANAGE CODES VIEW (FORM + CODES TABLE) */}
      {activeSubTab === "manage" && (
        <div className="space-y-6">
          {/* CREATE / EDIT FORM */}
          <Card
            id="booking-code-form"
            className="rounded-3xl border-2 border-amber-500/30 bg-[#0F172A] p-6 shadow-xl"
          >
            <CardHeader className="p-0 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  {editingCode ? `Edit Booking Code: ${editingCode.title}` : "Create New Booking Code 👑"}
                </CardTitle>
                {editingCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="text-xs text-slate-400 border-slate-700"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
              <CardDescription className="text-slate-400 text-xs">
                Configure verified booking code, platform, odds, price, and expiration date/time.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveCode} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-300">Title / Slip Name *</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Weekend 35+ Odds Premier & Champions League VIP Slip"
                    className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm"
                    required
                  />
                </div>

                {/* Bookmaker Platform */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Bookmaker Platform *</Label>
                  <Select value={formBookmaker} onValueChange={setFormBookmaker}>
                    <SelectTrigger className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm">
                      <SelectValue placeholder="Select Bookmaker" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="SportyBet">SportyBet</SelectItem>
                      <SelectItem value="Betway">Betway</SelectItem>
                      <SelectItem value="1xBet">1xBet</SelectItem>
                      <SelectItem value="Mozzart">Mozzart</SelectItem>
                      <SelectItem value="22Bet">22Bet</SelectItem>
                      <SelectItem value="Bet9ja">Bet9ja</SelectItem>
                      <SelectItem value="General">General / Multi-Platform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Secret Booking Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Secret Booking Code *</Label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. BC-982417 or SB-82914"
                    className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm font-mono font-bold tracking-wider"
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    This code will only be revealed to paying customers.
                  </span>
                </div>

                {/* Odds */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Total Odds *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={formOdds}
                    onChange={(e) => setFormOdds(e.target.value)}
                    placeholder="e.g. 35.50"
                    className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm"
                    required
                  />
                </div>

                {/* Price in GHS */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-300">Price (GH₵) *</Label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormPrice("0")}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                          formPrice === "0" || Number(formPrice) === 0 && formPrice !== ""
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                            : "bg-emerald-950/60 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/60"
                        }`}
                      >
                        🎁 Free (0 GHS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPrice("10")}
                        className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:text-white"
                      >
                        10
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPrice("20")}
                        className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:text-white"
                      >
                        20
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0 for FREE or e.g. 15.00"
                      className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm pr-20"
                      required
                    />
                    {(formPrice === "0" || (Number(formPrice) === 0 && formPrice !== "")) && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">
                        FREE 🎁
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Set price to <strong>0</strong> to allow all users to claim and unlock this slip for free!
                  </span>
                </div>

                {/* Expiration Date & Time */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">
                    Expiration Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm"
                  />
                  <span className="text-[10px] text-slate-400">
                    Slip automatically disables when expired.
                  </span>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Category / Tier</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="VIP Banker">VIP Banker</SelectItem>
                      <SelectItem value="Mega Odds">Mega Odds</SelectItem>
                      <SelectItem value="Daily 2+ Odds">Daily 2+ Odds</SelectItem>
                      <SelectItem value="Daily 5+ Odds">Daily 5+ Odds</SelectItem>
                      <SelectItem value="Weekend Special">Weekend Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sport */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Sport</Label>
                  <Select value={formSport} onValueChange={setFormSport}>
                    <SelectTrigger className="h-10 bg-slate-900 border-slate-700 text-white rounded-xl text-sm">
                      <SelectValue placeholder="Sport" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="Football">Football / Soccer</SelectItem>
                      <SelectItem value="Basketball">Basketball (NBA/Euro)</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Multi-Sport">Multi-Sport Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview Image Cloudinary Uploader */}
                <div className="space-y-1.5 sm:col-span-2">
                  <CloudinaryImageUploader
                    label="Slip Preview Image (Cloudinary)"
                    description="Upload slip screenshot, odds breakdown, or banner. Stored on Cloudinary."
                    currentImageUrl={formPreviewImageUrl}
                    folder="booking_codes"
                    onImageUploaded={(url) => setFormPreviewImageUrl(url)}
                    onImageRemoved={() => setFormPreviewImageUrl("")}
                    previewAspectRatio="video"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formActive}
                    onCheckedChange={setFormActive}
                    id="code-active-switch"
                  />
                  <Label htmlFor="code-active-switch" className="text-xs font-bold text-white cursor-pointer">
                    {formActive ? "Status: ACTIVE 🟢" : "Status: INACTIVE 🔴"}
                  </Label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">
                  Matches Preview / Description / Analysis
                </Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Real Madrid vs Barcelona (Over 2.5), Man City vs Arsenal (GG)..."
                  rows={2}
                  className="bg-slate-900 border-slate-700 text-white rounded-xl text-sm"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                {editingCode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-xl border-slate-700 text-slate-300"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black text-xs uppercase px-8 h-11"
                >
                  {isSaving ? "Saving..." : editingCode ? "Update Booking Code 👑" : "Publish Booking Code 👑"}
                </Button>
              </div>
            </form>
          </Card>

          {/* CODES TABLE */}
          <Card className="rounded-3xl border-2 border-slate-800 bg-[#0F172A] overflow-hidden shadow-xl">
            <CardHeader className="bg-slate-900/50 p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-black text-white">
                  Active & Scheduled Booking Codes ({filteredCodes.length})
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Real-time list of all booking codes in Firestore.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter by title, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-slate-950 border-slate-700 text-white text-xs rounded-xl"
                />
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Platform</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Title / Slip</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Code</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Odds</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Price</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Expiration</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Sales</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                        No booking codes found. Use the form above to create your first booking code.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((c) => (
                      <TableRow key={c.id} className="border-slate-800/60 hover:bg-slate-900/40">
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <PlatformLogo platform={c.bookmaker} className="h-4 w-auto max-w-[80px]" />
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-white max-w-xs truncate">
                          {c.title}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => copyToClipboard(c.code, "Code")}
                            className="font-mono font-bold text-xs text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <span>{c.code}</span>
                            <Copy className="w-3 h-3 text-slate-500" />
                          </button>
                        </TableCell>
                        <TableCell className="font-black text-amber-400 text-xs">
                          {Number(c.odds).toFixed(2)}x
                        </TableCell>
                        <TableCell className="font-bold text-white text-xs">
                          {Number(c.price) === 0 ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-[10px] uppercase">
                              FREE 🎁
                            </Badge>
                          ) : (
                            `GH₵ ${Number(c.price).toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatExpiryString(c.expiresAt)}
                        </TableCell>
                        <TableCell className="font-black text-emerald-400 text-xs">
                          {c.totalPurchases || 0}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={c.active}
                            onCheckedChange={() => handleToggleActive(c.id, c.active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(c)}
                              className="h-8 w-8 p-0 text-slate-300 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCode(c.id, c.title)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. SALES HISTORY VIEW */}
      {activeSubTab === "sales" && (
        <Card className="rounded-3xl border-2 border-slate-800 bg-[#0F172A] overflow-hidden shadow-xl">
          <CardHeader className="bg-slate-900/50 p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Booking Codes Sales & Purchase Log ({filteredPurchases.length})
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Complete record of all customer booking code purchases with contact details and reference keys.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search email, phone, reference..."
                value={salesSearchQuery}
                onChange={(e) => setSalesSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-950 border-slate-700 text-white text-xs rounded-xl"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Date / Time</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Customer Email</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Phone</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Code Title</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Bookmaker</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Code</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Amount</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Reference</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                      No sales records match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((p) => (
                    <TableRow key={p.id} className="border-slate-800/60 hover:bg-slate-900/40">
                      <TableCell className="text-xs text-slate-300 whitespace-nowrap">
                        {p.createdAt?.seconds
                          ? new Date(p.createdAt.seconds * 1000).toLocaleString()
                          : "Recent"}
                      </TableCell>
                      <TableCell className="font-bold text-white text-xs">
                        {p.customerEmail}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300 font-mono">
                        {p.customerPhone || "—"}
                      </TableCell>
                      <TableCell className="font-bold text-slate-200 text-xs max-w-xs truncate">
                        {p.title}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary text-secondary font-black text-[10px] uppercase">
                          {p.bookmaker}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-xs text-amber-400">
                          {p.code}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-white text-xs">
                        {Number(p.price) === 0 ? (
                          <span className="text-emerald-400 font-black text-xs">FREE 🎁</span>
                        ) : (
                          `GH₵ ${Number(p.price).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-400">
                        {p.paymentReference || p.id}
                      </TableCell>
                      <TableCell>
                        {p.status === "pending" ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-[10px] uppercase">
                            PENDING ⏳
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-[10px] uppercase">
                            PAID ✅
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
