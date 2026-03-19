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
  const stripe = useStripe();
  const elements = useElements();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const myAppointments = useMemo(() => {
    return appointments.filter(app => app.userId === user.email || app.userId === user.uid);
  }, [appointments, user.email, user.uid]);

  const handleNewBooking = async (data: any) => {
    setPaymentMessage("");
    setLoading(true);

    try {
      const newApp = await createAppointment({
        ...data,
        status: 'pending_payment',
        paid: false
      });

      setPendingAppointment(newApp);

      const json = await createPaymentIntentWeb(data.price || 0);
      setClientSecret(json.clientSecret);
      setShowPayment(true);
    } catch (error: any) {
      console.error("Error al iniciar reserva:", error);
      setPaymentMessage(error.message || "Error al preparar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !clientSecret || !pendingAppointment) return;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      setPaymentMessage("Error: " + result.error.message);
      return;
    }

    if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      setPaymentMessage("Pago completado con éxito 🎉");

      try {
        const appRef = doc(db, 'appointments', pendingAppointment.id);
        await updateDoc(appRef, {
          paid: true,
          status: 'confirmed',
          paymentIntentId: result.paymentIntent.id,
          paidAt: Timestamp.now()
        });
      } catch (e) {
        console.error("Error al confirmar pago en Firestore:", e);
      }

      setShowPayment(false);
      setPendingAppointment(null);
      setClientSecret(null);
      setActiveTab("appointments");
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      COLORS={COLORS}
      user={user}
    >
      <View style={styles.contentWrapper}>
        <ScrollView 
          style={styles.contentArea} 
          contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
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
                <TouchableOpacity style={styles.headerBtn} onPress={onLogout}>
                    <UserIcon size={20} color="var(--text-secondary)" />
                </TouchableOpacity>
            </View>
        </View>

        {showPayment && pendingAppointment ? (
            <View style={styles.paymentSection} data-glass="true">
                <Text style={styles.sectionTitle}>Finalizar Pago</Text>
                <Text style={styles.paymentSub}>Cita: {pendingAppointment.serviceName} - ${pendingAppointment.price} MXN</Text>
                
                <View style={styles.stripeWrapper}>
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: "16px",
                                    color: "#FFFFFF",
                                    "::placeholder": { color: "rgba(255,255,255,0.4)" },
                                },
                                invalid: { color: "#EF4444" },
                            },
                        }}
                    />
                </View>

                {paymentMessage !== "" && (
                    <Text style={[styles.paymentMsg, { color: paymentMessage.includes("éxito") ? "#10B981" : "#EF4444" }]}>
                        {paymentMessage}
                    </Text>
                )}

                <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={handleConfirmPayment}
                    disabled={loading}
                >
                    <CreditCard size={18} color="#000" />
                    <Text style={styles.payBtnText}>{loading ? "PROCESANDO..." : "CONFIRMAR Y PAGAR"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPayment(false)} style={styles.cancelPay}>
                    <Text style={styles.cancelText}>Cancelar Pago</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <>
                {activeTab === 'dashboard' && (
                    <UserSummary 
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
                            existingAppointments={appointments}
                            onConfirm={handleNewBooking}
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
            </>
        )}
        </ScrollView>
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
  greeting: { fontWeight: '800', color: '#FFF' },
  dateText: { color: '#888', fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', alignItems: 'center', justifyContent: 'center' },
  bookingCard: { backgroundColor: '#111', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
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

});
