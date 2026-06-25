import React, { useState, useEffect } from "react";
import { db } from "@/src/lib/firebase";
import { seedFC } from "@/src/lib/seed";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  increment,
  getDocs,
  where,
} from "firebase/firestore";
import {
  Bundle,
  Order,
  Network,
  UserProfile,
  Message,
  StreamAccess,
  Complaint,
} from "@/src/types";
import { getProductImage } from "@/src/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Check,
  RefreshCw,
  ShoppingBag,
  MessageSquare,
  Mail as MailIcon,
  Trophy,
  Zap,
  Users,
  Star,
  CheckCircle,
  XCircle,
  Wallet,
  Crown,
  Box,
  AlertTriangle,
  Copy,
  Lock,
  LockOpen,
} from "lucide-react";
import { toast } from "sonner";

const parseDataAmountToMB = (amountStr: string): number => {
  if (!amountStr) return 0;
  const norm = amountStr.trim().toLowerCase();
  const numMatch = norm.match(/^([\d.,]+)/);
  if (!numMatch) return 0;
  const val = parseFloat(numMatch[1].replace(/,/g, ""));
  if (norm.includes("m")) {
    return val;
  }
  if (norm.includes("t")) {
    return val * 1024 * 1024;
  }
  // Default to GB
  return val * 1024;
};

