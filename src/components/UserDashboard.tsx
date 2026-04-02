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
import UserSchedules from './User/UserSchedules';
import UserServicesDetailed from './User/UserServicesDetailed';
import UserLocations from './User/UserLocations';
import AdminUsers from './Admin/AdminUsers';
import NoShowModal from './User/NoShowModal';
import { submitNoShowJustification } from '../services/appointments';
import { isAppointmentExpired } from '../utils/formatters';
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
  
  const [activeTab, setActiveTab] = useState('dashboard');

  const myAppointments = useMemo(() => {
    return appointments.filter(app => app.userId === user.email || app.userId === user.uid);
  }, [appointments, user.email, user.uid]);

  const [noShowModalVisible, setNoShowModalVisible] = useState(false);
  const [currentNoShowApp, setCurrentNoShowApp] = useState<Appointment | null>(null);

  // Check for no-shows that haven't been justified yet
  React.useEffect(() => {
    const pendingNoShow = myAppointments.find(app => 
      app.status === 'no_show' && 
      !app.rescheduleRequested && 
      !app.rescheduleAuthorized
    );

    if (pendingNoShow) {
      setCurrentNoShowApp(pendingNoShow);
      setNoShowModalVisible(true);
    }
  }, [myAppointments]);

  const handleSubmitJustification = async (appointmentId: string, justification: string) => {
    try {
      await submitNoShowJustification(appointmentId, justification);
    } catch (error) {
      console.error("Error submitting justification:", error);
      alert("Error al enviar la justificación. Por favor intenta de nuevo.");
      throw error;
    }
  };

  const handleBookingComplete = (data: any) => {
    setActiveTab('appointments');
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
        <View style={styles.headerArea}>
            <View style={styles.headerTitleRow}>
                {isMobile && (
                    <TouchableOpacity onPress={() => setIsOpen(true)} style={[styles.menuBtn, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.05)' }]}>
                        <Menu size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={[styles.greeting, { color: COLORS.text, fontSize: isMobile ? 22 : 28 }]}>Hola, {user.name?.split(' ')[0] || 'Cliente'}</Text>
                    <Text style={[styles.dateText, { color: COLORS.textSecondary }]}>Bienvenido a tu portal élite</Text>
                </View>
            </View>
            
            <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.05)' }]} onPress={toggleTheme}>
                    {isDarkMode ? <Sun size={20} color={COLORS.primary} /> : <Moon size={20} color={COLORS.textSecondary} />}
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
                nextAppointment={myAppointments
                    .filter(a => (a.status === 'confirmed' || a.status === 'checked_in' || a.status === 'in_progress') && !isAppointmentExpired(a.date, a.time))
                    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0]}
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
                    onLogout={handleLogoutWithGuard}
                    toggleTheme={toggleTheme}
                    isDarkMode={isDarkMode}
                />
            )}

            {activeTab === 'schedules' && (
                <UserSchedules COLORS={COLORS} />
            )}

            {activeTab === 'services' && (
                <UserServicesDetailed COLORS={COLORS} />
            )}

            {activeTab === 'location' && (
                <UserLocations COLORS={COLORS} />
            )}

            {activeTab === 'admin_users_override' && (
                <AdminUsers 
                    COLORS={COLORS} 
                    isMobile={isMobile} 
                    onBack={() => setActiveTab('dashboard')} 
                />
            )}
        </ScrollView>
      </View>
      
      <NoShowModal
        visible={noShowModalVisible}
        appointment={currentNoShowApp}
        onClose={() => setNoShowModalVisible(false)}
        onSubmitJustification={handleSubmitJustification}
        COLORS={COLORS}
      />
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
  menuBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontWeight: '900', letterSpacing: -0.5 },
  dateText: { fontSize: 14, marginTop: 4, letterSpacing: 1 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bookingCard: { 
    backgroundColor: 'transparent',
    borderRadius: 24, 
    flex: 1 
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
});
