export type Network = 'MTN' | 'Telecel' | 'AirtelTigo';

export interface Bundle {
  id: string;
  name: string;
  dataAmount: string;
  price: number;
  network: Network;
  active: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  recipientPhone: string;
  recipientNetwork: Network;
  bundleId: string;
  bundleName: string;
  amountSent: number;
  referenceCode: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'deleted';
  userEmail?: string;
  createdAt: any; // Firestore Timestamp
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
}
