import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { LayoutDashboard, Calendar, Users, CreditCard, TrendingUp, Settings, LogOut, PlusCircle, Menu } from 'lucide-react';
import MainLayout from './Navigation/MainLayout';
import { useSidebar } from '../context/SidebarContext';
import AdminHeader from './Admin/AdminHeader';
import AdminMetrics from './Admin/AdminMetrics';
import AdminQuickActions from './Admin/AdminQuickActions';
import AdminAgenda from './Admin/AdminAgenda';
import AdminUsers from './Admin/AdminUsers';
import AdminHistory from './Admin/AdminHistory';
import AdminBarbers from './Admin/AdminBarbers';
import AdminServices from './Admin/AdminServices';
import AdminFinances from './Admin/AdminFinances';
import NotificationsModal from './Admin/NotificationsModal';
import BookingWizard from './Booking/BookingWizard';
import CheckoutManager from './Admin/CheckoutManager';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ appointments, onLogout, onAddAppointment, COLORS, toggleTheme, isDarkMode, barbers, setBarbers, isMobile: isMobileProp }: any) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 1024;
  const { setIsOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser } = useAuth();

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} COLORS={COLORS} user={currentUser}>
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.contentArea} contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}>
          <AdminHeader 
            notifications={[]}
            setShowNotifications={setShowNotifications}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onLogout={onLogout}
            COLORS={COLORS}
            setViewMode={setActiveTab}
            isMobile={isMobile}
            onMenuPress={() => setIsOpen(true)}
          />

          {activeTab === 'dashboard' && (
            <View style={styles.dashboardGrid}>
              <AdminMetrics totalToday={0} totalWalkins={0} dateLabel="18 Mar" COLORS={COLORS} isMobile={isMobile} />
              <View style={[styles.mainGridRow, isMobile && { flexDirection: 'column' }]}>
                <View style={styles.agendaSection}>
                  <AdminAgenda appointments={appointments} COLORS={COLORS} isMobile={isMobile} />
                </View>
                <View style={styles.actionsSection}>
                  <AdminQuickActions setViewMode={setActiveTab} COLORS={COLORS} isMobile={isMobile} />
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
                        onConfirm={(data: any) => { onAddAppointment(data); setActiveTab('dashboard'); }} 
                        onCancel={() => setActiveTab('dashboard')}
                        COLORS={COLORS} 
                        isWalkIn
                      />
                  </View>
              </Modal>
          )}
        </ScrollView>
      </View>

      <NotificationsModal 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        COLORS={COLORS}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  contentWrapper: { flex: 1 },
  contentArea: { flex: 1 },
  scrollContent: { gap: 32 },
  dashboardGrid: { gap: 32 },
  mainGridRow: { flexDirection: 'row', gap: 32 },
  agendaSection: { flex: 2 },
  actionsSection: { flex: 1, gap: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', padding: 40, justifyContent: 'center' },
  placeholderContainer: { padding: 40, alignItems: 'center', gap: 12 },
  placeholderTitle: { fontSize: 20, fontWeight: '800' },
  backBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  backText: { fontWeight: '700' },
});
