export type Network =
  | "MTN"
  | "Telecel"
  | "AirtelTigo"
  | "FC Mobile"
  | "FC Mobile Points"
  | "FC Mobile Silver"
  | "PC Games"
  | "PUBG Mobile"
  | "PUBG Mobile UC";

export interface Bundle {
  id: string;
  name: string;
  dataAmount: string;
  price: number;
  wholesalePrice?: number | null;
  retailHiddenFee?: number | null;
  wholesaleHiddenFee?: number | null;
  network: Network;
  active: boolean;
  offerSlug?: string;
  volume?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  fastDelivery?: boolean;
  fastDeliveryType?: "customer" | "agent";
  fastDeliveryFee?: number;
  basePrice?: number;
  finalPrice?: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  recipientPhone: string;
  recipientNetwork: Network;
  bundleId: string;
  bundleName: string;
  dataAmount?: string;
  amountSent: number;
  referenceCode: string;
  status: "pending" | "processing" | "delivered" | "cancelled" | "failed";
  userEmail?: string;
  createdAt: any;
  updatedAt: any;
  paymentStatus?: string;
  paymentMethod?: string;
  volume?: string;
  offerSlug?: string;
  externalOrderId?: string;
  externalReference?: string;
  failureReason?: string;
  type?: "data" | "stream";
  streamType?: "live" | "onetime";
  streamStatus?: "pending_approval" | "approved" | "rejected";

  // FC Mobile Fields
  fcUserId?: string;
  fcUsername?: string;

  // Old/Agent Fields sometimes used
  email?: string;
  phone?: string;
  network?: string;
  bundle?: string;
  amount?: number;
  agent_id?: string;
  agentId?: string;
  agentName?: string;
  agent_name?: string;
  wholesalePrice?: number;
  agentPrice?: number;
  profit?: number;
  fastDelivery?: boolean;
  fastDeliveryType?: "customer" | "agent";
  fastDeliveryFee?: number;
  basePrice?: number;
  finalPrice?: number;
}

export interface Message {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject?: string;
  message: string;
  status: "unread" | "read";
  createdAt: any;
}

export interface StreamAccess {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "approved" | "revoked";
  referenceCode: string;
  amountPaid: number;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  gmail?: string;
  fullName: string;
  displayName?: string;
  username?: string;
  phoneNumber?: string;
  phone?: string;
  role: "admin" | "user";
  walletBalance: number;
  isAgent?: boolean;
  photoURL?: string;
  createdAt?: any;
  lastLoginAt?: any;
  lastSignInTime?: any;
  authProvider?: string;
  providerId?: string;
  topupReference?: string;
  updatedAt?: any;
}

export interface Complaint {
  id: string;
  orderId?: string;
  userId: string;
  userEmail: string;
  subject?: string;
  message: string;
  status: "open" | "resolved";
  adminReply?: string;
  createdAt: any;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "topup" | "purchase";
  status: "pending" | "success" | "failed";
  reference: string;
  description: string;
  createdAt: any;
}

export interface Agent {
  id: string; // matches userId
  agent_name: string;
  agent_slug: string;
  momo_name: string;
  momo_number: string;
  profit_balance: number;
  created_at: any;
  prices?: { [bundleId: string]: number };
}

export interface AgentOrder {
  id: string; // matches the main order ID or reference
  agent_id: string;
  customer_details: {
    name: string;
    email: string;
    phone: string;
    network: string;
  };
  wholesale_price: number;
  agent_price: number;
  profit: number;
  status: string;
  created_at: any;
}

export interface ProfitRequest {
  id: string;
  agent_id: string;
  agent_name?: string;
  momo_name?: string;
  momo_number?: string;
  withdrawal_amount: number;
  status: "pending" | "Seen";
  created_at: any;
}