export default function AdminDashboard() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [ghBalance, setGhBalance] = useState<number | null>(null);

  // Agents Hub
  const [agents, setAgents] = useState<any[]>([]);
  const [profitRequests, setProfitRequests] = useState<any[]>([]);

  const [announcement, setAnnouncement] = useState({
    id: "discount-bar",
    text: "",
    active: false,
    type: "discount" as "discount" | "info" | "alert",
  });

  const [bundleForm, setBundleForm] = useState({
    name: "",
    dataAmount: "",
    price: "",
    network: "MTN" as Network,
    active: true,
    offerSlug: "",
    volume: "",
    category: "MTN",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    seedFC();
    // 1. Fetch Announcement
    const unsubAnnouncement = onSnapshot(
      doc(db, "settings", "announcement"),
      (snapshot) => {
        if (snapshot.exists()) setAnnouncement(snapshot.data() as any);
      },
    );

    // 2. Listen for Bundles
    const unsubBundles = onSnapshot(collection(db, "bundles"), (snapshot) => {
      const fetched = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Bundle,
      );
      fetched.sort((a, b) => {
        const networkOrder = { MTN: 1, Telecel: 2, AirtelTigo: 3 };
        const orderA = networkOrder[a.network] || 99;
        const orderB = networkOrder[b.network] || 99;
        if (orderA !== orderB) return orderA - orderB;

        const mbA = parseDataAmountToMB(a.dataAmount);
        const mbB = parseDataAmountToMB(b.dataAmount);
        if (mbA !== mbB) return mbA - mbB;
        return Number(a.price) - Number(b.price);
      });
      setBundles(fetched);
      setLoading(false);
    });

    // 3. Listen for Orders
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
    );
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Listen for Messages
    const unsubMessages = onSnapshot(
      query(collection(db, "messages"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setMessages(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Message,
          ),
        );
      },
    );

    // 5. Fetch Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as any as UserProfile,
        ),
      );
    });

    // 6. Listen for Complaints
    const unsubComplaints = onSnapshot(
      query(collection(db, "complaints"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setComplaints(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Complaint,
          ),
        );
      },
    );

    // 7. Listen for Agents
    const unsubAgents = onSnapshot(collection(db, "agents"), (snapshot) => {
      setAgents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // 8. Listen for Profit Requests
    const unsubProfitRequests = onSnapshot(
      collection(db, "profit_requests"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProfitRequests(list);
      },
    );

    return () => {
      unsubAnnouncement();
      unsubBundles();
      unsubOrders();
      unsubMessages();
      unsubUsers();
      unsubComplaints();
      unsubAgents();
      unsubProfitRequests();
    };
  }, []);

  useEffect(() => {
    const seed = async () => {
      // MTN
      const q = query(collection(db, "bundles"), where("network", "==", "MTN"));
      const snaps = await getDocs(q);
      const existing = snaps.docs.map((d) =>
        String(d.data().dataAmount).toLowerCase().replace(/\s/g, ""),
      );

      const newBundles = [
        {
          name: "MTN 15GB",
          dataAmount: "15GB",
          price: 70,
          network: "MTN",
          active: true,
        },
        {
          name: "MTN 20GB",
          dataAmount: "20GB",
          price: 100,
          network: "MTN",
          active: true,
        },
        {
          name: "MTN 25GB",
          dataAmount: "25GB",
          price: 110,
          network: "MTN",
          active: true,
        },
        {
          name: "MTN 30GB",
          dataAmount: "30GB",
          price: 130,
          network: "MTN",
          active: true,
        },
        {
          name: "MTN 40GB",
          dataAmount: "40GB",
          price: 165,
          network: "MTN",
          active: true,
        },
        {
          name: "MTN 50GB",
          dataAmount: "50GB",
          price: 250,
          network: "MTN",
          active: true,
        },
        {
          name: "MTN 100GB",
          dataAmount: "100GB",
          price: 500,
          network: "MTN",
          active: true,
        },
      ];
      for (const b of newBundles) {
        if (!existing.includes(b.dataAmount.toLowerCase().replace(/\s/g, ""))) {
          await addDoc(collection(db, "bundles"), {
            ...b,
            createdAt: serverTimestamp(),
          });
        }
      }

      // AirtelTigo
      const qAirtel = query(
        collection(db, "bundles"),
        where("network", "==", "AirtelTigo"),
      );
      const snapsAirtel = await getDocs(qAirtel);
      const existingAirtel = snapsAirtel.docs.map((d) =>
        String(d.data().dataAmount).toLowerCase().replace(/\s/g, ""),
      );

      const newAirtelBundles = [
        {
          name: "AirtelTigo 1GB",
          dataAmount: "1GB",
          price: 5,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 2GB",
          dataAmount: "2GB",
          price: 10,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 3GB",
          dataAmount: "3GB",
          price: 15,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 4GB",
          dataAmount: "4GB",
          price: 20,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 5GB",
          dataAmount: "5GB",
          price: 25,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 6GB",
          dataAmount: "6GB",
          price: 30,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 7GB",
          dataAmount: "7GB",
          price: 35,
          network: "AirtelTigo",
          active: true,
        },
        {
          name: "AirtelTigo 8GB",
          dataAmount: "8GB",
          price: 40,
          network: "AirtelTigo",
          active: true,
        },
      ];
      for (const b of newAirtelBundles) {
        if (
          !existingAirtel.includes(
            b.dataAmount.toLowerCase().replace(/\s/g, ""),
          )
        ) {
          await addDoc(collection(db, "bundles"), {
            ...b,
            createdAt: serverTimestamp(),
          });
        }
      }

      // Purge any FC Mobile / Game Coins bundles from Firestore
      const snapsAll = await getDocs(collection(db, "bundles"));
      for (const d of snapsAll.docs) {
        const bd = d.data();
        if (
          bd.network === "FCMobile" ||
          bd.category === "Game Coins" ||
          String(bd.name).toLowerCase().includes("fc points") ||
          String(bd.name).toLowerCase().includes("fc silver")
        ) {
          await deleteDoc(d.ref);
        }
      }
    };
    seed().catch(console.error);
  }, []);

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: bundleForm.name,
        dataAmount: bundleForm.dataAmount,
        price: Number(bundleForm.price),
        category: bundleForm.category,
        description: bundleForm.description,
        active: bundleForm.active,
        updatedAt: serverTimestamp(),
      };

      if (["MTN", "Telecel", "AirtelTigo"].includes(data.category)) {
        data.network = data.category;
      } else {
        data.network = data.category;
      }

      if (editingBundle) {
        await updateDoc(doc(db, "bundles", editingBundle.id), data);
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, "bundles"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success("Product created successfully!");
      }
      setEditingBundle(null);
      setBundleForm({
        name: "",
        dataAmount: "",
        price: "",
        network: "MTN" as Network,
        active: true,
        offerSlug: "",
        volume: "",
        category: "MTN",
        description: "",
        imageUrl: "",
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEditBundle = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setBundleForm({
      name: bundle.name,
      dataAmount: bundle.dataAmount || "",
      price: String(bundle.price),
      network: bundle.network,
      active: bundle.active ?? true,
      offerSlug: bundle.offerSlug || "",
      volume: bundle.volume || "",
      category: bundle.category || bundle.network,
      description: bundle.description || "",
      imageUrl: bundle.imageUrl || "",
    });
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: string,
    orderData?: any,
  ) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });

      // If admin delivers an agent unlock order, automatically mark user as regular agent
      if (
        status === "delivered" &&
        orderData?.bundle === "AGENT ACCESS UNLOCK" &&
        orderData.userId
      ) {
        await updateDoc(doc(db, "users", orderData.userId), { isAgent: true });
        toast.success(`Agent access granted to ${orderData.email}! 👑`);
      }

      // If status is 'delivered' and it is an agent order, increase agent's profit balance
      const agentIdVal = orderData?.agent_id || orderData?.agentId;
      const agentProfitVal = Number(
        orderData?.agent_profit || orderData?.profit || 0,
      );
      const isProfitCredited =
        orderData?.profit_credited === true ||
        orderData?.profitAwarded === true;

      if (
        status === "delivered" &&
        agentIdVal &&
        agentProfitVal > 0 &&
        !isProfitCredited
      ) {
        await updateDoc(doc(db, "agents", agentIdVal), {
          profit_balance: increment(agentProfitVal),
        });
        await updateDoc(doc(db, "orders", orderId), {
          profit_credited: true,
          profitAwarded: true,
        });
        toast.success(
          `Agent profit GHS ${agentProfitVal.toFixed(2)} credited to agent store! 👑`,
        );
      }

      toast.success(`Order marked as ${status}!`);
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    }
  };

  const handleRelockStore = async (userId: string, orderId?: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { isAgent: false });
      if (orderId) {
        await updateDoc(doc(db, "orders", orderId), { status: "declined" });
      }
      toast.success("Agent store relocked successfully! 👑");
    } catch (e: any) {
      toast.error(`Update failed: ${e.message}`);
    }
  };

  const handleUnlockStore = async (userId: string, orderId?: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { isAgent: true });
      if (orderId) {
        await updateDoc(doc(db, "orders", orderId), { status: "delivered" });
      }
      toast.success("Agent store reopened successfully! 👑");
    } catch (e: any) {
      toast.error(`Update failed: ${e.message}`);
    }
  };

  const handleApproveStream = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        streamStatus: "approved",
        status: "approved",
      });
      toast.success("Royal System: Stream Approved! 👑");
    } catch (e) {
      toast.error("Failed to approve stream");
    }
  };

  const handleRejectStream = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        streamStatus: "rejected",
        status: "failed",
      });
      toast.error("Royal System: Stream Rejected.");
    } catch (e) {
      toast.error("Failed to reject stream");
    }
  };

  const handleRelockStream = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        streamStatus: "pending",
        status: "pending",
      });
      toast.info("Royal System: Stream Re-locked. 👑");
    } catch (e) {
      toast.error("Failed to lock stream");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unpaid":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 font-bold dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
          >
            UNPAID
          </Badge>
        );
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 font-bold dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
          >
            PAID
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50"
          >
            PENDING
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 font-black dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
          >
            APPROVED
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 font-black animate-pulse dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
          >
            PROCESSING
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
          >
            DELIVERED
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 font-bold dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
          >
            FAILED
          </Badge>
        );
      case "declined":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 font-bold dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
          >
            DECLINED
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="dark:border-slate-800 dark:text-slate-400"
          >
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  const handleMarkSeenProfitRequest = async (requestId: string) => {
    try {
      const requestDoc = profitRequests.find((r) => r.id === requestId);
      if (!requestDoc) return;

      const agentRef = doc(db, "agents", requestDoc.agent_id);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const currentProfit = agentDoc.data().profit_balance || 0;
        await updateDoc(agentRef, {
          profit_balance: currentProfit - Number(requestDoc.withdrawal_amount),
        });
      }

      await updateDoc(doc(db, "profit_requests", requestId), {
        status: "seen",
      });
      toast.success(
        "Withdrawal request marked as SEEN and balance updated! 👑",
      );
    } catch (err: any) {
      toast.error(`Operation failed: ${err.message}`);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: "resolved",
      });
      toast.success("Complaint resolved! 👑");
    } catch (error: any) {
      toast.error(`Resolution failed: ${error.message}`);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    try {
      await deleteDoc(doc(db, "complaints", complaintId));
      toast.success("Message cleared! 👑");
    } catch (error: any) {
      toast.error(`Clear failed: ${error.message}`);
    }
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "settings", "announcement"), announcement);
      toast.success("Announcement updated! 👑");
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            ROYAL COMMAND CENTER 👑
          </h1>
          <p className="text-slate-500 font-medium italic">
            Order Fulfillment Dashboard
          </p>
        </div>
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <TabsList className="inline-flex h-auto gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-w-max">
            <TabsTrigger
              value="tracking"
              className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all focus-visible:ring-0 relative"
            >
              TRACKING 👑
              {orders.filter(
                (o) => o.status === "pending" && !o.agent_id && !o.agentId,
              ).length > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-red-600 text-white text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-black shadow-lg">
                  {
                    orders.filter(
                      (o) =>
                        o.status === "pending" && !o.agent_id && !o.agentId,
                    ).length
                  }
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="bundles"
              className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all focus-visible:ring-0"
            >
              BUNDLES
            </TabsTrigger>
            <TabsTrigger
              value="announcement"
              className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all focus-visible:ring-0"
            >
              NOTIFY
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all focus-visible:ring-0"
            >
              CUSTOMERS
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all focus-visible:ring-0 relative"
            >
              AGENTS HUB 👑
              {profitRequests.filter((r) => r.status === "pending").length +
                orders.filter(
                  (o) => o.status === "pending" && (o.agent_id || o.agentId),
                ).length >
                0 && (
                <span className="absolute -top-1.5 -right-1 bg-primary text-secondary text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-black shadow-lg">
                  {profitRequests.filter((r) => r.status === "pending").length +
                    orders.filter(
                      (o) =>
                        o.status === "pending" && (o.agent_id || o.agentId),
                    ).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="complaints"
              className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md relative transition-all focus-visible:ring-0"
            >
              ISSUES
              {complaints.filter((c) => c.status === "open").length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black border border-red-600">
                  {complaints.filter((c) => c.status === "open").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tracking" className="mt-0 outline-none">
          <Card className="rounded-3xl border-2 overflow-hidden bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <Trophy className="w-5 h-5 text-primary" />
                  Orders Activity👑
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="border-b dark:border-slate-800">
                    <TableHead className="font-black text-[10px] uppercase tracking-wider p-4 text-slate-600 dark:text-slate-200">
                      Customer Info
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Service Details
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Royal Price
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Current Status
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Control Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.filter((o) => !o.agent_id && !o.agentId).length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-slate-400 font-bold dark:bg-slate-950"
                      >
                        No orders yet. They show up here immediately on "BUY
                        NOW" 👑
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders
                      .filter((o) => !o.agent_id && !o.agentId)
                      .map((order) => (
                        <TableRow
                          key={order.id}
                          className="hover:bg-primary/5 transition-colors group dark:border-slate-800"
                        >
                          <TableCell className="p-4">
                            <div className="flex flex-col min-w-[150px]">
                              <span className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                {order.customerName || order.email}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight">
                                {order.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {order.type === "stream" ? (
                                <>
                                  <Badge
                                    className={`w-fit mb-1 ${order.streamType === "live" ? "bg-purple-500" : "bg-pink-500"} text-white font-black text-[10px] px-2`}
                                  >
                                    STREAM:{" "}
                                    {order.streamType === "live"
                                      ? "LIVE ACCESS"
                                      : "ONE-TIME"}
                                  </Badge>
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    Status:{" "}
                                    <span className="uppercase text-primary">
                                      {order.streamStatus || "unknown"}
                                    </span>
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Badge className="w-fit mb-1 bg-secondary text-white font-black text-[10px] px-2">
                                    {order.network}
                                  </Badge>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit dark:bg-primary/20">
                                        {order.phone || "NO PHONE"}
                                      </span>
                                      {order.phone && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-16 p-0 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 rounded-md border dark:border-slate-800 text-center shadow-sm hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              order.phone,
                                            );
                                            toast.success(
                                              `Copied: ${order.phone} 👑`,
                                            );
                                          }}
                                        >
                                          Copy
                                        </Button>
                                      )}
                                    </div>
                                    {order.fcUserId && order.fcUsername && (
                                      <div className="bg-[#00FF87]/10 p-2 rounded-md border border-[#00FF87]/20 flex flex-col gap-0.5 mt-1">
                                        <span className="text-[10px] font-black text-[#00FF87] uppercase tracking-tighter">
                                          FC Details:
                                        </span>
                                        <div className="flex gap-2 items-center">
                                          <span className="text-[10px] font-bold text-white">
                                            ID: {order.fcUserId}
                                          </span>
                                          <span className="text-[10px] font-bold text-white">
                                            User: {order.fcUsername}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">
                                    {order.bundle}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-black text-secondary">
                              <Wallet className="w-4 h-4 text-primary" />
                              <span className="dark:text-slate-300">
                                GHS {(order.amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(order.status)}
                              {order.createdAt && (
                                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                                  {new Date(
                                    order.createdAt?.seconds * 1000,
                                  ).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {order.type === "stream" ? (
                                order.streamStatus === "pending_approval" ||
                                order.streamStatus === "pending" ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px]"
                                      onClick={() =>
                                        handleApproveStream(order.id)
                                      }
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-9 px-4 rounded-xl font-black uppercase text-[10px]"
                                      onClick={() =>
                                        handleRejectStream(order.id)
                                      }
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : order.streamStatus === "approved" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 rounded-xl border-slate-300 text-slate-600 font-black uppercase text-[10px] hover:bg-slate-100"
                                    onClick={() => handleRelockStream(order.id)}
                                  >
                                    Re-lock Access
                                  </Button>
                                ) : null
                              ) : (
                                <>
                                  {order.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            order.id,
                                            "processing",
                                            order,
                                          )
                                        }
                                      >
                                        <Check className="w-3 h-3" />
                                        Accept 👑
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-9 px-4 rounded-xl font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            order.id,
                                            "declined",
                                            order,
                                          )
                                        }
                                      >
                                        <XCircle className="w-3 h-3" />
                                        Decline
                                      </Button>
                                    </>
                                  )}
                                  {order.status === "processing" && (
                                    <Button
                                      size="sm"
                                      className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                                      onClick={() =>
                                        handleUpdateOrderStatus(
                                          order.id,
                                          "delivered",
                                          order,
                                        )
                                      }
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Deliver 👑
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 w-9 p-0 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-sm"
                                    title="Delete Order"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Royal Decree: Delete this order permanently? 👑",
                                        )
                                      ) {
                                        deleteDoc(doc(db, "orders", order.id));
                                        toast.success(
                                          "Order removed from the collection! 👑",
                                        );
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  {order.status === "delivered" &&
                                    order.bundle === "AGENT ACCESS UNLOCK" &&
                                    order.userId && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-9 px-4 rounded-xl font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                                        onClick={() =>
                                          handleRelockStore(
                                            order.userId || "",
                                            order.id,
                                          )
                                        }
                                      >
                                        <Lock className="w-3 h-3" />
                                        Relock Store
                                      </Button>
                                    )}
                                  {order.status === "declined" &&
                                    order.bundle === "AGENT ACCESS UNLOCK" &&
                                    order.userId && (
                                      <Button
                                        size="sm"
                                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] shadow-sm flex items-center gap-2"
                                        onClick={() =>
                                          handleUnlockStore(
                                            order.userId || "",
                                            order.id,
                                          )
                                        }
                                      >
                                        <LockOpen className="w-3 h-3" />
                                        Reopen Store
                                      </Button>
                                    )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 h-fit">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
                  {editingBundle ? "EDIT DATA BUNDLE" : "ADD NEW DATA BUNDLE"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleSaveBundle} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                      Bundle Name
                    </Label>
                    <Input
                      value={bundleForm.name}
                      onChange={(e) =>
                        setBundleForm({ ...bundleForm, name: e.target.value })
                      }
                      placeholder="e.g. MTN Royal 10GB"
                      required
                      className="rounded-xl border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                      Network
                    </Label>
                    <Select
                      value={bundleForm.category}
                      onValueChange={(v: any) =>
                        setBundleForm({ ...bundleForm, category: v })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        <SelectItem value="MTN">MTN Data</SelectItem>
                        <SelectItem value="Telecel">Telecel Data</SelectItem>
                        <SelectItem value="AirtelTigo">
                          AirtelTigo Data
                        </SelectItem>
                        <SelectItem value="FC Mobile Points">
                          FC Mobile Points
                        </SelectItem>
                        <SelectItem value="FC Mobile Silver">
                          FC Mobile Silver
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                        Amount / Vol
                      </Label>
                      <Input
                        value={bundleForm.dataAmount}
                        onChange={(e) =>
                          setBundleForm({
                            ...bundleForm,
                            dataAmount: e.target.value,
                          })
                        }
                        placeholder="e.g. 10GB"
                        className="rounded-xl border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                        Price (GHS)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={bundleForm.price}
                        onChange={(e) =>
                          setBundleForm({
                            ...bundleForm,
                            price: e.target.value,
                          })
                        }
                        placeholder="20"
                        required
                        className="rounded-xl border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                      Validity Description
                    </Label>
                    <Input
                      value={bundleForm.description}
                      onChange={(e) =>
                        setBundleForm({
                          ...bundleForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="e.g. Valid for 30 days"
                      className="rounded-xl border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-black bg-secondary text-white hover:bg-primary uppercase shadow-lg cursor-pointer"
                  >
                    {editingBundle ? "Save Changes" : "Create Data Bundle"}
                  </Button>
                  {editingBundle && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingBundle(null);
                        setBundleForm({
                          name: "",
                          dataAmount: "",
                          price: "",
                          network: "MTN" as Network,
                          active: true,
                          offerSlug: "",
                          volume: "",
                          category: "MTN",
                          description: "",
                          imageUrl: "",
                        });
                      }}
                      className="w-full dark:text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 overflow-hidden shadow-sm">
              <CardHeader className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <Box className="w-5 h-5 text-primary" />
                  ACTIVE PRODUCTS & BUNDLES
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow className="border-b dark:border-slate-800">
                      <TableHead className="font-black text-[10px] uppercase tracking-wider p-6 text-slate-600 dark:text-slate-200">
                        Info
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-wider text-center text-slate-600 dark:text-slate-200">
                        Category
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-wider text-right text-slate-600 dark:text-slate-200">
                        Price
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-wider text-right p-6 text-slate-600 dark:text-slate-200">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles
                      .filter((b) =>
                        [
                          "MTN",
                          "Telecel",
                          "AirtelTigo",
                          "FC Mobile Points",
                          "FC Mobile Silver",
                        ].includes(b.category || b.network || ""),
                      )
                      .map((b) => (
                        <TableRow key={b.id} className="dark:border-slate-800">
                          <TableCell className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col min-w-[120px]">
                                <span className="font-black text-slate-900 dark:text-slate-100">
                                  {b.name}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">
                                  {b.dataAmount || "No specific amount"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="border-2 font-black uppercase dark:border-slate-800 dark:text-slate-300"
                            >
                              {b.category || b.network}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-black text-secondary font-mono">
                            GHS {b.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right p-6">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 rounded-xl font-bold uppercase text-[10px] dark:border-slate-800 dark:text-slate-400 cursor-pointer flex items-center gap-1.5"
                                onClick={() => startEditBundle(b)}
                              >
                                <RefreshCw className="w-3 h-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 rounded-xl font-bold uppercase text-[10px] border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30 cursor-pointer flex items-center gap-1.5"
                                onClick={() =>
                                  deleteDoc(doc(db, "bundles", b.id))
                                }
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcement" className="mt-0 outline-none">
          <Card className="rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 overflow-hidden shadow-sm">
            <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
                Discount Settings 👑
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <form
                onSubmit={handleUpdateAnnouncement}
                className="space-y-6 max-w-2xl"
              >
                <div className="space-y-2">
                  <Label className="font-bold underline underline-offset-4 text-slate-700 dark:text-slate-300">
                    Top Bar Text
                  </Label>
                  <Input
                    value={announcement.text}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, text: e.target.value })
                    }
                    placeholder="e.g. 👑 MASSIVE DISCOUNT: Get 10GB for only GHS 10 today!"
                    className="rounded-xl h-12 border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 dark:border-slate-800">
                  <div className="flex-1">
                    <h4 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100">
                      Active Status
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      When active, the top bar appears and dynamic pricing is
                      applied.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAnnouncement({
                        ...announcement,
                        active: !announcement.active,
                      })
                    }
                    className={`w-16 h-8 rounded-full transition-all relative ${announcement.active ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"}`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all transform ${announcement.active ? "left-9" : "left-1"}`}
                    />
                  </button>
                </div>

                <Button
                  type="submit"
                  className="h-14 px-10 rounded-2xl font-black text-lg bg-secondary text-white shadow-lg hover:bg-primary transition-all"
                >
                  SAVE ROYAL STATUS 👑
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-0 outline-none">
          <Card className="rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
              <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-primary" />
                Customer Base
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="border-b dark:border-slate-800">
                    <TableHead className="p-6 font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Royal Customer
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Email Address
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-right p-6 text-slate-600 dark:text-slate-200">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-colors dark:border-slate-800"
                    >
                      <TableCell className="p-6 min-w-[150px]">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {u.fullName}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 min-w-[200px]">
                        {u.email}
                      </TableCell>
                      <TableCell className="text-right p-6 font-black text-primary">
                        GHS {u.walletBalance?.toFixed(2) || "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="mt-0 outline-none">
          <Card className="rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
              <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Crown className="w-5 h-5 text-primary" />
                AGENTS COMMAND CENTER 👑
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="requests" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex w-full max-w-lg h-auto mb-6">
                  <TabsTrigger
                    value="requests"
                    className="flex-1 rounded-lg py-2 font-black text-[10px] uppercase relative flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Profit Requests</span>
                    {profitRequests.filter((r) => r.status === "pending")
                      .length > 0 && (
                      <span className="bg-primary text-secondary text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                        {
                          profitRequests.filter((r) => r.status === "pending")
                            .length
                        }
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="flex-1 rounded-lg py-2 font-black text-[10px] uppercase"
                  >
                    List of Agents
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    className="flex-1 rounded-lg py-2 font-black text-[10px] uppercase relative flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Agent Orders</span>
                    {orders.filter(
                      (o) =>
                        o.status === "pending" && (o.agent_id || o.agentId),
                    ).length > 0 && (
                      <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                        {
                          orders.filter(
                            (o) =>
                              o.status === "pending" &&
                              (o.agent_id || o.agentId),
                          ).length
                        }
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* 1. Profit Requests Tab Content */}
                <TabsContent value="requests" className="outline-none">
                  <div className="overflow-x-auto border rounded-2xl">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900">
                        <TableRow className="border-b">
                          <TableHead className="p-4 font-bold text-[10px] uppercase">
                            Agent Details
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            MoMo Channel
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Request Amount
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Submitted Date
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-right p-4">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profitRequests.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="h-32 text-center text-slate-400 font-bold"
                            >
                              No withdrawal requests found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          [...profitRequests]
                            .sort((a, b) => {
                              if (
                                a.status === "pending" &&
                                b.status !== "pending"
                              )
                                return -1;
                              if (
                                a.status !== "pending" &&
                                b.status === "pending"
                              )
                                return 1;
                              return 0;
                            })
                            .map((req) => (
                              <TableRow
                                key={req.id}
                                className="hover:bg-slate-50/50 dark:border-slate-800"
                              >
                                <TableCell className="p-4">
                                  <span className="font-extrabold text-foreground">
                                    {req.agent_name}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs">
                                    <p className="font-bold">{req.momo_name}</p>
                                    <div className="flex items-center space-x-2">
                                      <p className="font-mono text-slate-500">
                                        {req.momo_number}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Copy Number"
                                        className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            req.momo_number || "",
                                          );
                                          toast.success("Momo number copied!");
                                        }}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-black text-primary">
                                  GHS {Number(req.withdrawal_amount).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-xs text-slate-500 font-medium">
                                  {req.created_at
                                    ? new Date(
                                        req.created_at.seconds * 1000,
                                      ).toLocaleString()
                                    : "Just now"}
                                </TableCell>
                                <TableCell className="text-right p-4">
                                  {req.status === "pending" ? (
                                    <Button
                                      size="sm"
                                      className="h-8 bg-green-600 hover:bg-green-700 font-black text-[9px] uppercase rounded-lg shadow-sm"
                                      onClick={() =>
                                        handleMarkSeenProfitRequest(req.id)
                                      }
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      SEEN & DISBURSE
                                    </Button>
                                  ) : (
                                    <Badge className="bg-slate-100 text-slate-500 uppercase text-[8px] font-black tracking-wider py-1">
                                      DISBURSED
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* 2. List of Agents Tab Content */}
                <TabsContent value="list" className="outline-none">
                  <div className="overflow-x-auto border rounded-2xl">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900">
                        <TableRow className="border-b">
                          <TableHead className="p-4 font-bold text-[10px] uppercase">
                            Agent / Slug
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            MoMo Withdrawal Link
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-right p-4">
                            Available Profit Balance
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-right p-4">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agents.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="h-32 text-center text-slate-400 font-bold"
                            >
                              No registered partners found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          agents.map((ag) => (
                            <TableRow
                              key={ag.id}
                              className="hover:bg-slate-50/50 dark:border-slate-800"
                            >
                              <TableCell className="p-4">
                                <div className="flex flex-col">
                                  <span className="font-black text-foreground">
                                    {ag.agent_name}
                                  </span>
                                  <span className="text-[10px] text-primary font-bold lowercase">
                                    /store/{ag.agent_slug}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  <p className="font-semibold">
                                    {ag.momo_name}
                                  </p>
                                  <p className="font-mono text-slate-500">
                                    {ag.momo_number}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right p-4 font-black text-green-600">
                                GHS {Number(ag.profit_balance || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right p-4">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 px-3 rounded-lg font-black uppercase text-[9px] shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                                  onClick={() => handleRelockStore(ag.id)}
                                >
                                  <Lock className="w-3 h-3" />
                                  Relock Store
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* 3. Agent Orders Tab Content */}
                <TabsContent value="orders" className="outline-none">
                  <div className="overflow-x-auto border rounded-2xl">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900">
                        <TableRow className="border-b">
                          <TableHead className="p-4 font-bold text-[10px] uppercase">
                            Order ID / Date
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Package & Number
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Agent Origin
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Wholesale Price
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Agent Price
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">
                            Agent Profit
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-right p-4">
                            Status
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-right p-4">
                            Control Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.filter((o) => o.agent_id || o.agentId)
                          .length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="h-32 text-center text-slate-400 font-bold"
                            >
                              No agent sales generated yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          orders
                            .filter((o) => o.agent_id || o.agentId)
                            .map((o) => (
                              <TableRow
                                key={o.id}
                                className="hover:bg-slate-50/50 dark:border-slate-800"
                              >
                                <TableCell className="p-4">
                                  <span className="font-mono text-xs font-bold uppercase">
                                    {o.id.slice(-8)}
                                  </span>
                                  <p className="text-[9px] text-slate-400 font-medium">
                                    {o.createdAt
                                      ? new Date(
                                          o.createdAt.seconds * 1000,
                                        ).toLocaleString()
                                      : "Just now"}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-extrabold">
                                        {o.bundle}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Copy Package"
                                        className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            o.bundle || "",
                                          );
                                          toast.success("Package name copied!");
                                        }}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className="flex flex-col gap-1">
                                        <p className="font-mono text-primary font-black bg-primary/10 px-2 py-0.5 rounded-md w-fit m-0">
                                          {o.phone || "NO PHONE"}
                                        </p>
                                      </div>
                                      {o.phone && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          title="Copy Number"
                                          className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              o.phone || "",
                                            );
                                            toast.success(
                                              "Phone number copied!",
                                            );
                                          }}
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                    {o.fcUserId && o.fcUsername && (
                                      <div className="bg-[#00FF87]/10 p-2 rounded-md border border-[#00FF87]/20 flex flex-col gap-0.5 mt-2 max-w-xs">
                                        <span className="text-[10px] font-black text-[#00FF87] uppercase tracking-tighter">
                                          FC Details:
                                        </span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[10px] font-bold text-white">
                                            ID: {o.fcUserId}
                                          </span>
                                          <span className="text-[10px] font-bold text-white">
                                            User: {o.fcUsername}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-extrabold text-foreground">
                                    {o.agent_name || o.agentName || "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  GHS{" "}
                                  {Number(
                                    o.wholesale_price || o.wholesalePrice || 0,
                                  ).toFixed(2)}
                                </TableCell>
                                <TableCell className="font-mono text-xs font-bold">
                                  GHS{" "}
                                  {Number(
                                    o.agent_price || o.agentPrice || 0,
                                  ).toFixed(2)}
                                </TableCell>
                                <TableCell className="font-mono text-xs font-black text-green-600">
                                  GHS{" "}
                                  {Number(
                                    o.agent_profit || o.profit || 0,
                                  ).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right p-4">
                                  {getStatusBadge(o.status)}
                                </TableCell>
                                <TableCell className="text-right p-4">
                                  <div className="flex justify-end gap-2">
                                    {o.status === "pending" && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[9px] shadow-sm flex items-center gap-1 cursor-pointer"
                                          onClick={() =>
                                            handleUpdateOrderStatus(
                                              o.id,
                                              "processing",
                                              o,
                                            )
                                          }
                                        >
                                          <Check className="w-3 h-3" />
                                          Accept 👑
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-8 px-3 rounded-lg font-black uppercase text-[9px] shadow-sm flex items-center gap-1 cursor-pointer"
                                          onClick={() =>
                                            handleUpdateOrderStatus(
                                              o.id,
                                              "declined",
                                              o,
                                            )
                                          }
                                        >
                                          <XCircle className="w-3 h-3" />
                                          Decline
                                        </Button>
                                      </>
                                    )}
                                    {o.status === "processing" && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="h-8 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[9px] shadow-sm flex items-center gap-1 cursor-pointer"
                                          onClick={() =>
                                            handleUpdateOrderStatus(
                                              o.id,
                                              "delivered",
                                              o,
                                            )
                                          }
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                          Deliver 👑
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-8 px-3 rounded-lg font-black uppercase text-[9px] shadow-sm flex items-center gap-1 cursor-pointer"
                                          onClick={() =>
                                            handleUpdateOrderStatus(
                                              o.id,
                                              "declined",
                                              o,
                                            )
                                          }
                                        >
                                          <XCircle className="w-3 h-3" />
                                          Decline
                                        </Button>
                                      </>
                                    )}
                                    {o.status === "delivered" && (
                                      <Badge className="bg-slate-100 text-slate-500 uppercase text-[8px] font-black tracking-wider py-1">
                                        Delivered
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="mt-0 outline-none">
          <Card className="rounded-3xl border-2 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
              <CardTitle className="text-xl font-black text-red-600 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-600" />
                Royal Complaints 👑
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow className="border-b dark:border-slate-800">
                    <TableHead className="p-6 font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Customer Info
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Issue Description
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      Status
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-right p-6 text-slate-600 dark:text-slate-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-48 text-center text-slate-400 font-bold dark:bg-slate-950"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
                          No complaints. The system is flawless! 👑
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((c) => (
                      <TableRow
                        key={c.id}
                        className="hover:bg-red-50/10 transition-colors dark:border-slate-800"
                      >
                        <TableCell className="p-6 min-w-[150px]">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {c.userEmail}
                            </span>
                            {c.subject &&
                              (c.subject.includes("[Agent Report]") ||
                                c.subject.includes("--- AGENT REPORT ---")) && (
                                <Badge className="w-fit bg-red-650 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-white" />
                                  AGENT DISPUTE 👑
                                </Badge>
                              )}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tighter">
                              {c.subject
                                ? `Subject: ${c.subject}`
                                : `Order: ${c.orderId ? c.orderId.slice(-8).toUpperCase() : "N/A"}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 min-w-[200px]">
                          {c.subject &&
                          (c.subject.includes("[Agent Report]") ||
                            c.message.includes("--- AGENT REPORT ---")) ? (
                            <div className="text-[10px] max-w-md max-h-48 overflow-y-auto whitespace-pre-line bg-red-50/40 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 p-3.5 rounded-2xl font-mono leading-normal text-slate-705 dark:text-slate-350 select-all shadow-xs">
                              {c.message}
                            </div>
                          ) : (
                            <p
                              className="text-xs font-medium max-w-sm line-clamp-2 text-slate-600 dark:text-slate-400"
                              title={c.message}
                            >
                              {c.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`font-black text-[9px] uppercase px-2 py-0.5 rounded-md ${c.status === "open" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-6">
                          <div className="flex justify-end gap-2">
                            {c.status === "open" && (
                              <Button
                                size="sm"
                                className="h-8 bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] rounded-lg shadow-sm"
                                onClick={() => handleResolveComplaint(c.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 font-black uppercase text-[10px] rounded-lg shadow-sm"
                              onClick={() => handleDeleteComplaint(c.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Clear
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
