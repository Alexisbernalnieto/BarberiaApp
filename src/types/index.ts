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
  instagram?: string;
  tiktok?: string;
  isOnBreak?: boolean;
  schedule?: any[] | Record<string, any>;
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

// ─── Appointment Status Lifecycle ────────────────────────────────
export type AppointmentStatus =
  | 'pending_payment'  // Creada pero no pagada
  | 'confirmed'        // Pagada y confirmada
  | 'checked_in'       // Cliente llegó a la barbería
  | 'En Local'         // UI-friendly status for checked_in
  | 'in_progress'      // Corte en progreso
  | 'completed'        // Servicio terminado
  | 'no_show'          // Cliente no se presentó (10 min tolerancia)
  | 'cancelled'        // Cancelada por cliente o admin
  | 'unhandled'        // No atendida / Expirada por falta de acción
  | 'rescheduled';     // Pospuesta/Reagendada

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  branch: string;
  branchId?: string;
  barberId: string | number;
  barberName: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  serviceId: string | number;
  serviceName: string;
  price: number;
  duration: number;
  status: AppointmentStatus;
  type?: 'Online' | 'Walk-in';
  paid: boolean;
  paymentIntentId?: string | null;
  paymentMethod?: 'Cash' | 'Card' | null;
  paidAt?: any;
  createdAt: any;
  updatedAt?: any;
  // ── Lifecycle timestamps ──
  checkedInAt?: any;
  completedAt?: any;
  noShowMarkedAt?: any;
  cancelledAt?: any;
  cancelReason?: string;
  // ── Rescheduling ──
  rescheduledFrom?: string;    // ID de cita original
  rescheduledTo?: string;      // ID de nueva cita
  // ── Barber Reassignment ──
  reassignedFrom?: string;     // barberId original
  reassignedFromName?: string; // barberName original
  reassignmentReason?: string;
  // ── Internal ──
  notes?: string;              // Notas internas del admin
  // ── Refund tracking ──
  refundStatus?: 'completed' | 'failed';
  refundId?: string;
  refundedAt?: any;
  refundError?: string;
  // ── No-Show Management ──
  noShowJustification?: string;
  rescheduleRequested?: boolean;
  rescheduleAuthorized?: boolean;
  justificationReviewedAt?: any;
}

// ─── Barber Daily Work Log ───────────────────────────────────────
export interface BarberDayLog {
  id: string;
  barberId: string;
  barberName: string;
  branch: string;
  date: string;               // YYYY-MM-DD
  isAbsent?: boolean;
  absentMarkedAt?: any;
  absentMarkedBy?: string;
  clockIn?: any;               // Timestamp
  clockOut?: any;              // Timestamp
  totalMinutes?: number;
  appointmentsCompleted: number;
  walkInsCompleted: number;
  noShows: number;
  revenue: number;
}

// ─── Notification Types ──────────────────────────────────────────
export type NotificationType =
  | 'new_appointment'
  | 'appointment_cancelled'
  | 'no_show_alert'
  | 'barber_absent'
  | 'appointment_rescheduled'
  | 'barber_reassigned'
  | 'walk_in_registered'
  | 'reschedule_request'
  | 'reschedule_authorized'
  | 'check_in';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  branch?: string;
  targetRoles: string[];
  targetUserId?: string;
  clientName?: string;
  barberName?: string;
  service?: string;
  appointmentId?: string;
  readBy?: string[];
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
  adminId?: string;
  adminEmail?: string;
  adminRole?: 'admin' | 'reception' | 'client' | 'barber' | 'system';
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details: string;
  timestamp: any;
}
