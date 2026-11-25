import React, { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getApiUrl } from "@/src/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  status: "in_stock" | "out_of_stock";
  updatedAt?: any;
  updatedBy?: string;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: "mtn", name: "MTN Data", description: "MTN data bundles and topups", status: "in_stock" },
  { id: "airteltigo", name: "AirtelTigo (AT)", description: "AirtelTigo / AT data bundles", status: "in_stock" },
  { id: "telecel", name: "Telecel", description: "Telecel data bundles and topups", status: "in_stock" },
  { id: "checkers", name: "Checkers", description: "Results checker pins (WAEC, BECE, NOVDEC)", status: "in_stock" },
  { id: "booking_codes", name: "Booking Codes", description: "VIP betting booking codes", status: "in_stock" },
  { id: "game_coins", name: "Game Coins", description: "FC Mobile points and mobile game currency", status: "in_stock" },
  { id: "pc_games", name: "PC Games", description: "PC games digital downloads and setups", status: "in_stock" },
];

export default function AdminServiceStatusManager() {
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial REST fetch
    const fetchStatuses = async () => {
      try {
        const res = await fetch(getApiUrl("/api/service-status"));
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.statuses) {
          const updated = DEFAULT_SERVICES.map((def) => {
            const remote = data.statuses[def.id];
            if (remote) {
              return {
                ...def,
                status: remote.status === "out_of_stock" ? "out_of_stock" : "in_stock",
                updatedAt: remote.updatedAt,
              };
            }
            return def;
          });
          setServices(updated);
        }
      } catch (err) {
        console.warn("[Service Status] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();

    // 2. Real-time Firestore snapshot listener
    let unsubscribe: (() => void) | undefined;
    try {
      const colRef = collection(db, "service_status");
      unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          const map: Record<string, any> = {};
          snap.docs.forEach((d) => {
            map[d.id] = d.data();
          });
          setServices((prev) =>
            prev.map((def) => {
              const remote = map[def.id];
              if (remote) {
                return {
                  ...def,
                  status: remote.status === "out_of_stock" ? "out_of_stock" : "in_stock",
                  updatedAt: remote.updatedAt,
                  updatedBy: remote.updatedBy,
                };
              }
              return def;
            })
          );
          setLoading(false);
        },
        (err) => {
          console.warn("[Service Status] Snapshot listener notice:", err?.message || err);
        }
      );
    } catch (e) {
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleToggleStatus = async (serviceId: string, currentStatus: "in_stock" | "out_of_stock") => {
    const newStatus = currentStatus === "in_stock" ? "out_of_stock" : "in_stock";
    setUpdatingId(serviceId);

    try {
      const targetSvc = services.find((s) => s.id === serviceId);
      await setDoc(
        doc(db, "service_status", serviceId),
        {
          serviceId,
          serviceName: targetSvc?.name || serviceId,
          status: newStatus,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.email || "Admin",
        },
        { merge: true }
      );

      if (serviceId === "checkers") {
        await setDoc(
          doc(db, "settings", "results_checker"),
          {
            inStock: newStatus === "in_stock",
            isOutOfStock: newStatus === "out_of_stock",
            outOfStock: newStatus === "out_of_stock",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((syncErr) => {
          console.warn("[Service Status] Legacy results_checker sync notice:", syncErr);
        });
      }

      // Optimistic state update
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: newStatus } : s))
      );

      toast.success(
        `${targetSvc?.name || serviceId} marked as ${newStatus === "in_stock" ? "In Stock 🟢" : "Out of Stock 🔴"}`
      );
    } catch (err: any) {
      console.error("[Service Status Update Error]:", err);
      toast.error(err?.message || "Failed to update service status in database");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Service Status
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Manage the availability of services displayed on your storefront. Out-of-stock services display a badge and block new customer purchases instantly.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading service availability...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => {
              const isInStock = svc.status === "in_stock";
              const isUpdating = updatingId === svc.id;

              return (
                <div
                  key={svc.id}
                  className={`rounded-2xl border-2 p-5 transition-all flex flex-col justify-between gap-4 ${
                    isInStock
                      ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                      : "border-red-500/40 bg-red-500/10 dark:bg-red-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {svc.name}
                        </h3>
                        <Badge
                          className={`font-black text-[9px] uppercase px-2 py-0.5 rounded-lg ${
                            isInStock
                              ? "bg-emerald-500 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {isInStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {svc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      <Switch
                        checked={isInStock}
                        disabled={isUpdating}
                        onCheckedChange={() => handleToggleStatus(svc.id, svc.status)}
                        className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                        aria-label={`Toggle availability for ${svc.name}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      {isInStock ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Storefront purchasing active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>Purchases blocked &amp; badged</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[10px]">ID: {svc.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