export interface BrandingSettings {
  logoUrl?: string;
  brandName?: string;
  tagline?: string;
  showCrown?: boolean;
  logoShape?: "rounded" | "circle" | "square" | "original";
  logoHeight?: number;
  logoBgStyle?: "dark" | "light" | "transparent" | "glass";
  showTextInNavbar?: boolean;
  removeBlackBackground?: boolean;
  removeWhiteBackground?: boolean;
  updatedAt?: any;
}

export interface BookingCode {
  id: string;
  title: string;
  bookmaker: string; // e.g. "SportyBet", "Betway", "1xBet", "Mozzart", "22Bet", "Bet9ja", "General"
  code: string; // The secret booking code
  odds: number; // e.g. 15.5 or 45.0
  price: number; // e.g. 10.00 GHS
  expiresAt: any; // Date, timestamp, or ISO string
  description?: string;
  previewImageUrl?: string;
  sport?: string; // e.g. "Football", "Basketball", "Multi-Sport"
  category?: string; // "VIP Banker", "Mega Odds", "Weekend Special", "Daily Safe 2+", etc.
  active: boolean;
  totalPurchases?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface BookingCodePurchase {
  id: string;
  bookingCodeId: string;
  userId?: string;
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  title: string;
  bookmaker: string;
  code: string;
  odds: number;
  price: number;
  paymentMethod?: string;
  paymentReference?: string;
  status: "paid" | "completed";
  createdAt: any;
}

export interface AppDownload {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  isRegisteredUser: boolean;
  deviceType: "android" | "desktop" | "ios" | "unknown";
  platform?: string;
  userAgent?: string;
  source?: string;
  downloadUrl?: string;
  apkName?: string;
  downloadedAt: any;
}

export type EFootballPlatform = "ios" | "android" | "steam" | string;

export interface EFootballProduct {
  id: string;
  name: string; // e.g. "eFootball™ Coin 1,092"
  coinAmount: number; // e.g. 1092
  platform: "ios" | "android" | "steam" | string;
  platformLabel?: string; // "iOS", "Android", or "Steam"
  price: number; // e.g. 110 (GHS)
  currency: string; // "GHS"
  active: boolean;
  displayOrder?: number;
  description?: string;
  imageUrl?: string;
  badge?: string; // "POPULAR", "BEST VALUE", etc.
  createdAt?: any;
  updatedAt?: any;
}

export interface EFootballOrder {
  id: string;
  orderId: string; // e.g. "EF-10001"
  customerId?: string; // Firebase Auth uid
  userId?: string;
  customerName: string;
  customerEmail: string; // Authenticated Firebase email (source of truth, website Gmail)
  customerPhone?: string;
  phone?: string;
  email?: string;
  productId: string;
  productName: string;
  bundle?: string;
  bundleName?: string;
  coinAmount: number;
  platform: "ios" | "android" | "steam" | "iOS" | "Android" | "Steam" | string;
  accountIdentifier: string; // KONAMI ID or associated eFootball account email
  accountIdentifierType: "konami_id" | "email";
  konamiId: string; // Kept in sync with accountIdentifier for backwards-compatibility
  amount: number;
  currency: string; // "GHS"
  paymentStatus: "PAYMENT_PENDING" | "PAID" | "FAILED" | "UNPAID" | "SUCCESS" | "PAYMENT_INITIALIZATION_FAILED" | string;
  fulfillmentStatus: "AWAITING_FULFILLMENT" | "PROCESSING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | string;
  adminStatus?: string;
  status: "pending" | "paid" | "processing" | "delivered" | "cancelled" | "failed" | string;
  paystackReference: string;
  reference?: string;
  paymentMethod?: string;
  payment_provider?: string;
  network?: string;
  category?: string;
  serviceType?: string; // "efootball"
  createdAt: any;
  updatedAt?: any;
  paidAt?: any;
  acceptedAt?: any;
  acceptedBy?: string;
  deliveredAt?: any;
  deliveredBy?: string;
  deliveryNote?: string;
  cancellationReason?: string;
  verifiedByBackend?: boolean;
}


