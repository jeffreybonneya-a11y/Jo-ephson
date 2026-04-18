export type Network = 'MTN' | 'Telecel' | 'AirtelTigo';

export interface Bundle {
  id: string;
  name: string;
  dataAmount: string;
  price: number;
  network: Network;
  active: boolean;
  offerSlug?: string;
  volume?: string;
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
  orderId: string;
  userId: string;
  userEmail: string;
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
