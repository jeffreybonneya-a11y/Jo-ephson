export type Network = 'MTN' | 'Vodafone' | 'AirtelTigo';

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
  customerPhone: string;
  customerNetwork: Network;
  bundleId: string;
  bundleName: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  createdAt: any; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}
