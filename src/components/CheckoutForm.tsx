import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bundle, Network, UserProfile } from "@/src/types";
import { auth, db } from "@/src/lib/firebase";
import { getApiUrl } from "@/src/lib/api";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Loader2,
  Smartphone,
  CreditCard,
  MessageSquare,
  Info,
  ShieldCheck,
  Crown,
  User,
} from "lucide-react";
import { toast } from "sonner";

const formSchema = z
  .object({
    recipientPhone: z.string().optional(),
    recipientNetwork: z.string(),
    amountSent: z.number().min(1, "Amount must be greater than 0"),
    fcUserId: z.string().optional(),
    fcUsername: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isGame =
      data.recipientNetwork === "FC Mobile Points" ||
      data.recipientNetwork === "FC Mobile Silver" ||
      data.recipientNetwork === "FC Mobile" ||
      data.recipientNetwork === "PUBG Mobile UC" ||
      data.recipientNetwork === "PUBG Mobile";
      
    const isPCGame = data.recipientNetwork === "PC Games";

    if (!isGame && !isPCGame) {
      if (!data.recipientPhone || !/^0\d{9}$/.test(data.recipientPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Phone must start with 0 and be 10 digits total (e.g., 05XXXXXXXX)",
          path: ["recipientPhone"],
        });
      }
    } else if (isGame) {
      if (!data.fcUserId || data.fcUserId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "User/Player ID is required",
          path: ["fcUserId"],
        });
      }
      if (!data.fcUsername || data.fcUsername.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username/Nickname is required",
          path: ["fcUsername"],
        });
      }
    }
  });

interface CheckoutFormProps {
  bundle: (Bundle & { wholesalePrice?: number }) | null;
  onClose: () => void;
  profile: UserProfile | null;
  agentContext?: any;
  isAgentUser?: boolean;
}

