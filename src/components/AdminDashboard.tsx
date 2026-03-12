import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  useWindowDimensions, 
  Animated, 
  ScrollView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../firebaseClient';
import { useAuth } from '../context/AuthContext';
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

// Core Components
import MainLayout from './Navigation/MainLayout';
import AdminHeader from './Admin/AdminHeader';
import AdminMetrics from './Admin/AdminMetrics';
import AdminQuickActions from './Admin/AdminQuickActions';
import AdminCalendar from './Admin/AdminCalendar';
import AdminNotifications from './Admin/AdminNotifications';
import AdminKiosk from './Admin/AdminKiosk';

// Modals/Features
import QueueDisplay from './Admin/QueueDisplay';
import FinancialReport from './Admin/FinancialReport';
import BarberManagement from './Admin/BarberManagement';
import ServiceManagement from './Admin/ServiceManagement';
import UserManagement from './Admin/UserManagement';
import BookingWizard from './Booking/BookingWizard';

import { Appointment, AppUser, UserRole } from '../types';

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
  setSidebarOpen?: (open: boolean) => void; // Passed by MainLayout
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
  isMobile: isMobileProp,
  setSidebarOpen
}: AdminDashboardProps) {
  const { width } = useWindowDimensions();
  const { currentUser } = useAuth();
  const isMobile = isMobileProp ?? width < 768;
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Notification Logic
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!role) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetRoles', 'array-contains', role),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter((n: any) => {
          const isRead = n.readBy && n.readBy.includes(role);
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

    const batch = writeBatch(db);
    notifications.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { readBy: arrayUnion(role) });
    });

    try {
      await batch.commit();
      setNotifications([]);
      setShowNotifications(false);
    } catch (e) {
      console.error("Error marking notifications as read:", e);
    }
  };

  // State for metrics and date and time
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const dayAppointments = useMemo(() => {
    return appointments.filter(app => app.date === selectedDateStr);
  }, [appointments, selectedDateStr]);

  const totalToday = dayAppointments.reduce((acc, app) => acc + (app.price || 0), 0);
  const totalWalkins = dayAppointments.filter(app => (app as any).type === 'Walk-in').length;

  const dateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }, [selectedDate]);

  const handleWalkIn = async (data: any) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const walkInData = {
      ...data,
      userId: data.userId || 'admin-walkin',
      status: data.date === todayStr ? 'En Local' : 'Confirmed',
      paid: true 
    };

    try {
      await onAddAppointment(walkInData);
      setActiveTab('dashboard');
    } catch (error: any) {
      console.error("Error creating walk-in:", error);
    }
  };

  if (role === 'reception' && isMobile) {
    return (
      <AdminKiosk
        notifications={notifications}
        setShowNotifications={setShowNotifications}
        showNotifications={showNotifications}
        handleMarkAsRead={handleMarkAsRead}
        onLogout={onLogout}
        appointments={appointments}
        handleWalkIn={handleWalkIn}
        COLORS={COLORS}
        viewMode={activeTab}
        setViewMode={setActiveTab}
        barbers={barbers}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      COLORS={COLORS}
      user={role}
    >
      {/* Screens/Portals will receive setSidebarOpen and isMobile via cloneElement in MainLayout */}
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
            onMenuPress={setSidebarOpen ? () => setSidebarOpen(true) : undefined} 
          />

        {activeTab === 'dashboard' && (
          <View style={styles.dashboardGrid}>
            <AdminMetrics
              totalToday={totalToday}
              totalWalkins={totalWalkins}
              dateLabel={dateLabel}
              COLORS={COLORS}
              isMobile={isMobile}
            />

            <View style={[styles.mainGridRow, isMobile && { flexDirection: 'column' }]}>
                <View style={styles.calendarSection}>
                    <AdminCalendar
                        appointments={appointments}
                        COLORS={COLORS}
                        isMobile={isMobile}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
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

        {activeTab === 'users' && (
          <View style={styles.fullPane}>
             <UserManagement COLORS={COLORS} />
          </View>
        )}

         {/* Additional Tab implementations go here */}
        </ScrollView>
      </View>

      {/* Modals & Overlays */}
      <Modal visible={activeTab === 'queue'} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay} data-modal-overlay="true">
            <QueueDisplay appointments={appointments} onClose={() => setActiveTab('dashboard')} COLORS={COLORS} />
        </View>
      </Modal>

      <Modal visible={activeTab === 'walkin'} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay} data-modal-overlay="true">
             <BookingWizard
                user={currentUser}
                existingAppointments={appointments}
                onConfirm={handleWalkIn}
                onCancel={() => setActiveTab('dashboard')}
                COLORS={COLORS}
                barbers={barbers}
            />
        </View>
      </Modal>

      <Modal visible={activeTab === 'finance'} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay} data-modal-overlay="true">
            <FinancialReport appointments={appointments} onClose={() => setActiveTab('dashboard')} COLORS={COLORS} />
        </View>
      </Modal>

      <AdminNotifications
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
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
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  dateText: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: 'var(--bg-dark)',
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardGrid: {
    gap: 32,
  },
  mainGridRow: {
    flexDirection: 'row',
    gap: 32,
  },
  calendarSection: {
    flex: 2,
  },
  actionsSection: {
    flex: 1,
  },
  fullPane: {
    flex: 1,
    minHeight: 600,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  }
});
