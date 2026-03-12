export type UserRole = 0 | 1 | 2 | 3 | 'admin' | 'client' | 'reception' | 'barber';

export interface AppUser {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  branch?: string;
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
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'En Local';
  paid: boolean;
  paymentIntentId?: string | null;
  paymentMethod?: 'Cash' | 'Card' | null;
  paidAt?: any;
  createdAt: any;
}
