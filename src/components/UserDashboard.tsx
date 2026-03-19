import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Calendar, PlusCircle, Scissors, CreditCard, Sun, Moon, Clock, User as UserIcon, Menu } from 'lucide-react';
import MainLayout from './Navigation/MainLayout';
import { useSidebar } from '../context/SidebarContext';
import BookingWizard from './Booking/BookingWizard';
import { Appointment, AppUser } from '../types';

// New Client Role Components
import UserSummary from './User/UserSummary';
import UserAppointments from './User/UserAppointments';
import UserPayments from './User/UserPayments';
import UserProfile from './User/UserProfile';

export default function UserDashboard({ user, appointments, onLogout, COLORS, toggleTheme, isDarkMode, barbers, isMobile: isMobileProp }: any) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 1024;
  const { setIsOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');

  const myAppointments = useMemo(() => {
    return appointments.filter((app: Appointment) => app.userId === user.email);
  }, [appointments, user.email]);

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} COLORS={COLORS} user={user}>
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.contentArea} contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}>
          <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                  {isMobile && (
                      <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.menuBtn}>
                          <Menu size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                  )}
                  <View>
                      <Text style={[styles.greeting, { fontSize: isMobile ? 20 : 24 }]}>Hola, {user.name || 'Cliente'}</Text>
                      <Text style={styles.dateText}>Bienvenido a tu portal exclusivo</Text>
                  </View>
              </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
                    {isDarkMode ? <Sun size={20} color={COLORS.primary} /> : <Moon size={20} color={COLORS.textSecondary} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn} onPress={onLogout}>
                    <UserIcon size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'dashboard' && (
              <UserSummary 
                nextAppointment={myAppointments.find((a: Appointment) => a.status === 'confirmed')}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                COLORS={COLORS}
              />
          )}

          {activeTab === 'book' && (
              <View style={styles.bookingCard}>
                   <BookingWizard
                      user={user}
                      existingAppointments={appointments}
                      onConfirm={() => setActiveTab('appointments')}
                      COLORS={COLORS}
                      barbers={barbers}
                  />
              </View>
          )}

          {activeTab === 'appointments' && (
              <UserAppointments 
                user={user}
                appointments={myAppointments}
                COLORS={COLORS}
                isMobile={isMobile}
              />
          )}

          {activeTab === 'payments' && (
              <UserPayments 
                user={user}
                COLORS={COLORS}
                isMobile={isMobile}
              />
          )}

          {activeTab === 'profile' && (
              <UserProfile 
                user={user}
                COLORS={COLORS}
                isMobile={isMobile}
                onLogout={onLogout}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
              />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontWeight: '800', color: '#FFF' },
  dateText: { color: '#888', fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  bookingCard: { backgroundColor: '#111', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
  appointmentsGrid: { gap: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  grid: { gap: 16 },
  apptCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
  apptService: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  apptDate: { color: '#888', fontSize: 13 },
  apptPrice: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginTop: 8 }
});
