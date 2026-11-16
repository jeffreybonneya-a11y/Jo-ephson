import React, { useState, useEffect, useMemo } from "react";
import { auth } from "@/src/lib/firebase";
import { getApiUrl } from "@/src/lib/api";
import { normalizeGhanaPhone, formatGhanaPhoneDisplay } from "@/src/lib/phoneUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Send,
  MessageSquare,
  Crown,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/src/types";

export const SUPPORT_CATEGORIES = [
  "Payment problem",
  "Order not received",
  "Delayed delivery",
  "Wrong data bundle or service",
  "Incorrect order",
  "Account problem",
  "Other enquiry",
] as const;

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  profile: UserProfile | null;
  agentContext?: any;
  initialOrderRef?: string;
  initialPhone?: string;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `supp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function SupportModal({
  isOpen,
  onClose,
  user,
  profile,
  agentContext,
  initialOrderRef = "",
  initialPhone = "",
}: SupportModalProps) {
  const activeUser = user || auth.currentUser;
  const accountPhone = useMemo(() => {
    const raw = profile?.phoneNumber || profile?.phone || activeUser?.phoneNumber || "";
    return normalizeGhanaPhone(raw) || "";
  }, [profile?.phoneNumber, profile?.phone, activeUser?.phoneNumber]);

  const accountEmail = useMemo(() => {
    return (profile?.email || activeUser?.email || "").trim();
  }, [profile?.email, activeUser?.email]);

  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0]);
  const [phone, setPhone] = useState<string>("");
  const [editVerifiedPhone, setEditVerifiedPhone] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [orderRef, setOrderRef] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    category?: string;
    phone?: string;
    email?: string;
    message?: string;
    form?: string;
  }>({});
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketRef: string;
    category: string;
    phone: string;
    email?: string;
    orderRef?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubmittedTicket(null);
    setFieldErrors({});
    setEditVerifiedPhone(false);

    const prefillPhone = normalizeGhanaPhone(initialPhone) || accountPhone || "";
    setPhone(prefillPhone);
    setEmail(accountEmail || "");
    setOrderRef(initialOrderRef || "");
    setIdempotencyKey(generateIdempotencyKey());
  }, [isOpen, accountPhone, accountEmail, initialOrderRef, initialPhone]);

  const validateForm = () => {
    const errs: typeof fieldErrors = {};
    if (!category || !SUPPORT_CATEGORIES.includes(category as any)) {
      errs.category = "Please select a complaint category.";
    }

    const effectivePhone = (!editVerifiedPhone && accountPhone && !initialPhone) ? accountPhone : phone;
    const normalized = normalizeGhanaPhone(effectivePhone);
    if (!normalized) {
      errs.phone = "Enter a valid Ghanaian phone number (e.g. 0241234567 or +233241234567) matching your purchase number.";
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address or leave it blank.";
    }

    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 10) {
      errs.message = "Please describe your issue in at least 10 characters.";
    }

    setFieldErrors(errs);
    return { valid: Object.keys(errs).length === 0, normalizedPhone: normalized, trimmedEmail, trimmedMsg };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const { valid, normalizedPhone, trimmedEmail, trimmedMsg } = validateForm();
    if (!valid || !normalizedPhone) return;

    setIsLoading(true);
    setFieldErrors({});

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch {}
      }

      const res = await fetch(getApiUrl("/api/support/tickets"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          category,
          phone: normalizedPhone,
          email: trimmedEmail,
          orderRef: orderRef.trim(),
          message: trimmedMsg,
          customerName: profile?.fullName || activeUser?.displayName || "",
          idempotencyKey,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.ticketRef) {
        const errMsg = data.error || "Failed to submit support ticket. Please try again.";
        if (data.field && ["category", "phone", "email", "message"].includes(data.field)) {
          setFieldErrors({ [data.field]: errMsg });
        } else {
          setFieldErrors({ form: errMsg });
        }
        toast.error(errMsg);
        return;
      }

      setSubmittedTicket({
        ticketRef: data.ticketRef,
        category,
        phone: normalizedPhone,
        email: trimmedEmail,
        orderRef: orderRef.trim(),
      });
      toast.success(`Support ticket ${data.ticketRef} submitted!`);
      setMessage("");
      setOrderRef("");
    } catch (err: any) {
      const msg = "Network error while sending support ticket. Please check your connection and try again.";
      setFieldErrors({ form: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAnother = () => {
    setSubmittedTicket(null);
    setFieldErrors({});
    setMessage("");
    setOrderRef("");
    setIdempotencyKey(generateIdempotencyKey());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none bg-white dark:bg-slate-950 max-h-[92vh] overflow-y-auto">
        <div className="bg-secondary p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black text-center tracking-tight">
              How can we help you?
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 mt-1.5 text-xs sm:text-sm">
              Submit a support ticket below and our team will review your request promptly.
            </DialogDescription>
          </DialogHeader>
        </div>

        {submittedTicket ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Support Ticket Submitted
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your complaint has been saved securely and routed to our support team. Keep your ticket reference for follow-up:
              </p>
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 font-mono font-black text-lg text-amber-600 dark:text-amber-300 tracking-wider mt-2">
                {submittedTicket.ticketRef}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 font-bold">Category:</span>
                <span className="font-bold text-slate-900 dark:text-white">{submittedTicket.category}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 font-bold">Purchase Phone:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatGhanaPhoneDisplay(submittedTicket.phone)}</span>
              </div>
              {submittedTicket.email && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 font-bold">Email:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{submittedTicket.email}</span>
                </div>
              )}
              {submittedTicket.orderRef && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 font-bold">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{submittedTicket.orderRef}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleResetAnother} className="flex-1 h-12 rounded-xl font-bold cursor-pointer">
                Submit Another
              </Button>
              <Button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl font-black bg-primary text-secondary hover:bg-primary/90 cursor-pointer">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {fieldErrors.form && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{fieldErrors.form}</span>
              </div>
            )}

            {/* 1. Complaint Category */}
            <div className="space-y-1.5">
              <Label htmlFor="support-category" className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                Complaint Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="support-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SUPPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <p className="text-xs text-red-500 font-semibold">{fieldErrors.category}</p>}
            </div>

            {/* 2. Phone Number (Compulsory, separate from email) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="support-phone" className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                  Purchase Phone Number <span className="text-red-500">*</span>
                </Label>
                {accountPhone && !editVerifiedPhone && (
                  <button
                    type="button"
                    onClick={() => setEditVerifiedPhone(true)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Use a different number
                  </button>
                )}
              </div>

              {accountPhone && !editVerifiedPhone && !initialPhone ? (
                <div className="flex items-center justify-between gap-2 h-11 px-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm">
                  <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    {formatGhanaPhoneDisplay(accountPhone)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Account Phone
                  </span>
                </div>
              ) : (
                <Input
                  id="support-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="e.g. 0241234567 or +233241234567"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-semibold"
                />
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {activeUser && !accountPhone
                  ? "No purchase phone is saved on your account yet. Enter the Ghanaian phone number you used for your purchase."
                  : "Must match the Ghanaian phone number used when purchasing so we can verify your order."}
              </p>
              {fieldErrors.phone && <p className="text-xs text-red-500 font-semibold">{fieldErrors.phone}</p>}
            </div>

            {/* 3. Email Address (Separate field) + Optional Order Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="support-email" className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                  Email Address {activeUser ? "" : "(Optional)"}
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  readOnly={Boolean(activeUser && accountEmail)}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm"
                />
                {fieldErrors.email && <p className="text-xs text-red-500 font-semibold">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-order-ref" className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                  Order Reference (Optional)
                </Label>
                <Input
                  id="support-order-ref"
                  type="text"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="e.g. DGN_... or Order ID"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* 4. Complaint / Message Description */}
            <div className="space-y-1.5">
              <Label htmlFor="support-message" className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                Describe Your Issue <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="support-message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, message: undefined }));
                }}
                placeholder="Please provide clear details about your payment, bundle, recipient number, or issue..."
                className="min-h-[120px] border-slate-200 dark:border-slate-800 focus:border-primary rounded-xl resize-y dark:bg-slate-900 dark:text-white text-sm"
              />
              {fieldErrors.message && <p className="text-xs text-red-500 font-semibold">{fieldErrors.message}</p>}
            </div>

            {/* Submit & Cancel */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 font-bold rounded-xl border-2 cursor-pointer"
                onClick={onClose}
                disabled={isLoading}
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                className="flex-[2] h-12 font-black text-sm sm:text-base bg-primary text-secondary hover:bg-primary/90 rounded-xl shadow-lg transition-all active:scale-95 gap-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    SUBMIT TICKET
                  </>
                )}
              </Button>
            </div>

            {/* Direct Contact Strip */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-3.5 rounded-xl flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1.5 w-full text-xs">
                <p className="text-amber-800 dark:text-amber-200 font-bold">
                  Direct Support Channels:
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a
                    href="mailto:support@dataghananow.com"
                    className="inline-flex items-center gap-1.5 text-primary font-black hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    support@dataghananow.com
                  </a>
                  {agentContext ? (
                    <a
                      href={`https://wa.me/233${agentContext.momo_number ? agentContext.momo_number.trim().replace(/^0/, "") : ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-black hover:underline"
                    >
                      WhatsApp {agentContext.agent_name || "Agent"}: {agentContext.momo_number || ""}
                    </a>
                  ) : (
                    <>
                      <a href="https://wa.me/233535884851" target="_blank" rel="noreferrer" className="text-primary font-black hover:underline">
                        WhatsApp: 0535884851
                      </a>
                      <a href="https://wa.me/233541557530" target="_blank" rel="noreferrer" className="text-primary font-black hover:underline">
                        WhatsApp: 0541557530
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
