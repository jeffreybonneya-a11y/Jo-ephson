import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bundle, Network, UserProfile } from "@/src/types";
import { auth, db } from "@/src/lib/firebase";
import { getApiUrl } from "@/src/lib/api";
import { openPaystackPopup } from "@/src/lib/paystack";
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
  Copy,
  Check,
  ArrowLeft,
  PhoneCall,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const MOMO_NUMBER = "0535884851";

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

  // MoMo & Payment Method Selection Step States
  const [checkoutStep, setCheckoutStep] = useState<
    "form" | "select_method" | "momo_pay" | "momo_sent"
  >("form");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paystack'>('paystack');
  const [savedFormData, setSavedFormData] = useState<z.infer<
    typeof formSchema
  > | null>(null);
  const [momoRefCode, setMomoRefCode] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dynamic Hidden Charges / Gateway Fees settings from Firestore
  const [chargeSettings, setChargeSettings] = useState<{
    agentStoreCharge: number;
    retailMTNCharge: number;
    retailTelecelCharge: number;
    retailAirtelTigoCharge: number;
    retailGameCharge: number;
    wholesaleMTNCharge: number;
    wholesaleTelecelCharge: number;
    wholesaleAirtelTigoCharge: number;
    wholesaleGameCharge: number;
  }>({
    agentStoreCharge: 0,
    retailMTNCharge: 0,
    retailTelecelCharge: 0,
    retailAirtelTigoCharge: 0,
    retailGameCharge: 0,
    wholesaleMTNCharge: 0,
    wholesaleTelecelCharge: 0,
    wholesaleAirtelTigoCharge: 0,
    wholesaleGameCharge: 0,
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "hidden_charges"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChargeSettings({
          agentStoreCharge: typeof data.agentStoreCharge === "number" ? data.agentStoreCharge : 0,

          retailMTNCharge: typeof data.retailMTNCharge === "number" ? data.retailMTNCharge : (typeof data.mtnCharge === "number" ? data.mtnCharge : (typeof data.mainStoreMTNCharge === "number" ? data.mainStoreMTNCharge : 0)),
          retailTelecelCharge: typeof data.retailTelecelCharge === "number" ? data.retailTelecelCharge : (typeof data.telecelCharge === "number" ? data.telecelCharge : (typeof data.mainStoreTelecelCharge === "number" ? data.mainStoreTelecelCharge : 0)),
          retailAirtelTigoCharge: typeof data.retailAirtelTigoCharge === "number" ? data.retailAirtelTigoCharge : (typeof data.airteltigoCharge === "number" ? data.airteltigoCharge : 0),
          retailGameCharge: typeof data.retailGameCharge === "number" ? data.retailGameCharge : (typeof data.gameCharge === "number" ? data.gameCharge : (typeof data.mainStoreGameCharge === "number" ? data.mainStoreGameCharge : 0)),

          wholesaleMTNCharge: typeof data.wholesaleMTNCharge === "number" ? data.wholesaleMTNCharge : 0,
          wholesaleTelecelCharge: typeof data.wholesaleTelecelCharge === "number" ? data.wholesaleTelecelCharge : 0,
          wholesaleAirtelTigoCharge: typeof data.wholesaleAirtelTigoCharge === "number" ? data.wholesaleAirtelTigoCharge : 0,
          wholesaleGameCharge: typeof data.wholesaleGameCharge === "number" ? data.wholesaleGameCharge : 0,
        });
      }
    });
    return () => unsub();
  }, []);

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

  // Context check: Wholesale vs Retail
  const isAgentStorePurchase = !!agentContext;
  const isWholesaleContext = isAgentStorePurchase || isAgentBuyingFromOwnStore || isAgentBuyingOnHomePage || isAgentUser;

  const isMTN = bundle?.network === "MTN" || watchNetwork === "MTN";
  const isTelecel = bundle?.network === "Telecel" || watchNetwork === "Telecel";
  const isAirtelTigo =
    bundle?.network === "AirtelTigo" ||
    (bundle?.network as string) === "AT" ||
    watchNetwork === "AirtelTigo";

  let networkHiddenCharge = 0;

  if (isWholesaleContext) {
    // Check if bundle has a specific wholesaleHiddenFee override
    if (bundle?.wholesaleHiddenFee !== undefined && bundle?.wholesaleHiddenFee !== null && !isNaN(Number(bundle.wholesaleHiddenFee))) {
      networkHiddenCharge = Number(bundle.wholesaleHiddenFee);
    } else {
      if (isMTN) networkHiddenCharge = Number(chargeSettings.wholesaleMTNCharge) || 0;
      else if (isTelecel) networkHiddenCharge = Number(chargeSettings.wholesaleTelecelCharge) || 0;
      else if (isAirtelTigo) networkHiddenCharge = Number(chargeSettings.wholesaleAirtelTigoCharge) || 0;
      else if (isGame) networkHiddenCharge = Number(chargeSettings.wholesaleGameCharge) || 0;
    }
  } else {
    // Retail (non-agent main store) context
    if (bundle?.retailHiddenFee !== undefined && bundle?.retailHiddenFee !== null && !isNaN(Number(bundle.retailHiddenFee))) {
      networkHiddenCharge = Number(bundle.retailHiddenFee);
    } else {
      if (isMTN) networkHiddenCharge = Number(chargeSettings.retailMTNCharge) || 0;
      else if (isTelecel) networkHiddenCharge = Number(chargeSettings.retailTelecelCharge) || 0;
      else if (isAirtelTigo) networkHiddenCharge = Number(chargeSettings.retailAirtelTigoCharge) || 0;
      else if (isGame) networkHiddenCharge = Number(chargeSettings.retailGameCharge) || 0;
    }
  }

  const agentStoreFee = isAgentStorePurchase
    ? (Number(chargeSettings.agentStoreCharge) || 0.0)
    : 0.0;

  const totalHiddenCharges = networkHiddenCharge + agentStoreFee;

  // Paystack and UI final amount
  const finalAmountToCharge = Number(bundle?.price || 0) + totalHiddenCharges;

  useEffect(() => {
    if (finalAmountToCharge < 10 && selectedPaymentMethod === "korapay") {
      setSelectedPaymentMethod("paystack");
    }
  }, [finalAmountToCharge, selectedPaymentMethod]);

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
    if (bundle?.network === "PC Games" && auth.currentUser && !auth.currentUser.isAnonymous && !isSubmitting) {
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

  const ensureUser = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      return auth.currentUser;
    }
    return null;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!bundle) return;
    const activeUser = await ensureUser();
    if (!activeUser) {
      toast.error("Please log in before you can purchase any service! 👑", {
        description: "You must be signed in with your Google account to order.",
      });
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      return;
    }
    setSavedFormData(data);
    if (selectedPaymentMethod === "paystack") {
      processPaystackPayment(data);
    } else if (selectedPaymentMethod === "korapay") {
      processKorapayPayment(data);
    } else {
      processMoMoDirectPayment(data);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard! 📋`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const processMoMoDirectPayment = async (data: z.infer<typeof formSchema>) => {
    if (!bundle) return;
    setIsSubmitting(true);

    try {
      const activeUser = await ensureUser();
      if (!activeUser) {
        toast.error("Please log in before you can purchase any service! 👑", {
          description: "You must be signed in with your Google account to order.",
        });
        window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
        setIsSubmitting(false);
        return;
      }
      const currentUid = activeUser.uid;
      const currentEmail = (profile?.email && profile.email.includes("@"))
        ? profile.email
        : (activeUser.email || (data.recipientPhone ? `${data.recipientPhone.replace(/\s+/g, '')}@customer.kingjdeals.com` : "customer@kingjdeals.com"));
      const currentName = profile?.fullName || activeUser.displayName || (data.recipientPhone ? `Customer (${data.recipientPhone})` : "Royal Customer");

      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      // Determine reference code based on service category / network
      const cat = (bundle.category || bundle.network || "").trim().toLowerCase();
      const net = (bundle.network || "").trim().toLowerCase();
      const name = (bundle.name || "").trim().toLowerCase();

      let generatedRef = "";

      if (
        net === "pc games" || cat === "pc games" || cat === "fc 26" ||
        net.includes("pc game") || cat.includes("pc game") || name.includes("pc game")
      ) {
        generatedRef = "PC GAMES";
      } else if (
        net === "premium apps" || cat === "premium apps" ||
        net.includes("premium app") || cat.includes("premium app") || name.includes("premium app")
      ) {
        generatedRef = "PREMIUM APPS";
      } else if (
        net === "game coins" || cat === "game coins" ||
        net.includes("game coin") || cat.includes("game coin") || name.includes("game coin") ||
        net.includes("fc mobile") || cat.includes("fc mobile") ||
        net.includes("pubg") || cat.includes("pubg")
      ) {
        generatedRef = "GAME COINS";
      } else {
        // Use recipient phone number as the payment transfer reference code for data bundles, result checkers, etc.
        generatedRef = data.recipientPhone ? data.recipientPhone.trim() : (profile?.phoneNumber || "0535884851");
      }

      setMomoRefCode(generatedRef);

      const wsPrice = Number(bundle.wholesalePrice || bundle.price);
      const agPrice = Number(bundle.price);
      const calculatedProfit = agPrice - wsPrice;

      const momoOrderData = {
        email: currentEmail,
        phone: data.recipientPhone || "",
        network: data.recipientNetwork,
        bundle: bundle.network === "PC Games" ? bundle.name : `${data.recipientNetwork} ${bundle.dataAmount}`,
        amount: finalAmountToCharge,
        status: "pending_verification",
        paymentStatus: "pending_verification",
        paymentMethod: "momo_direct",
        createdAt: serverTimestamp(),
        userId: currentUid,
        customerName: currentName,
        reference: generatedRef,
        momoRefCode: generatedRef,
        momoNumber: MOMO_NUMBER,
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
          : (profile?.isAgent && (profile.uid || activeUser?.uid) ? {
              agentId: profile.uid || activeUser?.uid,
              agent_id: profile.uid || activeUser?.uid,
              agentName: profile.fullName || profile.username || "Agent",
              agent_name: profile.fullName || profile.username || "Agent",
              wholesalePrice: wsPrice,
              wholesale_price: wsPrice,
              agentPrice: agPrice,
              agent_price: agPrice,
              profit: calculatedProfit,
              agent_profit: calculatedProfit,
              profitAwarded: false,
              profit_credited: false,
            } : {})),
      };

      await setDoc(doc(db, "orders", finalOrderId), momoOrderData);

      if (agentContext) {
        const agentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: currentName,
            email: currentEmail,
            phone: data.recipientPhone || "",
            network: data.recipientNetwork,
          },
          wholesale_price: wsPrice,
          agent_price: agPrice,
          profit: calculatedProfit,
          status: "pending_verification",
          created_at: serverTimestamp(),
          paymentReference: generatedRef,
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), agentOrderData);
      }

      setIsSubmitting(false);
      setCheckoutStep("momo_pay");
    } catch (err: any) {
      console.error("MoMo Payment Error:", err);
      toast.error("Could not generate MoMo transfer details. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processPaystackPayment = async (data: z.infer<typeof formSchema>) => {
    if (!bundle) return;
    setIsSubmitting(true);

    try {
      const activeUser = await ensureUser();
      if (!activeUser) {
        toast.error("Please log in before you can purchase any service! 👑", {
          description: "You must be signed in with your Google account to order.",
        });
        window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
        setIsSubmitting(false);
        return;
      }
      const currentUid = activeUser.uid;
      const currentEmail = (profile?.email && profile.email.includes("@"))
        ? profile.email
        : (activeUser.email || (data.recipientPhone ? `${data.recipientPhone.replace(/\s+/g, '')}@customer.kingjdeals.com` : "customer@kingjdeals.com"));
      const currentName = profile?.fullName || activeUser.displayName || (data.recipientPhone ? `Customer (${data.recipientPhone})` : "Royal Customer");

      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      const wsPrice = Number(bundle.wholesalePrice || bundle.price);
      const agPrice = Number(bundle.price);
      const calculatedProfit = agPrice - wsPrice;

      const initialOrderData = {
        email: currentEmail,
        phone: data.recipientPhone || "",
        network: data.recipientNetwork,
        bundle: bundle.network === "PC Games" ? bundle.name : `${data.recipientNetwork} ${bundle.dataAmount}`,
        amount: Number(bundle.price),
        status: "pending",
        createdAt: serverTimestamp(),
        userId: currentUid,
        customerName: currentName,
        reference: finalOrderId,
        paymentStatus: "pending",
        paymentMethod: "paystack",
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
          : (profile?.isAgent && (profile.uid || currentUid) ? {
              agentId: profile.uid || currentUid,
              agent_id: profile.uid || currentUid,
              agentName: profile.fullName || profile.username || "Agent",
              agent_name: profile.fullName || profile.username || "Agent",
              wholesalePrice: wsPrice,
              wholesale_price: wsPrice,
              agentPrice: agPrice,
              agent_price: agPrice,
              profit: calculatedProfit,
              agent_profit: calculatedProfit,
              profitAwarded: false,
              profit_credited: false,
            } : {})),
      };

      await setDoc(doc(db, "orders", finalOrderId), initialOrderData);

      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: currentName,
            email: currentEmail,
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

      const paystackEmail = currentEmail;

      let publicKey = "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
      try {
        const pkRes = await fetch(getApiUrl("/api/paystack-public-key"));
        if (pkRes.ok) {
          const pkData = await pkRes.json();
          if (pkData.publicKey) {
            publicKey = pkData.publicKey;
          }
        }
      } catch (pkErr) {
        console.warn("Could not retrieve Paystack public key dynamically:", pkErr);
      }

      try {
        toast.info("Launching secure checkout... 👑");
        const redirectTarget = (typeof window !== 'undefined' && window.location.origin)
          ? window.location.origin
          : 'https://kingjdeals.onrender.com';

        await openPaystackPopup({
          key: publicKey,
          email: paystackEmail,
          amount: Math.round(finalAmountToCharge * 100),
          currency: "GHS",
          ref: finalOrderId,
          onSuccess: (ref) => {
            toast.success("Payment completed successfully! Verifying... 👑");
            window.location.href = redirectTarget + "/?reference=" + ref + "&method=paystack";
          },
          onClose: () => {
            toast.warning("Payment window closed.");
            setIsSubmitting(false);
          }
        });
      } catch (popError) {
        console.warn("Paystack Inline popup failed or blocked. Falling back to secure redirect mode:", popError);
        const redirectTarget = (typeof window !== 'undefined' && window.location.origin)
          ? window.location.origin
          : 'https://kingjdeals.onrender.com';
        
        const initResponse = await fetch(getApiUrl("/api/paystack-initialize"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: paystackEmail,
            amount: Math.round(finalAmountToCharge * 100),
            reference: finalOrderId,
            callback_url: redirectTarget + "/?reference=" + finalOrderId + "&method=paystack",
            currency: "GHS",
          }),
        });

        if (!initResponse.ok) {
          throw new Error("Failed to initialize payment gateway on server");
        }

        const initData = await initResponse.json();
        if (initData.success && initData.authorization_url) {
          toast.success("Redirecting to secure payment page... 👑");
          if (window.self !== window.top) {
            try {
              window.top.location.href = initData.authorization_url;
            } catch (redirectError) {
              console.warn("Top-level redirection blocked. Falling back to iframe navigation:", redirectError);
              window.location.href = initData.authorization_url;
            }
          } else {
            window.location.href = initData.authorization_url;
          }
        } else {
          throw new Error(initData.error || "Failed to retrieve redirection URL");
        }
      }
    } catch (err: any) {
      console.error("Checkout Error:", err);
      toast.error("Failed to start checkout. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processKorapayPayment = async (data: z.infer<typeof formSchema>) => {
    if (!bundle) return;
    setIsSubmitting(true);

    try {
      const activeUser = await ensureUser();
      if (!activeUser) {
        toast.error("Please log in before you can purchase any service! 👑", {
          description: "You must be signed in with your Google account to order.",
        });
        window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
        setIsSubmitting(false);
        return;
      }
      const currentUid = activeUser.uid;
      const currentEmail = (profile?.email && profile.email.includes("@"))
        ? profile.email
        : (activeUser.email || (data.recipientPhone ? `${data.recipientPhone.replace(/\s+/g, '')}@customer.kingjdeals.com` : "customer@kingjdeals.com"));
      const currentName = profile?.fullName || activeUser.displayName || (data.recipientPhone ? `Customer (${data.recipientPhone})` : "Royal Customer");

      const finalOrderId = doc(collection(db, "orders")).id;
      setOrderId(finalOrderId);

      const wsPrice = Number(bundle.wholesalePrice || bundle.price);
      const agPrice = Number(bundle.price);
      const calculatedProfit = agPrice - wsPrice;

      const productDetails = bundle.network === "PC Games" ? bundle.name : `${data.recipientNetwork} ${bundle.dataAmount}`;

      const initialOrderData = {
        email: currentEmail,
        phone: data.recipientPhone || "",
        network: data.recipientNetwork,
        bundle: productDetails,
        amount: Number(bundle.price),
        status: "pending",
        createdAt: serverTimestamp(),
        userId: currentUid,
        customerName: currentName,
        reference: finalOrderId,
        paymentStatus: "pending",
        paymentMethod: "Korapay",
        payment_provider: "korapay",
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
          : (profile?.isAgent && (profile.uid || currentUid) ? {
              agentId: profile.uid || currentUid,
              agent_id: profile.uid || currentUid,
              agentName: profile.fullName || profile.username || "Agent",
              agent_name: profile.fullName || profile.username || "Agent",
              wholesalePrice: wsPrice,
              wholesale_price: wsPrice,
              agentPrice: agPrice,
              agent_price: agPrice,
              profit: calculatedProfit,
              agent_profit: calculatedProfit,
              profitAwarded: false,
              profit_credited: false,
            } : {})),
      };

      await setDoc(doc(db, "orders", finalOrderId), initialOrderData);

      if (agentContext) {
        const initialAgentOrderData = {
          id: finalOrderId,
          agent_id: agentContext.id,
          customer_details: {
            name: currentName,
            email: currentEmail,
            phone: data.recipientPhone || "",
            network: data.recipientNetwork,
          },
          wholesale_price: wsPrice,
          agent_price: agPrice,
          profit: calculatedProfit,
          status: "pending",
          created_at: serverTimestamp(),
          paymentReference: finalOrderId,
          paymentMethod: "Korapay",
          payment_provider: "korapay",
        };
        await setDoc(doc(db, "agent_orders", finalOrderId), initialAgentOrderData);
      }

      const customerEmail = currentEmail;
      const customerName = currentName;

      const redirectTarget = (typeof window !== 'undefined' && window.location.origin)
        ? window.location.origin
        : 'https://kingjdeals.onrender.com';

      toast.info("Connecting to Korapay Checkout... 💳");

      const response = await fetch(getApiUrl("/api/korapay-initialize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: finalOrderId,
          amount: finalAmountToCharge,
          currency: "GHS",
          customerName,
          customerEmail,
          narration: productDetails,
          redirect_url: `${redirectTarget}/?reference=${finalOrderId}&method=korapay`,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.message || "Failed to initialize Korapay payment session");
      }

      const checkoutUrl = resData.checkout_url || resData.hosted_url || resData.checkout_link;
      if (checkoutUrl) {
        toast.success("Redirecting to Korapay payment... 👑");
        if (window.self !== window.top) {
          try {
            window.top.location.href = checkoutUrl;
          } catch (redirectError) {
            window.location.href = checkoutUrl;
          }
        } else {
          window.location.href = checkoutUrl;
        }
      } else {
        throw new Error(resData.error || "Failed to retrieve checkout URL from Korapay");
      }
    } catch (err: any) {
      console.error("Korapay Checkout Error:", err);
      toast.error(err.message || "Could not initialize Korapay payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleProceedPayment = async () => {
    if (!savedFormData) return;
    const activeUser = await ensureUser();
    if (!activeUser) {
      toast.error("Please log in before you can purchase any service! 👑");
      window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'));
      return;
    }
    processPaystackPayment(savedFormData);
  };

  const handleSentPayment = async () => {
    if (!orderId) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        momoSentClicked: true,
        userConfirmedAt: serverTimestamp(),
      });
      toast.success("Order logged and awaiting verification. 👑");
      setCheckoutStep("momo_sent");
    } catch (e) {
      console.error("Error confirming payment:", e);
      setCheckoutStep("momo_sent");
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
        ) : checkoutStep === "select_method" ? (
          <div className="p-4 sm:p-10 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCheckoutStep("form")}
                className="h-8 px-2 font-black text-xs text-slate-500 hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> BACK
              </Button>
            </div>

            <DialogHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-md mb-2">
                <Wallet className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                CHOOSE PAYMENT METHOD 👑
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                Select your preferred way to complete this order
              </DialogDescription>
            </DialogHeader>

            <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Bundle Summary
                </p>
                <p className="font-black text-foreground text-sm sm:text-base">
                  {bundle.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total
                </p>
                <p className="text-lg sm:text-xl font-black text-primary font-mono">
                  GHS {finalAmountToCharge.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option: Paystack Gateway (Main) */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 relative border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-md ring-2 ring-amber-500/30`}
              >
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 border-amber-500 bg-amber-500 text-slate-950`}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span className="font-black text-sm text-foreground uppercase">
                        Paystack Gateway
                      </span>
                    </div>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      MAIN PAYMENT ⚡
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Pay instantly with Debit/Credit Card, Bank Account, or Mobile Money via Paystack checkout window.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleProceedPayment}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-black gap-2 rounded-2xl shadow-xl bg-primary text-secondary hover:shadow-2xl transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>PREPARING...</span>
                </div>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  PROCEED TO PAYMENT 👑
                </>
              )}
            </Button>
          </div>
        ) : checkoutStep === "momo_pay" ? (
          <div className="p-4 sm:p-8 space-y-5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCheckoutStep("select_method")}
                className="h-8 px-2 font-black text-xs text-slate-500 hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> BACK
              </Button>
            </div>

            <DialogHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-amber-400/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-md mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                PAY DIRECTLY WITH MOMO 📱
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                Transfer exact amount to the MoMo number below with reference code
              </DialogDescription>
            </DialogHeader>

            {/* Total Amount, MoMo Number, Reference Code with Copy buttons */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl">
              {/* 1. Order Total */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Order Total
                  </p>
                  <p className="text-lg sm:text-xl font-black text-primary font-mono">
                    GH₵ {finalAmountToCharge.toFixed(2)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(finalAmountToCharge.toFixed(2), "Amount")}
                  className="h-9 px-3 gap-1.5 font-bold text-xs rounded-lg border-2"
                >
                  {copiedField === "Amount" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>

              {/* 2. MoMo Number */}
              <div className="flex items-center justify-between p-4 bg-yellow-400/20 dark:bg-yellow-500/20 rounded-2xl border-2 border-yellow-500 dark:border-yellow-400 shadow-md ring-2 ring-yellow-400/30">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black uppercase bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                      MTN MoMo Number 📲
                    </span>
                    <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 animate-pulse">
                      (Send Payment Here)
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-yellow-300 font-mono tracking-wider">
                    {MOMO_NUMBER}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCopy(MOMO_NUMBER, "MoMo Number")}
                  className="h-10 px-4 gap-1.5 font-black text-xs rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 border-2 border-yellow-500 shadow-sm"
                >
                  {copiedField === "MoMo Number" ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Number
                    </>
                  )}
                </Button>
              </div>

              {/* 3. Generated Reference Code */}
              <div className="flex items-center justify-between p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl border-2 border-amber-500/30">
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Your Transfer Reference
                  </p>
                  <p className="text-base sm:text-xl font-black text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                    {momoRefCode}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCopy(momoRefCode, "Reference Code")}
                  className="h-9 px-3 gap-1.5 font-bold text-xs rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600"
                >
                  {copiedField === "Reference Code" ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Dial Button */}
            <a
              href="tel:*170%23"
              target="_self"
              rel="noopener noreferrer"
              onClick={handleSentPayment}
              className="w-full h-12 sm:h-14 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm sm:text-base border-2 border-amber-500 uppercase tracking-wider"
            >
              <PhoneCall className="w-5 h-5" /> DIAL *170#
            </a>

            {/* Instructions Text */}
            <div className="bg-slate-100 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Step-by-step Instructions:
              </p>
              <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-semibold list-none pl-1">
                <li>1. Select Transfer Money → MTN User.</li>
                <li>2. Paste/enter the number above (<span className="font-mono font-bold">{MOMO_NUMBER}</span>).</li>
                <li>3. Enter GH₵{finalAmountToCharge.toFixed(2)}.</li>
                <li>4. Enter the reference above (copy it exactly: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{momoRefCode}</span>) as your transfer reference.</li>
                <li>5. Confirm with your PIN.</li>
              </ol>
            </div>
          </div>
        ) : checkoutStep === "momo_sent" ? (
          <div className="text-center bg-white dark:bg-slate-950 h-full flex flex-col items-center justify-center p-6 sm:p-10 animate-in fade-in zoom-in duration-500 space-y-6">
            <div className="w-20 h-20 bg-amber-500 text-white rounded-3xl flex items-center justify-center shadow-2xl rotate-6 animate-bounce">
              <Crown className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                ORDER AWAITING VERIFICATION 👑
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                Thank you! Your payment for reference <span className="font-mono font-black text-amber-600 dark:text-amber-400 uppercase">{momoRefCode}</span> has been logged and marked for verification.
              </p>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-100 dark:border-slate-800 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase font-black">Reference</span>
                <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{momoRefCode}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 uppercase font-black">Total Amount</span>
                <span className="font-black text-primary text-sm">GH₵ {finalAmountToCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase font-black">Status</span>
                <span className="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded uppercase text-[10px]">Awaiting Verification</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
              Our admin team will cross-check your reference against our MoMo records and deliver your data bundle shortly.
            </p>

            <div className="w-full flex flex-col gap-3 pt-2">
              <Button
                variant="default"
                className="w-full h-12 text-sm font-black rounded-xl bg-slate-900 dark:bg-primary text-white dark:text-secondary shadow-lg hover:bg-black"
                onClick={onClose}
              >
                CLOSE WINDOW 👑
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-xs font-black rounded-xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all gap-2"
                onClick={() => handleWhatsApp("kingj")}
              >
                <MessageSquare className="w-4 h-4" /> CONTACT ADMIN ON WHATSAPP
              </Button>
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

            {(!auth.currentUser || auth.currentUser.isAnonymous) && (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-bold text-center sm:text-left">
                  <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Login Required: Please sign in with Google before placing your order.</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('OPEN_AUTH_MODAL'))}
                  className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase shadow-md cursor-pointer shrink-0"
                >
                  Sign In with Google 👑
                </Button>
              </div>
            )}

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
                    <span>Base Package Price</span>
                    <span className="font-mono">GHS {Number(bundle.price).toFixed(2)}</span>
                  </div>

                  {agentStoreFee > 0 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>Agent Store Fee</span>
                      <span className="font-mono">+ GHS {agentStoreFee.toFixed(2)}</span>
                    </div>
                  )}

                  {networkHiddenCharge > 0 && (
                    <div className="flex justify-between items-center text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>{isMTN ? "MTN Network Charges" : isTelecel ? "Telecel Network Charges" : isAirtelTigo ? "AirtelTigo Charges" : isGame ? "Game Processing Fee" : "Service Charge"}</span>
                      <span className="font-mono">+ GHS {networkHiddenCharge.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center font-black text-sm text-foreground dark:text-white">
                    <span>Total Amount to Pay</span>
                    <span className="text-primary font-black text-base sm:text-lg font-mono">
                      GHS {finalAmountToCharge.toFixed(2)}
                    </span>
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

                {/* Payment Method Selector (Fixed to Paystack) */}
                <div className="space-y-2 pt-2">
                  <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                    Payment Method
                  </Label>
                  <div
                    className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-1.5 border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-sm ring-1 ring-amber-500`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CreditCard className={`w-3.5 h-3.5 shrink-0 text-amber-500`} />
                      <div className="min-w-0">
                        <p className="font-black text-[11px] text-foreground truncate uppercase">Paystack</p>
                        <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold truncate">Card / MoMo</p>
                      </div>
                    </div>
                    <span className="bg-amber-400 text-slate-950 text-[7px] font-black px-1 py-0.5 rounded shrink-0 uppercase tracking-wider">
                      MAIN ⚡
                    </span>
                  </div>
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
