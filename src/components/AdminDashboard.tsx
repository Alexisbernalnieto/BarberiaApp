import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  useWindowDimensions, 
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '@/firebaseClient';
import { useAuth } from '@/context/AuthContext';
import { calculateMonthlyRevenue, getTodayAppointmentsStats, fetchNewUsersCount, getTopServiceMonth, getMonthlyRevenueByDay } from '@/services/metrics';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  arrayUnion, 
  writeBatch 
} from 'firebase/firestore';
import { formatFullDate } from '@/utils/formatters';

// Core Components
import MainLayout from '@/components/Navigation/MainLayout';
import AdminHeader from '@/components/Admin/AdminHeader';
import AdminMetrics from '@/components/Admin/AdminMetrics';
import AdminMetricsDashboard from '@/components/Admin/AdminMetricsDashboard';
import AdminQuickActions from '@/components/Admin/AdminQuickActions';
import AdminAgenda from '@/components/Admin/AdminAgenda';
import AdminUsers from '@/components/Admin/AdminUsers';
import AdminHistory from '@/components/Admin/AdminHistory';
import BarberManagement from '@/components/Admin/BarberManagement';
import AdminServices from '@/components/Admin/AdminServices';
import AdminFinances from '@/components/Admin/AdminFinances';
import CheckoutManager from '@/components/Admin/CheckoutManager';
import BookingWizard from '@/components/Booking/BookingWizard';
import NotificationsModal from '@/components/Admin/NotificationsModal';
import AdminCashRegister from '@/components/Admin/AdminCashRegister';
import QueueDisplay from '@/components/Admin/QueueDisplay';
import AppointmentCommandCenter from '@/components/Admin/AppointmentCommandCenter';
import RescheduleRequests from '@/components/Admin/RescheduleRequests';
import { useSidebar } from '@/context/SidebarContext';

import { Appointment, AppUser, UserRole } from '@/types';
import { getFinancialMetrics, FinancialMetrics } from '@/services/payments';

interface AdminDashboardProps {

  appointments: Appointment[];
  onLogout: () => void;
  onAddAppointment: (data: any) => Promise<void>;
  role?: UserRole;
  COLORS: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
  barbers: AppUser[];
  setBarbers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  isMobile?: boolean; // Passed by MainLayout
}

