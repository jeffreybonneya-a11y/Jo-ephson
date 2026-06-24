export type Network = 'MTN' | 'Telecel' | 'AirtelTigo' | 'FCMobile';

export interface Bundle {
  id: string;
  name: string;
  dataAmount: string;
  price: number;
  network: Network;
  active: boolean;
  offerSlug?: string;
  volume?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
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
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'failed';
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
  type?: 'data' | 'stream';
  streamType?: 'live' | 'onetime';
  streamStatus?: 'pending_approval' | 'approved' | 'rejected';
}

export interface Message {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: any;
}

export interface StreamAccess {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'revoked';
  referenceCode: string;
  amountPaid: number;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
  walletBalance: number;
  isAgent?: boolean;
}

export interface Complaint {
  id: string;
  orderId?: string;
  userId: string;
  userEmail: string;
  subject?: string;
  message: string;
  status: 'open' | 'resolved';
  adminReply?: string;
  createdAt: any;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'topup' | 'purchase';
  status: 'pending' | 'success' | 'failed';
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
  status: 'pending' | 'Seen';
  created_at: any;
}
