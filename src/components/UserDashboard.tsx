import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useWindowDimensions, 
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { 
    Calendar, 
    PlusCircle, 
    Scissors, 
    CreditCard, 
    Sun, 
    Moon,
    Clock,
    User as UserIcon,
    Menu
} from 'lucide-react';

import MainLayout from './Navigation/MainLayout';
import BookingWizard from './Booking/BookingWizard';
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createAppointment } from '../services/appointments';
import { createPaymentIntentWeb } from '../services/payments';
import { db } from '../firebaseClient';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Appointment, AppUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

// New Client Role Components
import UserSummary from '@/components/User/UserSummary';
import UserAppointments from '@/components/User/UserAppointments';
import UserPayments from '@/components/User/UserPayments';
import UserProfile from '@/components/User/UserProfile';

interface UserDashboardProps {
  user: AppUser;
  appointments: Appointment[];
  onLogout: () => void;
  COLORS: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
  barbers: AppUser[];
  isMobile?: boolean;
}

export default function UserDashboard({ 
  user, 
  appointments, 
  onLogout, 
  COLORS, 
  toggleTheme, 
  isDarkMode, 
  barbers,
  isMobile: isMobileProp
}: UserDashboardProps) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 1024;
  const { setIsOpen, isBookingInProgress } = useSidebar();
  const stripe = useStripe();
  const elements = useElements();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const myAppointments = useMemo(() => {
    return appointments.filter(app => app.userId === user.email || app.userId === user.uid);
  }, [appointments, user.email, user.uid]);

  const handleNewBooking = (data: any) => {
    // BookingWizard now handles the appointment creation and payment
    setActiveTab("appointments");
  };

  const handleLogoutWithGuard = () => {
    if (isBookingInProgress) {
        alert("Te encuentras en el proceso de agendar una cita. Por favor finaliza o cancela para salir.");
        return;
    }
    onLogout();
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      COLORS={COLORS}
      user={user}
    >
      <View style={styles.contentWrapper}>
        <View style={[styles.header, { padding: isMobile ? 20 : 40, paddingBottom: 0 }]}>
            <View style={styles.headerTitleRow}>
                {isMobile && (
                    <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.menuBtn}>
                        <Menu size={24} color={COLORS.primary || "var(--gold)"} />
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
              <TouchableOpacity style={styles.headerBtn} onPress={handleLogoutWithGuard}>
                  <UserIcon size={20} color="var(--text-secondary)" />
              </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContentArea}>
            {activeTab === 'book' ? (
                <View style={styles.bookingCardInner}>
                    <BookingWizard
                        user={user}
                        onConfirm={handleNewBooking}
                        COLORS={COLORS}
                        onCancel={() => setActiveTab('dashboard')}
                    />
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollArea} 
                    contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab === 'dashboard' && (
                        <UserSummary 
                            nextAppointment={myAppointments.find(a => a.status === 'confirmed')}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            COLORS={COLORS}
                        />
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
                            onLogout={handleLogoutWithGuard}
                            toggleTheme={toggleTheme}
                            isDarkMode={isDarkMode}
                        />
                    )}
                </ScrollView>
            )}
        </View>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  contentWrapper: { flex: 1 },
  contentArea: { flex: 1 },
  scrollContent: { padding: 40, gap: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  mainContentArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  bookingCardInner: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  greeting: { fontWeight: '800', color: '#FFF' },
  dateText: { color: '#888', fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  bookingCard: { backgroundColor: '#111', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)', flex: 1 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  paymentSection: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    gap: 12,
  },
  paymentSub: { color: '#888', marginBottom: 12 },
  stripeWrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  payBtn: {
    backgroundColor: 'var(--gold)',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  payBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  cancelPay: { alignItems: 'center', padding: 12 },
  cancelText: { color: '#888', fontSize: 13 },
  paymentMsg: { textAlign: 'center', fontSize: 13, fontWeight: '600' }
});
