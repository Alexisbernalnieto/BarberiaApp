import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { LayoutDashboard, Calendar, Users, CreditCard, TrendingUp, Settings, LogOut, PlusCircle, Menu } from 'lucide-react';
import MainLayout from './Navigation/MainLayout';
import AdminHeader from './Admin/AdminHeader';
import AdminMetrics from './Admin/AdminMetrics';
import AdminQuickActions from './Admin/AdminQuickActions';
import AdminCalendar from './Admin/AdminCalendar';
import BookingWizard from './Booking/BookingWizard';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ appointments, onLogout, onAddAppointment, COLORS, toggleTheme, isDarkMode, barbers, setBarbers, isMobile: isMobileProp, setSidebarOpen }: any) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 768;
  const [activeTab, setActiveTab] = useState('dashboard');
  const { currentUser } = useAuth();

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} COLORS={COLORS} user={currentUser}>
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.contentArea} contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}>
          <AdminHeader 
            notifications={[]}
            setShowNotifications={() => {}}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onLogout={onLogout}
            COLORS={COLORS}
            viewMode={activeTab}
            setViewMode={setActiveTab}
            isMobile={isMobile}
            onMenuPress={() => setSidebarOpen?.(true)}
          />

          {activeTab === 'dashboard' && (
            <View style={styles.dashboardGrid}>
              <AdminMetrics totalToday={0} totalWalkins={0} dateLabel="Hoy" COLORS={COLORS} isMobile={isMobile} />
              <View style={[styles.mainGridRow, isMobile && { flexDirection: 'column' }]}>
                <View style={styles.calendarSection}>
                  <AdminCalendar appointments={appointments} COLORS={COLORS} isMobile={isMobile} selectedDate={new Date()} onDateChange={() => {}} />
                </View>
                <View style={styles.actionsSection}>
                  <AdminQuickActions setViewMode={setActiveTab} COLORS={COLORS} isMobile={isMobile} />
                </View>
              </View>
            </View>
          )}

          {activeTab === 'walkin' && (
              <Modal visible={true} transparent animationType="fade">
                  <View style={styles.modalOverlay}>
                      <BookingWizard 
                        user={currentUser} 
                        existingAppointments={appointments} 
                        onConfirm={(data: any) => { onAddAppointment(data); setActiveTab('dashboard'); }} 
                        onCancel={() => setActiveTab('dashboard')}
                        COLORS={COLORS} 
                        barbers={barbers}
                        isWalkIn
                      />
                  </View>
              </Modal>
          )}
        </ScrollView>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  contentWrapper: { flex: 1 },
  contentArea: { flex: 1 },
  scrollContent: { gap: 32 },
  dashboardGrid: { gap: 32 },
  mainGridRow: { flexDirection: 'row', gap: 32 },
  calendarSection: { flex: 2 },
  actionsSection: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', padding: 40, justifyContent: 'center' }
});
