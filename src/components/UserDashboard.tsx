import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Calendar, PlusCircle, Scissors, CreditCard, Sun, Moon, Clock, User as UserIcon, Menu } from 'lucide-react';
import MainLayout from './Navigation/MainLayout';
import BookingWizard from './Booking/BookingWizard';
import { Appointment, AppUser } from '../types';

export default function UserDashboard({ user, appointments, onLogout, COLORS, toggleTheme, isDarkMode, barbers, isMobile: isMobileProp, setSidebarOpen }: any) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 768;
  const [activeTab, setActiveTab] = useState('book');

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
                      <TouchableOpacity onPress={() => setSidebarOpen?.(true)} style={styles.menuBtn}>
                          <Menu size={24} color="var(--gold)" />
                      </TouchableOpacity>
                  )}
                  <View>
                      <Text style={[styles.greeting, { fontSize: isMobile ? 20 : 24 }]}>Hola, {user.name || 'Cliente'}</Text>
                      <Text style={styles.dateText}>Bienvenido a tu portal exclusivo</Text>
                  </View>
              </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
                    {isDarkMode ? <Sun size={20} color="var(--gold)" /> : <Moon size={20} color="var(--text-secondary)" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn} onPress={onLogout}>
                    <UserIcon size={20} color="var(--text-secondary)" />
                </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'book' ? (
              <View style={styles.bookingCard}>
                   <BookingWizard
                      user={user}
                      existingAppointments={appointments}
                      onConfirm={() => setActiveTab('appointments')}
                      COLORS={COLORS}
                      barbers={barbers}
                  />
              </View>
          ) : (
              <View style={styles.appointmentsGrid}>
                  <Text style={styles.sectionTitle}>Historial de Citas</Text>
                  <View style={styles.grid}>
                      {myAppointments.map((app: Appointment) => (
                          <View key={app.id} style={styles.apptCard}>
                              <Text style={styles.apptService}>{app.serviceName}</Text>
                              <Text style={styles.apptDate}>{app.date} - {app.time}</Text>
                              <Text style={styles.apptPrice}>${app.price}</Text>
                          </View>
                      ))}
                  </View>
              </View>
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
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--glass-surface)', borderWidth: 1, borderColor: 'var(--glass-border)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontWeight: '800', color: '#FFF' },
  dateText: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--glass-surface)', borderWidth: 1, borderColor: 'var(--glass-border)', alignItems: 'center', justifyContent: 'center' },
  bookingCard: { backgroundColor: 'var(--bg-card)', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'var(--glass-border)' },
  appointmentsGrid: { gap: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  grid: { gap: 16 },
  apptCard: { backgroundColor: 'var(--bg-card)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'var(--glass-border)' },
  apptService: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  apptDate: { color: 'var(--text-secondary)', fontSize: 13 },
  apptPrice: { color: 'var(--gold)', fontSize: 15, fontWeight: '700', marginTop: 8 }
});
