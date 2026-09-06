import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { AppDownload } from "@/src/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Smartphone,
  Users,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Crown,
  Globe,
  Monitor,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDownloadsManager() {
  const [downloads, setDownloads] = useState<AppDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "registered" | "guests" | "android" | "desktop">("all");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "app_downloads"), orderBy("downloadedAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppDownload[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || null,
            customerName: data.customerName || "Visitor (Guest)",
            customerEmail: data.customerEmail || "",
            customerPhone: data.customerPhone || "",
            isRegisteredUser: Boolean(data.isRegisteredUser),
            deviceType: data.deviceType || "android",
            platform: data.platform || "Unknown",
            userAgent: data.userAgent || "",
            source: data.source || "website_modal",
            downloadUrl: data.downloadUrl || "https://kingjdeals.site/downloads/King-J-Deals.apk",
            apkName: data.apkName || "King-J-Deals.apk",
            downloadedAt: data.downloadedAt,
          };
        });
        setDownloads(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to app_downloads:", error);
        toast.error("Failed to load app downloads in real-time");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, customerName: string) => {
    if (!window.confirm(`Are you sure you want to delete the download record for "${customerName}"?`)) {
      return;
    }

    try {
      setIsDeletingId(id);
      await deleteDoc(doc(db, "app_downloads", id));
      toast.success("Download log deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete record:", err);
      toast.error("Failed to delete download record");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (downloads.length === 0) return;
    const confirmText = prompt(
      `Type "DELETE ALL" to permanently erase all ${downloads.length} download logs:`
    );
    if (confirmText !== "DELETE ALL") {
      if (confirmText !== null) toast.info("Action cancelled");
      return;
    }

    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "app_downloads"));
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      toast.success("All download records have been cleared");
    } catch (err) {
      console.error("Clear all failed:", err);
      toast.error("Failed to clear records");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (downloads.length === 0) {
      toast.error("No download data to export");
      return;
    }

    const headers = [
      "Customer Name",
      "Registered User",
      "Email",
      "Phone",
      "Device Type",
      "Platform",
      "Source",
      "Downloaded At",
      "User ID",
      "User Agent"
    ];

    const rows = downloads.map((d) => {
      const dateStr = d.downloadedAt?.toDate
        ? d.downloadedAt.toDate().toLocaleString()
        : d.downloadedAt
        ? new Date(d.downloadedAt).toLocaleString()
        : "N/A";

      return [
        `"${(d.customerName || "").replace(/"/g, '""')}"`,
        d.isRegisteredUser ? "Yes" : "No (Guest)",
        `"${(d.customerEmail || "").replace(/"/g, '""')}"`,
        `"${(d.customerPhone || "").replace(/"/g, '""')}"`,
        d.deviceType,
        `"${(d.platform || "").replace(/"/g, '""')}"`,
        d.source || "",
        `"${dateStr}"`,
        d.userId || "",
        `"${(d.userAgent || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `King-J-Deals-App-Downloads-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded CSV report!");
  };

  // Metrics calculation
  const totalDownloads = downloads.length;
  const registeredCount = downloads.filter((d) => d.isRegisteredUser).length;
  const guestCount = downloads.filter((d) => !d.isRegisteredUser).length;
  const androidCount = downloads.filter((d) => d.deviceType === "android").length;
  const desktopCount = downloads.filter((d) => d.deviceType === "desktop").length;

  // Filtered list
  const filteredDownloads = downloads.filter((item) => {
    // Type filter
    if (filterType === "registered" && !item.isRegisteredUser) return false;
    if (filterType === "guests" && item.isRegisteredUser) return false;
    if (filterType === "android" && item.deviceType !== "android") return false;
    if (filterType === "desktop" && item.deviceType !== "desktop") return false;

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = item.customerName?.toLowerCase().includes(q);
      const matchEmail = item.customerEmail?.toLowerCase().includes(q);
      const matchPhone = item.customerPhone?.toLowerCase().includes(q);
      const matchPlatform = item.platform?.toLowerCase().includes(q);
      const matchDevice = item.deviceType?.toLowerCase().includes(q);
      const matchUserId = item.userId?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchPlatform || matchDevice || matchUserId;
    }

    return true;
  });

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Recently";
    }
  };

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 p-6 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                App Downloads Hub 📱
                <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full border-none">
                  {totalDownloads} Total
                </Badge>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Track every customer and visitor who downloads the King J Deals Android APK through the website.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="rounded-xl border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          {downloads.length > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="sm"
              className="rounded-xl border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Downloads */}
        <Card className="rounded-2xl border bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Downloads</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalDownloads}
            </span>
            <span className="text-[11px] font-semibold text-amber-500">People</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Through website download modal</p>
        </Card>

        {/* Registered Customers */}
        <Card className="rounded-2xl border bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {registeredCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              ({totalDownloads > 0 ? Math.round((registeredCount / totalDownloads) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Customers with accounts</p>
        </Card>

        {/* Guests / Visitors */}
        <Card className="rounded-2xl border bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Visitors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {guestCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              ({totalDownloads > 0 ? Math.round((guestCount / totalDownloads) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Guests before signing in</p>
        </Card>

        {/* Android Mobile */}
        <Card className="rounded-2xl border bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Android Devices</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {androidCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {desktopCount > 0 ? `+${desktopCount} PC` : "100% Mobile"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Android 7.0+ phones</p>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="rounded-3xl border-2 overflow-hidden bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-amber-500" />
                Customer Downloads Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Detailed customer identities, phone numbers, emails, and download logs.
              </CardDescription>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All ({totalDownloads})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("registered")}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === "registered"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Registered ({registeredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("guests")}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === "guests"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Guests ({guestCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("android")}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === "android"
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Android ({androidCount})
              </button>
            </div>
          </div>

          {/* Search Field */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone number, device, or platform..."
              className="pl-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
              <p className="text-xs font-bold">Loading real-time app download records...</p>
            </div>
          ) : filteredDownloads.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {searchQuery ? "No matching download records found" : "No app downloads recorded yet"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {searchQuery
                    ? `No customer matches "${searchQuery}". Try a different name, email, or phone number.`
                    : "Whenever visitors or registered customers click 'Download App' or download King-J-Deals.apk on the site, their name, phone, email, and device will appear here instantly."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500 w-12">#</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500">Customer</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500">Contact</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500">Account Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500">Device & Platform</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500">Date & Time</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDownloads.map((item, index) => {
                    const relative = getRelativeTime(item.downloadedAt);
                    const formattedDate = formatDateTime(item.downloadedAt);

                    return (
                      <TableRow
                        key={item.id}
                        className="border-b dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Index Number */}
                        <TableCell className="text-[11px] font-bold text-slate-400">
                          {index + 1}
                        </TableCell>

                        {/* Customer Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                              item.isRegisteredUser
                                ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 border border-amber-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border dark:border-slate-700"
                            }`}>
                              {item.isRegisteredUser ? (
                                <Crown className="w-4 h-4" />
                              ) : (
                                <Globe className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {item.customerName || "Visitor (Guest)"}
                              </p>
                              {item.userId ? (
                                <p className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                                  UID: {item.userId.substring(0, 10)}...
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-400">
                                  Guest Visitor
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Contact Info (Email & Phone) */}
                        <TableCell>
                          <div className="space-y-0.5">
                            {item.customerEmail ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                                <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="font-medium truncate max-w-[200px]">{item.customerEmail}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No email</span>
                            )}

                            {item.customerPhone ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <Phone className="w-3 h-3 shrink-0" />
                                <a
                                  href={`tel:${item.customerPhone}`}
                                  className="font-bold hover:underline"
                                >
                                  {item.customerPhone}
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Account Status Badge */}
                        <TableCell>
                          {item.isRegisteredUser ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Registered Customer
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border dark:border-slate-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                              <Globe className="w-3 h-3" />
                              Site Visitor
                            </Badge>
                          )}
                        </TableCell>

                        {/* Device & Platform */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {item.deviceType === "android" ? (
                                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" />
                                  Android Mobile
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Monitor className="w-3 h-3" />
                                  Desktop / Browser
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={item.userAgent || item.platform}>
                              {item.platform || "Web"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formattedDate}</span>
                            </div>
                            {relative && (
                              <span className="text-[10px] font-semibold text-amber-500">
                                {relative}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleDelete(item.id, item.customerName)}
                            disabled={isDeletingId === item.id}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg cursor-pointer transition-colors"
                            title="Delete this record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