export default function AdminDashboard({ 
  appointments, 
  onLogout, 
  onAddAppointment, 
  role = 'admin', 
  COLORS, 
  toggleTheme, 
  isDarkMode, 
  barbers, 
  setBarbers,
  isMobile: isMobileProp
}: AdminDashboardProps) {
  const { width } = useWindowDimensions();
  const { currentUser } = useAuth();
  const { setIsOpen } = useSidebar();
  const isMobile = isMobileProp ?? width < 1024;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState('Todas');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Notification Logic
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (role === undefined && role === null) return;

    // Normalize role to string — notifications use string targetRoles ['admin', 'reception']
    // but user role can be numeric (0 = admin, 2 = reception)
    const roleStr = (role === 0 || role === 'admin') ? 'admin' 
                   : (role === 2 || role === 'reception') ? 'reception' 
                   : String(role);

    const q = query(
      collection(db, 'notifications'),
      where('targetRoles', 'array-contains', roleStr),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter((n: any) => {
          const isRead = n.readBy && n.readBy.includes(roleStr);
          return !isRead;
        });
      setNotifications(notifs);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });

    return () => unsubscribe();
  }, [role]);

  const handleMarkAsRead = async () => {
    if (!notifications.length) return;

    const roleStr = (role === 0 || role === 'admin') ? 'admin' 
                   : (role === 2 || role === 'reception') ? 'reception' 
                   : String(role);

    const batch = writeBatch(db);
    notifications.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { readBy: arrayUnion(roleStr) });
    });

    try {
      await batch.commit();
      setNotifications([]);
      setShowNotifications(false);
    } catch (e) {
      console.error("Error marking notifications as read:", e);
    }
  };

  // Metrics for dashboard
  const [newUsersCount, setNewUsersCount] = useState<number>(0);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | undefined>();

  useEffect(() => {
    const getNewUsers = async () => {
      const count = await fetchNewUsersCount();
      setNewUsersCount(count);
    };
    getNewUsers();
  }, []);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const fm = await getFinancialMetrics();
        setFinancialMetrics(fm);
      } catch (err) {
        console.error("Error fetching financial metrics:", err);
      }
    };
    fetchFinance();
  }, []);


  const metrics = useMemo(() => ({
    revenueMonth: calculateMonthlyRevenue(appointments),
    appointmentsToday: getTodayAppointmentsStats(appointments),
    newUsersMonth: newUsersCount,
    topServiceMonth: getTopServiceMonth(appointments),
    revenueByDay: getMonthlyRevenueByDay(appointments)
  }), [appointments, newUsersCount]);

  const selectedDateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const dayAppointments = useMemo(() => {
    return appointments.filter(app => {
      const dateMatch = app.date === selectedDateStr;
      // Filter by branch if not "Todas"
      const branchMatch = selectedBranch === 'Todas' || app.branch === selectedBranch;
      return dateMatch && branchMatch;
    });
  }, [appointments, selectedDateStr, selectedBranch]);

  const totalToday = useMemo(() => 
    dayAppointments
      .filter(app => app.status !== 'cancelled' && app.status !== 'unhandled')
      .reduce((acc, app) => acc + (app.price || 0), 0)
  , [dayAppointments]);

  const totalWalkins = useMemo(() => 
    dayAppointments.filter(app => (app as any).type === 'Walk-in').length
  , [dayAppointments]);

  const handleWalkIn = async (data: any) => {
    // BookingWizard already creates the appointment successfully.
    // We just need to close the modal.
    setActiveTab('dashboard');
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      COLORS={COLORS}
      user={currentUser}
    >
      <View style={styles.contentWrapper}>
        <ScrollView 
          style={styles.contentArea} 
          contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <AdminHeader 
            notifications={notifications}
            setShowNotifications={setShowNotifications}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onLogout={onLogout}
            COLORS={COLORS}
            viewMode={activeTab}
            setViewMode={setActiveTab}
            isMobile={isMobile}
            onMenuPress={() => setIsOpen(true)}
          />

          {activeTab === 'dashboard' && (
            <View style={styles.dashboardGrid}>
              <AdminMetrics
                totalToday={totalToday}
                totalWalkins={totalWalkins}
                dateLabel={formatFullDate(selectedDate)}
                COLORS={COLORS}
                isMobile={isMobile}
              />

              {/* Stripe Quick Balance */}
              {financialMetrics && financialMetrics.balance && (
                <View style={[styles.stripeCard, isMobile && { width: '100%' }]} data-glass="true">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.iconBox, { backgroundColor: '#635BFF' }]}>
                         <MaterialCommunityIcons name="credit-card-outline" size={24} color="#FFF" />
                      </View>
                      <View>
                        <Text style={styles.stripeTitle}>Stripe Balance</Text>
                        <Text style={styles.stripeStatus}>Conectado • En Vivo</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('finances')} style={styles.detailsBtn}>
                       <Text style={styles.detailsBtnText}>Ver Detalles</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 40 }}>
                     <View>
                        <Text style={styles.stripeLabel}>Disponible</Text>
                        <Text style={styles.stripeAmount}>${(financialMetrics.balance.available / 100).toLocaleString()} {financialMetrics.balance.currency.toUpperCase()}</Text>
                     </View>
                     <View>
                        <Text style={styles.stripeLabel}>Pendiente</Text>
                        <Text style={[styles.stripeAmount, { color: 'var(--text-secondary)' }]}>${(financialMetrics.balance.pending / 100).toLocaleString()} {financialMetrics.balance.currency.toUpperCase()}</Text>
                     </View>
                  </View>
                </View>
              )}

              <View style={[styles.mainGridRow, isMobile && { flexDirection: 'column' }]}>
                  <View style={styles.agendaSection}>
                      <AdminAgenda
                          appointments={appointments}
                          COLORS={COLORS}
                          isMobile={isMobile}
                          selectedDate={selectedDate}
                          setSelectedDate={setSelectedDate}
                          selectedBranch={selectedBranch}
                          setSelectedBranch={setSelectedBranch}
                      />
                  </View>
                  
                  <View style={styles.actionsSection}>
                      <AdminQuickActions
                          setViewMode={setActiveTab}
                          COLORS={COLORS}
                          isMobile={isMobile}
                      />
                  </View>
              </View>
            </View>
          )}

          {activeTab === 'metrics' && (
            <AdminMetricsDashboard
              metrics={metrics}
              financialMetrics={financialMetrics}
              COLORS={COLORS}
              isMobile={isMobile}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsers 
              COLORS={COLORS} 
              isMobile={isMobile} 
              onBack={() => setActiveTab('dashboard')} 
            />
          )}

          {activeTab === 'admin_users_override' && (
            <AdminUsers 
              COLORS={COLORS} 
              isMobile={isMobile} 
              onBack={() => setActiveTab('dashboard')} 
            />
          )}

          {activeTab === 'history' && (
            <AdminHistory 
                COLORS={COLORS}
                isMobile={isMobile}
                onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'services' && (
            <AdminServices 
                COLORS={COLORS}
                isMobile={isMobile}
                onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'barbers' && (
            <BarberManagement 
                appointments={appointments}
                COLORS={COLORS}
                barbers={barbers}
                setBarbers={setBarbers}
                onClose={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'finances' && (
            <AdminFinances 
                appointments={appointments}
                COLORS={COLORS}
                isMobile={isMobile}
                onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'cashregister' && (
            <AdminCashRegister 
                appointments={appointments}
                COLORS={COLORS}
                isMobile={isMobile}
                onClose={() => setActiveTab('dashboard')}
                currentUser={currentUser}
            />
          )}

          {activeTab === 'checkout' && (
            <View style={{ flex: 1 }}>
              <CheckoutManager 
                appointments={appointments} 
                onClose={() => setActiveTab('dashboard')} 
                COLORS={COLORS} 
                isMobile={isMobile}
                branch="Sucursal Matriz"
              />
            </View>
          )}

          {activeTab === 'walkin' && (
            <View style={styles.bookingContainer} data-glass="true">
                <BookingWizard 
                  user={currentUser} 
                  onConfirm={handleWalkIn} 
                  onCancel={() => setActiveTab('dashboard')}
                  COLORS={COLORS} 
                  isWalkIn
                />
            </View>
          )}

          {activeTab === 'queue' && (
            <Modal visible={true} animationType="fade" transparent={true}>
              <QueueDisplay 
                appointments={appointments}
                COLORS={COLORS}
                onClose={() => setActiveTab('dashboard')}
              />
            </Modal>
          )}

          {activeTab === 'appointments' && (
            <AppointmentCommandCenter
              appointments={appointments}
              COLORS={COLORS}
              isMobile={isMobile}
              onBack={() => setActiveTab('dashboard')}
              onOpenWalkIn={() => setActiveTab('walkin')}
            />
          )}

          {activeTab === 'reschedule_requests' && (
            <RescheduleRequests 
              appointments={appointments}
              COLORS={COLORS}
              adminId={currentUser?.uid || ''}
              onUpdate={() => setActiveTab('dashboard')}
            />
          )}

        </ScrollView>
      </View>

      <NotificationsModal 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        COLORS={COLORS}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    gap: 32,
  },
  dashboardGrid: {
    gap: 24,
  },
  stripeCard: {
    backgroundColor: 'var(--bg-card)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 91, 255, 0.2)',
    marginBottom: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripeTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  stripeStatus: {
    color: '#635BFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stripeLabel: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  stripeAmount: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  detailsBtn: {
    backgroundColor: 'rgba(99, 91, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsBtnText: {
    color: '#635BFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainGridRow: {
    flexDirection: 'row',
    gap: 32,
  },
  agendaSection: {
    flex: 2,
  },
  actionsSection: {
    flex: 1,
    gap: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  bookingContainer: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
    minHeight: 600,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  }
});
