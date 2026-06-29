import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bundle, Network, UserProfile } from "@/src/types";
import { auth, db } from "@/src/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  onSnapshot
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
          if (data.status === "delivered") {
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
        const res = await fetch("/api/paystack-public-key");
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
      // 0. Generate ID synchronously
      const preOrderRef = doc(collection(db, "orders"));
      const preOrderId = preOrderRef.id;

      const wsPrice = Number(bundle.wholesalePrice || bundle.price);
      const agPrice = Number(bundle.price);
      const calculatedProfit = agPrice - wsPrice;

      // Create pre-order record
      const preOrderData = {
        email: auth.currentUser.email || "no-email@example.com",
        phone: data.recipientPhone || "",
        network: data.recipientNetwork,
        bundle: `${data.recipientNetwork} ${bundle.dataAmount}`,
        amount: Number(bundle.price),
        status: "pending",
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        customerName:
          profile?.fullName || auth.currentUser.displayName || "Royal Customer",
        ...(data.fcUserId ? { fcUserId: data.fcUserId } : {}),
        ...(data.fcUsername ? { fcUsername: data.fcUsername } : {}),
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

      console.log("PreOrder Data:", preOrderData);
      await setDoc(preOrderRef, preOrderData);
      setOrderId(preOrderId);

      // If buyer is via an agent store, create agent_orders entry
      if (agentContext) {
        const agentOrderData = {
          id: preOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name:
              profile?.fullName ||
              auth.currentUser.displayName ||
              "Royal Customer",
            email: auth.currentUser.email || "no-email@example.com",
            phone: data.recipientPhone || "",
            network: data.recipientNetwork,
          },
          wholesale_price: wsPrice,
          agent_price: agPrice,
          profit: calculatedProfit,
          status: "pending",
          created_at: serverTimestamp(),
        };
        console.log("AgentOrder Data:", agentOrderData);
        await setDoc(doc(db, "agent_orders", preOrderId), agentOrderData);
      }

      // 1. Initiate Payment with Paystack Pop
      const isGame =
        data.recipientNetwork === "FC Mobile Points" ||
        data.recipientNetwork === "FC Mobile Silver" ||
        data.recipientNetwork === "FC Mobile" ||
        data.recipientNetwork === "PUBG Mobile" ||
        data.recipientNetwork === "PUBG Mobile UC";

      const isFC =
        data.recipientNetwork === "FC Mobile Points" ||
        data.recipientNetwork === "FC Mobile Silver" ||
        data.recipientNetwork === "FC Mobile";

      const isAgentBuyingFromOwnStore =
        agentContext && auth.currentUser?.uid === agentContext.id;
      const isAgentBuyingOnHomePage = !agentContext && isAgentUser;
      const paystackFee =
        isAgentBuyingFromOwnStore || isAgentBuyingOnHomePage ? 1.0 : 0.0;
      const hiddenGameCharge = isFC ? 0.0 : (isGame ? 1.0 : 0.0);
      
      const amountStr = String(bundle.dataAmount || bundle.name || "");
      const gbMatch = amountStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
      const gbValue = gbMatch ? parseFloat(gbMatch[1]) : 0;
      
      const isTelecelHiddenChargeMain = 
        !agentContext && 
        bundle.network === "Telecel" &&
        ((gbValue >= 1 && gbValue <= 5) || (gbValue >= 10 && gbValue <= 100));
        
      const isTelecelHiddenChargeAgent = 
        !!agentContext && 
        bundle.network === "Telecel" &&
        (gbValue >= 1 && gbValue <= 5);

      const hiddenTelecelCharge = (isTelecelHiddenChargeMain || isTelecelHiddenChargeAgent) ? 1.0 : 0.0;

      const finalAmountToCharge = Number(bundle.price) + paystackFee + hiddenGameCharge + hiddenTelecelCharge;

      const mod = await import("@paystack/inline-js");
      let PaystackCtor: any = mod.default || mod;
      if (typeof PaystackCtor !== "function" && PaystackCtor.default) {
        PaystackCtor = PaystackCtor.default;
      }

      const paystack = new PaystackCtor();

      const customFields = isGame
        ? [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: preOrderId,
            },
            {
              display_name: "User ID",
              variable_name: "fc_user_id",
              value: data.fcUserId,
            },
            {
              display_name: "Username",
              variable_name: "fc_username",
              value: data.fcUsername,
            },
            {
              display_name: "Network",
              variable_name: "network",
              value: data.recipientNetwork,
            },
          ]
        : [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: preOrderId,
            },
            {
              display_name: "Recipient Phone",
              variable_name: "phone",
              value: data.recipientPhone,
            },
            {
              display_name: "Network",
              variable_name: "network",
              value: data.recipientNetwork,
            },
          ];

      paystack.newTransaction({
        key: publicKey,
        email: auth.currentUser.email || "no-email@example.com",
        amount: Math.round(finalAmountToCharge * 100),
        currency: "GHS",
        metadata: {
          originalAmount: bundle.price,
          custom_fields: customFields,
        },
        onSuccess: async (response: any) => {
          if (bundle.network === "PC Games") {
            setOrderStatus("processing");
            setIsSubmitting(false);
          } else {
            // Immediately close the checkout form (redirect back to home layout)
            onClose();
            setIsSubmitting(false);
          }

          // Silently trigger background payment verification if completed
          try {
            fetch("/api/verifyPayment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference: response.reference,
                metadata: {
                  internalOrderId: preOrderId,
                  phone: data.recipientPhone || "",
                  fcUserId: data.fcUserId || "",
                  fcUsername: data.fcUsername || "",
                  network: data.recipientNetwork,
                  bundle: `${data.recipientNetwork} ${bundle.dataAmount}`,
                  originalAmount: bundle.price,
                },
              }),
            }).catch((err) => console.error("Background verify error:", err));
          } catch (err) {
            console.error("Payment verify trigger error:", err);
          }
        },
        onCancel: () => {
          // Immediately close on cancel as well. No popups or toasts.
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
        ) : orderStatus === "success" && bundle.network === "PC Games" ? (
          <div className="py-16 sm:py-24 text-center space-y-6 sm:space-y-8 px-6 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/20 shadow-2xl">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white uppercase">
                Payment Successful! 👑
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto text-sm leading-relaxed lowercase italic opacity-80">
                Your game is ready. Redirecting you to the download page...
              </p>
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
                      GHS {Number(bundle.price).toFixed(2)}
                    </p>
                  </div>
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
