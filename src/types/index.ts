export type UserRole = 0 | 1 | 2 | 3 | 'admin' | 'client' | 'reception' | 'barber';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  branch?: string;
  status?: 'active' | 'suspended' | 'deleted';
  statusMessage?: string;
  stripeCustomerId?: string;
  rating?: number;
  bio?: string;
}

export interface Service {
  id: string | number;
  name: string;
  price: number;
  duration: number;
  description?: string;
  assignedTo?: string;
  branch?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  branch: string;
  barberId: string | number;
  barberName: string;
  date: string;
  time: string;
  serviceId: string | number;
  serviceName: string;
  price: number;
  duration: number;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'En Local' | 'in_progress' | 'no_show';
  paid: boolean;
  paymentIntentId?: string | null;
  paymentMethod?: 'Cash' | 'Card' | null;
  paidAt?: any;
  createdAt: any;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  image?: string;
}
export interface ActivityLog {
  id: string;
  adminId?: string; // UID del responsable (Admin o Cliente)
  adminEmail?: string;
  adminRole?: 'admin' | 'reception' | 'client' | 'barber' | 'system';
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details: string;
  timestamp: any;
}