export default function CheckoutForm({
  bundle,
  onClose,
  profile,
  agentContext,
  isAgentUser,
}: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [orderId, setOrderId] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientNetwork:
        bundle?.network &&
        [
          "MTN",
          "Telecel",
          "AirtelTigo",
          "FC Mobile",
          "FC Mobile Points",
          "FC Mobile Silver",
          "PUBG Mobile",
          "PUBG Mobile UC",
          "PC Games",
        ].includes(bundle.network)
          ? bundle.network
          : "MTN",
      amountSent: bundle?.price || 0,
    },
  });

  const watchNetwork = watch("recipientNetwork");

  const isAgentBuyingFromOwnStore =
    !!(agentContext && auth.currentUser?.uid === agentContext.id);
  const isAgentBuyingOnHomePage = !agentContext && isAgentUser;
  const isAgentActive = !!(isAgentBuyingFromOwnStore || isAgentBuyingOnHomePage || isAgentUser);

  const amountStr = String(bundle?.dataAmount || bundle?.name || "");
  const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
  const gbValue = gbMatch ? parseFloat(gbMatch[1]) : 0;
  const isTelecel1to5 = bundle?.network === "Telecel" && gbValue >= 1 && gbValue <= 5;

  const isGame =
    watchNetwork === "FC Mobile Points" ||
    watchNetwork === "FC Mobile Silver" ||
    watchNetwork === "FC Mobile" ||
    watchNetwork === "PUBG Mobile" ||
    watchNetwork === "PUBG Mobile UC";

  const isFC =
    watchNetwork === "FC Mobile Points" ||
    watchNetwork === "FC Mobile Silver" ||
    watchNetwork === "FC Mobile";

  const paystackFee =
    (isAgentBuyingFromOwnStore || isAgentBuyingOnHomePage) && !(!!agentContext && isTelecel1to5) && !(bundle?.network === "MTN" && isAgentActive) ? 1.0 : 0.0;
  const hiddenGameCharge = isFC ? 0.0 : (isGame ? 1.0 : 0.0);

  const isTelecelHiddenChargeMain = 
    !agentContext && 
    bundle?.network === "Telecel" &&
    ((gbValue >= 1 && gbValue <= 5) || (gbValue >= 10 && gbValue <= 100));

  const hiddenTelecelCharge = isTelecelHiddenChargeMain ? 1.0 : (!!agentContext && isTelecel1to5 ? 2.0 : 0.0);

  const isMTN1to5 = bundle?.network === "MTN" && gbValue >= 1 && gbValue <= 5;
  const hiddenMTNCharge = isMTN1to5
    ? 1.0
    : (bundle?.network === "MTN" ? (isAgentActive ? 1.0 : (agentContext ? 0.0 : 1.0)) : 0.0);

  const finalAmountToCharge = Number(bundle?.price || 0) + paystackFee + hiddenGameCharge + hiddenTelecelCharge + hiddenMTNCharge;

  useEffect(() => {
    if (
      bundle &&
      [
        "MTN",
        "Telecel",
        "AirtelTigo",
        "FC Mobile",
        "FC Mobile Points",
        "FC Mobile Silver",
        "PUBG Mobile",
        "PUBG Mobile UC",
        "PC Games",
      ].includes(bundle.network)
    ) {
      setValue("recipientNetwork", bundle.network);
      setValue("amountSent", bundle.price);
    }
  }, [bundle, setValue]);

  useEffect(() => {
    if (profile?.phoneNumber) {
      setValue("recipientPhone", profile.phoneNumber);
    }
  }, [profile, bundle, setValue]);

  useEffect(() => {
    if (bundle?.network === "PC Games" && auth.currentUser && !isSubmitting) {
      handleSubmit(onSubmit)();
    }
  }, [bundle, auth.currentUser]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (orderStatus === "processing" && orderId) {
      unsubscribe = onSnapshot(doc(db, "orders", orderId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === "delivered" || data.status === "success") {
            setOrderStatus("success");
            if (data.network === "PC Games") {
              setTimeout(() => onClose(), 1500);
            }
          } else if (data.status === "declined" || data.status === "failed") {
            toast.error("Order was declined or failed.");
            onClose();
          }
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderStatus, orderId, onClose]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!bundle || !auth.currentUser) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    setIsSubmitting(true);

    let publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      try {
        const res = await fetch(getApiUrl("/api/paystack-public-key"));
        const resData = await res.json();
        publicKey = resData.publicKey;
      } catch (err) {
        console.error("Failed to fetch Paystack Public Key:", err);
      }
    }

    if (!publicKey) {
      toast.error(
        "Paystack Public Key is missing! Please set VITE_PAYSTACK_PUBLIC_KEY in settings. 👑",
      );
      console.error(
        "Paystack Public Key is not defined in environment variables or fetched from server.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // 0. Generate ID synchronously client-side WITHOUT saving to Firestore yet
      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      const wsPrice = Number(bundle.wholesalePrice || bundle.price);
      const agPrice = Number(bundle.price);
      const calculatedProfit = agPrice - wsPrice;

      // 1. Initiate Payment with Paystack Pop (using the top-level reactive fee calculations)

      // PRE-SAVE the order in Firestore with paymentStatus "pending" and status "pending" so the Admin can see it immediately!
      const initialOrderData = {
        email: auth.currentUser.email || "no-email@example.com",
        phone: data.recipientPhone || "",
        network: data.recipientNetwork,
        bundle: bundle.network === "PC Games" ? bundle.name : `${data.recipientNetwork} ${bundle.dataAmount}`,
        amount: Number(bundle.price),
        status: "pending",
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        customerName: profile?.fullName || auth.currentUser.displayName || "Royal Customer",
        reference: finalOrderId,
        paymentStatus: "pending",
        ...(data.fcUserId ? { fcUserId: data.fcUserId } : {}),
        ...(data.fcUsername ? { fcUsername: data.fcUsername } : {}),
        ...(isAgentUser || profile?.isAgent ? { isAgentOrder: true } : {}),
        ...(agentContext
          ? {
              agentId: agentContext.id,
              agent_id: agentContext.id,
              agentName: agentContext.agent_name,
              agent_name: agentContext.agent_name,
              wholesalePrice: wsPrice,
              wholesale_price: wsPrice,
              agentPrice: agPrice,
              agent_price: agPrice,
              profit: calculatedProfit,
              agent_profit: calculatedProfit,
              profitAwarded: false,
              profit_credited: false,
            }
          : {}),
      };

      await setDoc(doc(db, "orders", finalOrderId), initialOrderData);

      // If buyer is via an agent store, pre-create agent_orders entry too
      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: profile?.fullName || auth.currentUser.displayName || "Royal Customer",
            email: auth.currentUser.email || "no-email@example.com",
            phone: data.recipientPhone || "",
            network: data.recipientNetwork,
          },
          wholesale_price: wsPrice,
          agent_price: agPrice,
          profit: calculatedProfit,
          status: "pending",
          created_at: serverTimestamp(),
          paymentReference: finalOrderId,
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), initialAgentOrderData);
      }

      const mod = await import("@paystack/inline-js");
      let PaystackCtor: any = mod.default || mod;
      if (typeof PaystackCtor !== "function" && PaystackCtor.default) {
        PaystackCtor = PaystackCtor.default;
      }

      const paystack = new PaystackCtor();
 
       paystack.newTransaction({
        key: publicKey,
        email: auth.currentUser.email || "no-email@example.com",
        amount: Math.round(finalAmountToCharge * 100),
        currency: "GHS",
        reference: finalOrderId,
        callback_url: window.location.origin + "/?reference=" + finalOrderId,
        onSuccess: async (response: any) => {
          // Immediately show verifying/processing loader screen
          setOrderStatus("processing");
          setIsSubmitting(false);

          try {
            // Update the existing order's paymentStatus and references
            const updateFields: any = {
              paymentStatus: "success",
              reference: response.reference
            };
            if (agentContext) {
              updateFields.profitAwarded = true;
              updateFields.profit_credited = true;
            }
            await updateDoc(doc(db, "orders", finalOrderId), updateFields);

            toast.success("Payment successful! Order logged in Admin Dashboard 👑");
            setOrderStatus("success");

            // If PC Games, redirect after a short while, otherwise handle 4 second timeout
            if (bundle.network === "PC Games") {
              setTimeout(() => {
                window.location.href = `/download?orderId=${finalOrderId}`;
              }, 2000);
            } else {
              setTimeout(() => {
                setOrderStatus("idle");
                onClose?.();
              }, 4000);
            }
          } catch (error) {
            console.error("Firestore order update error:", error);
            toast.error("An error occurred updating your order. Please contact support with reference: " + response.reference, { duration: 10000 });
            setOrderStatus("idle");
            onClose();
          }
        },
        onCancel: async () => {
          console.log("Paystack payment cancelled by user. Cleaning up pending order.");
          try {
            await deleteDoc(doc(db, "orders", finalOrderId));
            if (agentContext) {
              await deleteDoc(doc(db, "agent_orders", finalOrderId));
            }
          } catch (err) {
            console.error("Failed to delete cancelled order:", err);
          }
          onClose();
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      console.error("Checkout Error:", err);
      // Detailed error logging
      if (err.code) console.error("Error Code:", err.code);
      if (err.message) console.error("Error Message:", err.message);
      toast.error("Failed to start checkout. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = (target: "kingj" | "yhaw" | "agent") => {
    let phone = "";
    let text = "";

    if (target === "kingj") {
      phone = "233535884851";
      text = `Hello, I just placed an order on King J Deals! 👑\n\nOrder ID: #${orderId.slice(-6).toUpperCase()}\nRef: ${orderDetails?.referenceCode || ""}\n\nPlease check my order status.`;
    } else if (target === "yhaw") {
      phone = "233541557530";
      text = `Hello, I just placed an order on King J Deals! 👑\n\nOrder ID: #${orderId.slice(-6).toUpperCase()}\nRef: ${orderDetails?.referenceCode || ""}\n\nPlease check my order status.`;
    } else if (target === "agent") {
      const num = agentContext?.momo_number
        ? agentContext.momo_number.trim()
        : "";
      if (num.startsWith("0")) {
        phone = "233" + num.slice(1);
      } else if (num && !num.startsWith("233")) {
        phone = "233" + num;
      } else {
        phone = num;
      }
      text = `Hello, I just placed an order on your store (${agentContext?.agent_name || "Agent"})! 👑\n\nOrder ID: #${orderId.slice(-6).toUpperCase()}\nRef: ${orderDetails?.referenceCode || ""}\n\nPlease check my order status.`;
    }

    if (phone) {
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    }
  };

  // Mock orderDetails for WhatsApp if needed
  const orderDetails = { referenceCode: orderId.slice(-8).toUpperCase() };

  if (!bundle) return null;

  return (
    <Dialog open={!!bundle} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[95vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] border-2 sm:border-4 border-slate-100 dark:border-slate-800 bg-background shadow-2xl p-0">
        {bundle.network === "PC Games" && isSubmitting ? (
          <div className="py-16 sm:py-24 text-center space-y-6 sm:space-y-8 px-6 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary/20 animate-pulse">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white uppercase">
                Redirecting to Payment... 👑
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto text-xs sm:text-sm leading-relaxed lowercase italic opacity-80">
                Please complete your payment to get your game.
              </p>
            </div>
          </div>
        ) : orderStatus === "processing" ? (
          <div className="py-16 sm:py-24 text-center space-y-6 sm:space-y-8 px-6 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary/20 animate-pulse">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white uppercase">
                Verifying Royalty... 👑
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto text-xs sm:text-sm leading-relaxed lowercase italic opacity-80">
                Confirming your payment. Stay on this screen.
              </p>
            </div>
          </div>
        ) : orderStatus === "success" ? (
          <div className="py-12 sm:py-16 text-center space-y-6 px-6 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/20 shadow-2xl animate-bounce">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white uppercase">
                Payment Completed! 🚀
              </h2>
              <div className="space-y-3 max-w-md mx-auto">
                <p className="text-slate-700 dark:text-slate-200 font-bold text-sm sm:text-base leading-relaxed">
                  {bundle.network === "PC Games" ? (
                    <span>Your game <strong>{bundle.name}</strong> is ready. Redirecting you to the download page...</span>
                  ) : (
                    <span><strong>{bundle.network} {bundle.dataAmount}</strong> will be received shortly. If the order delays, please contact the admin on support. 👑</span>
                  )}
                </p>
                {orderId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                    Order ID: #{orderId.slice(-6).toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => onClose()}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close Window
              </button>
              <button
                onClick={() => handleWhatsApp("kingj")}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Contact Support
              </button>
            </div>
          </div>
        ) : orderStatus === "idle" ? (
          <div className="p-4 sm:p-10 space-y-4 sm:space-y-8">
            <DialogHeader className="text-center">
              <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 bg-primary text-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl mb-2 sm:mb-4 rotate-3">
                <Smartphone className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              <DialogTitle className="text-xl sm:text-3xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                ROYAL CHECKOUT 👑
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-[10px] sm:text-sm">
                Instant delivery for all data bundles.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-3xl p-3 sm:p-6 space-y-1 sm:space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
              <h3 className="font-black text-primary text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-2 tracking-widest uppercase">
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                SECURE TRANSACTION
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold lowercase opacity-70 relative z-10">
                You will be redirected to paystack for payment.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-8"
            >
              <div className="space-y-3 sm:space-y-6">
                <div className="bg-primary/5 p-3 sm:p-6 rounded-xl sm:rounded-[2.5rem] border-2 border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">
                      Bundle
                    </p>
                    <p className="font-black text-foreground dark:text-white text-sm sm:text-lg leading-none">
                      {bundle.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Total
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-primary">
                      GHS {finalAmountToCharge.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Pricing Breakdown & Notification */}
                <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8" />
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Base Bundle Price</span>
                    <span className="font-mono">GHS {Number(bundle.price).toFixed(2)}</span>
                  </div>
                  
                  {isMTN1to5 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span className="flex items-center gap-1">
                        Charges
                      </span>
                      <span className="font-mono">+ GHS 1.00</span>
                    </div>
                  )}

                  {!isMTN1to5 && hiddenMTNCharge > 0 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>Charges</span>
                      <span className="font-mono">+ GHS {hiddenMTNCharge.toFixed(2)}</span>
                    </div>
                  )}

                  {hiddenTelecelCharge > 0 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>Charges</span>
                      <span className="font-mono">+ GHS {hiddenTelecelCharge.toFixed(2)}</span>
                    </div>
                  )}

                  {hiddenGameCharge > 0 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>Processing Fee</span>
                      <span className="font-mono">+ GHS {hiddenGameCharge.toFixed(2)}</span>
                    </div>
                  )}

                  {paystackFee > 0 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>Gateway Fee</span>
                      <span className="font-mono">+ GHS {paystackFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center font-black text-sm text-foreground dark:text-white">
                    <span>Final Amount to Pay</span>
                    <span className="text-primary font-black text-base sm:text-lg font-mono">
                      GHS {finalAmountToCharge.toFixed(2)}
                    </span>
                  </div>

                  {isMTN1to5 && (
                    <p className="text-[10px] sm:text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight text-center pt-1 leading-snug animate-pulse">
                      ⚠️ Charges of GHS 1.00 will be charged.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-6">
                  {watchNetwork === "FC Mobile Points" ||
                  watchNetwork === "FC Mobile Silver" ||
                  watchNetwork === "FC Mobile" ||
                  watchNetwork === "PUBG Mobile" ||
                  watchNetwork === "PUBG Mobile UC" ? (
                    <>
                      <div className="space-y-1">
                        <Label
                          htmlFor="fcUserId"
                          className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1"
                        >
                          User ID / Player ID (e.g. 1034714769079812097)
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="fcUserId"
                            placeholder="Enter User / Player ID"
                            {...register("fcUserId")}
                            className="rounded-lg sm:rounded-[1.25rem] h-11 sm:h-14 pl-10 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-[#00FF87] font-black text-sm sm:text-lg tracking-wider text-foreground"
                          />
                        </div>
                        {errors.fcUserId && (
                          <p className="text-red-500 text-[10px] font-black mt-1 ml-1 uppercase">
                            {errors.fcUserId.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="fcUsername"
                          className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1"
                        >
                          Username / Character Nickname
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="fcUsername"
                            placeholder="Enter Accurate Username / Nickname"
                            {...register("fcUsername")}
                            className="rounded-lg sm:rounded-[1.25rem] h-11 sm:h-14 pl-10 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-[#00FF87] font-black text-sm sm:text-lg tracking-wider text-foreground"
                          />
                        </div>
                        {errors.fcUsername && (
                          <p className="text-red-500 text-[10px] font-black mt-1 ml-1 uppercase">
                            {errors.fcUsername.message}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label
                          htmlFor="recipientPhone"
                          className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1"
                        >
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="recipientPhone"
                            placeholder="0XXXXXXXXX"
                            {...register("recipientPhone")}
                            className="rounded-lg sm:rounded-[1.25rem] h-11 sm:h-14 pl-10 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-primary/50 font-black text-sm sm:text-lg tracking-wider text-foreground"
                          />
                        </div>
                        {errors.recipientPhone && (
                          <p className="text-red-500 text-[10px] font-black mt-1 ml-1 uppercase">
                            {errors.recipientPhone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="recipientNetwork"
                          className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1"
                        >
                          Network
                        </Label>
                        <Select
                          defaultValue={bundle.network}
                          value={watchNetwork}
                          onValueChange={(v) =>
                            setValue(
                              "recipientNetwork",
                              v as "MTN" | "Telecel" | "AirtelTigo",
                            )
                          }
                        >
                          <SelectTrigger className="rounded-lg sm:rounded-[1.25rem] h-11 sm:h-14 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-primary/50 font-black text-sm sm:text-lg text-foreground">
                            <SelectValue placeholder="Network" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2 dark:bg-slate-950 dark:border-slate-800">
                            <SelectItem value="MTN" className="font-black">
                              MTN 👑
                            </SelectItem>
                            <SelectItem value="Telecel" className="font-black">
                              Telecel 👑
                            </SelectItem>
                            <SelectItem
                              value="AirtelTigo"
                              className="font-black"
                            >
                              AirtelTigo 👑
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-16 text-base sm:text-xl font-black gap-2 sm:gap-3 rounded-xl sm:rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all bg-primary text-secondary mb-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span>PREPARING...</span>
                  </div>
                ) : (
                  <>
                    <Crown className="w-4 h-4 sm:w-6 sm:h-6" />
                    PURCHASE NOW 👑
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="text-center bg-white dark:bg-slate-950 h-full flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 text-white rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 shadow-2xl rotate-12 scale-110 animate-bounce">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground dark:text-white leading-none">
                ORDER RECEIVED! 👑
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg leading-relaxed lowercase italic">
                Order submitted for{" "}
                <span className="text-primary font-black uppercase not-italic">
                  {bundle.dataAmount}
                </span>
                .
              </p>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-4 mb-8 sm:mb-10 border-2 border-slate-100 dark:border-slate-800 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-500/5 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
              <p className="text-[9px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> RECIPIENT
                INFORMATION SECURED
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                Your order is logged. The admin will verify any payment and
                process delivery in 2-5 minutes.
              </p>
              <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700 mt-3 sm:mt-4 flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Order ID
                </span>
                <span className="font-mono font-black text-primary text-xs sm:text-sm">
                  #{orderId.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 sm:gap-4">
              <Button
                variant="default"
                className="w-full h-14 sm:h-16 text-lg sm:text-xl font-black rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-primary text-white dark:text-secondary shadow-xl hover:bg-black transition-all"
                onClick={onClose}
              >
                ROYAL DISMISSAL 👑
              </Button>

              {agentContext ? (
                <Button
                  variant="outline"
                  className="w-full h-12 sm:h-14 font-black rounded-xl sm:rounded-2xl border-4 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2 text-xs sm:text-sm uppercase"
                  onClick={() => handleWhatsApp("agent")}
                >
                  <MessageSquare className="w-4 h-4" />
                  CHAT WITH {agentContext.agent_name || "AGENT"} 👑
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    className="h-12 sm:h-14 font-black rounded-xl sm:rounded-2xl border-4 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2 text-[10px] sm:text-xs"
                    onClick={() => handleWhatsApp("kingj")}
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    KING J
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 sm:h-14 font-black rounded-xl sm:rounded-2xl border-4 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2 text-[10px] sm:text-xs"
                    onClick={() => handleWhatsApp("yhaw")}
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    YHAW
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
