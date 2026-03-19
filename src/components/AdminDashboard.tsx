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
import AdminAgenda from './Admin/AdminAgenda';
import AdminUsers from './Admin/AdminUsers';
import AdminHistory from './Admin/AdminHistory';
import AdminBarbers from './Admin/AdminBarbers';
import AdminServices from './Admin/AdminServices';
import AdminFinances from './Admin/AdminFinances';
import CheckoutManager from './Admin/CheckoutManager';
import BookingWizard from './Booking/BookingWizard';
import NotificationsModal from './Admin/NotificationsModal';

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
  const isMobile = isMobileProp ?? width < 1024;
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

  // Metrics for dashboard
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dayAppointments = useMemo(() => {
    return appointments.filter(app => app.date === todayStr);
  }, [appointments, todayStr]);

  const totalToday = dayAppointments.reduce((acc, app) => acc + (app.price || 0), 0);
  const totalWalkins = dayAppointments.filter(app => (app as any).type === 'Walk-in').length;

  const handleWalkIn = async (data: any) => {
    try {
      await onAddAppointment({
        ...data,
        type: 'Walk-in',
        paid: true,
        status: 'confirmed'
      });
      setActiveTab('dashboard');
    } catch (error: any) {
      console.error("Error creating walk-in:", error);
    }
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
            setViewMode={setActiveTab}
            isMobile={isMobile}
          />

          {activeTab === 'dashboard' && (
            <View style={styles.dashboardGrid}>
              <AdminMetrics
                totalToday={totalToday}
                totalWalkins={totalWalkins}
                dateLabel={new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                COLORS={COLORS}
                isMobile={isMobile}
              />

              <View style={[styles.mainGridRow, isMobile && { flexDirection: 'column' }]}>
                  <View style={styles.agendaSection}>
                      <AdminAgenda
                          appointments={appointments}
                          COLORS={COLORS}
                          isMobile={isMobile}
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
            <AdminBarbers 
                COLORS={COLORS}
                isMobile={isMobile}
                onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'finances' && (
            <AdminFinances 
                COLORS={COLORS}
                isMobile={isMobile}
                onBack={() => setActiveTab('dashboard')}
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
              <Modal visible={true} transparent animationType="fade">
                  <View style={styles.modalOverlay}>
                      <BookingWizard 
                        user={currentUser} 
                        onConfirm={handleWalkIn} 
                        onCancel={() => setActiveTab('dashboard')}
                        COLORS={COLORS} 
                        barbers={barbers}
                        isWalkIn
                      />
                  </View>
              </Modal>
          )}

          {activeTab === 'queue' && (
            <Modal visible={true} animationType="fade" transparent={true}>
              <View style={styles.modalOverlay}>
                  {/* Placeholder for Queue Display if available, else just a close btn */}
                  <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.backBtn}>
                    <Text style={{ color: COLORS.primary }}>Cerrar Fila Virtual</Text>
                  </TouchableOpacity>
              </View>
            </Modal>
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
    gap: 32,
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
  }
});
