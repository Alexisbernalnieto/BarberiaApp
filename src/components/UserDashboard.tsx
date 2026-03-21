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
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { Appointment, AppUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

// New Client Role Components
import UserSummary from './User/UserSummary';
import UserAppointments from './User/UserAppointments';
import UserPayments from './User/UserPayments';
import UserProfile from './User/UserProfile';

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
  const { setIsOpen } = useSidebar();
  
  const [activeTab, setActiveTab] = useState('dashboard');

  const myAppointments = useMemo(() => {
    return appointments.filter(app => app.userId === user.email || app.userId === user.uid);
  }, [appointments, user.email, user.uid]);

  const handleBookingComplete = (data: any) => {
    setActiveTab('appointments');
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      COLORS={COLORS}
      user={user}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.headerArea}>
            <View style={styles.headerTitleRow}>
                {isMobile && (
                    <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.menuBtn}>
                        <Menu size={24} color={COLORS.primary || "var(--gold)"} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={[styles.greeting, { fontSize: isMobile ? 22 : 28 }]}>Hola, {user.name?.split(' ')[0] || 'Cliente'}</Text>
                    <Text style={styles.dateText}>Bienvenido a tu portal élite</Text>
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

        <ScrollView 
          style={styles.contentArea} 
          contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}
          showsVerticalScrollIndicator={false}
        >
            {activeTab === 'dashboard' && (
                <UserSummary 
                    user={user}
                    nextAppointment={myAppointments.find(a => a.status === 'confirmed')}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    COLORS={COLORS}
                />
            )}

            {activeTab === 'book' && (
                <View style={styles.bookingCard}>
                    <BookingWizard
                        user={user}
                        onConfirm={handleBookingComplete}
                        onCancel={() => setActiveTab('dashboard')}
                        COLORS={COLORS}
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
  scrollContent: { paddingBottom: 100 },
  headerArea: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  dateText: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, letterSpacing: 1 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  bookingCard: { 
    backgroundColor: 'transparent',
    borderRadius: 24, 
    flex: 1 
  },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
