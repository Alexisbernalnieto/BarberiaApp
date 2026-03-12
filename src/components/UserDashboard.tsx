import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  useWindowDimensions, 
  Animated, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { 
    Calendar, 
    PlusCircle, 
    Scissors, 
    CreditCard, 
    Bell, 
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
import { useTheme } from '../context/ThemeContext';

interface UserDashboardProps {
  user: AppUser;
  appointments: Appointment[];
  onLogout: () => void;
  COLORS: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
  barbers: AppUser[];
  isMobile?: boolean; // Passed by MainLayout
  setSidebarOpen?: (open: boolean) => void; // Passed by MainLayout
}

export default function UserDashboard({ 
  user, 
  appointments, 
  onLogout, 
  COLORS, 
  toggleTheme, 
  isDarkMode, 
  barbers,
  isMobile: isMobileProp,
  setSidebarOpen
}: UserDashboardProps) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 768;
  const stripe = useStripe();
  const elements = useElements();
  const { logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('book');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const myAppointments = useMemo(() => {
    return appointments
      .filter(app => app.userId === user.email)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date > b.date ? 1 : -1;
        return a.time > b.time ? 1 : -1;
      });
  }, [appointments, user.email]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const nextAppointment = useMemo(() => {
    return myAppointments.find(app => app.date >= todayStr) || null;
  }, [myAppointments, todayStr]);

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

        {nextAppointment && activeTab === 'book' && (
            <View style={styles.heroCard} data-hero="true">
                <View style={styles.heroInfo}>
                    <Text style={styles.heroLabel}>PRÓXIMA CITA</Text>
                    <Text style={styles.heroTitle}>{nextAppointment.serviceName}</Text>
                    <View style={styles.heroMeta}>
                        <View style={styles.metaRow}>
                            <Calendar size={14} color="var(--gold)" />
                            <Text style={styles.metaText}>{nextAppointment.date} a las {nextAppointment.time}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Scissors size={14} color="var(--gold)" />
                            <Text style={styles.metaText}>{nextAppointment.barberName}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.heroPriceBadge}>
                    <Text style={styles.heroPrice}>${nextAppointment.price}</Text>
                </View>
            </View>
        )}

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
                    data-primary-btn="true"
                >
                    <CreditCard size={18} color="#000" />
                    <Text style={styles.payBtnText}>CONFIRMAR Y PAGAR</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPayment(false)} style={styles.cancelPay}>
                    <Text style={styles.cancelText}>Cancelar Cita</Text>
                </TouchableOpacity>
            </View>
        ) : (
            activeTab === 'book' ? (
                <View style={styles.bookingCard} data-glass="true">
                     <BookingWizard
                        user={user as any}
                        existingAppointments={appointments}
                        onConfirm={handleNewBooking}
                        COLORS={COLORS}
                        barbers={barbers}
                    />
                </View>
            ) : (
                <View style={styles.appointmentsGrid}>
                    <Text style={styles.sectionTitle}>Historial de Citas</Text>
                    {myAppointments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Calendar size={48} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>Aún no tienes citas agendadas.</Text>
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {myAppointments.map(app => (
                                <View key={app.id} style={styles.apptCard}>
                                    <View style={styles.apptHeader}>
                                        <View style={styles.apptIcon}>
                                            <Calendar size={18} color="var(--gold)" />
                                        </View>
                                        <Text style={styles.apptDate}>{app.date}</Text>
                                        <View style={[styles.statusTag, { backgroundColor: app.paid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                            <Text style={[styles.statusLabel, { color: app.paid ? '#10B981' : '#EF4444' }]}>
                                                {app.paid ? 'PAGADO' : 'PENDIENTE'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.apptService}>{app.serviceName}</Text>
                                    <View style={styles.apptFooter}>
                                        <View style={styles.footerInfo}>
                                            <Clock size={12} color="var(--text-muted)" />
                                            <Text style={styles.footerText}>{app.time}</Text>
                                        </View>
                                        <Text style={styles.apptPrice}>${app.price}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )
        )}
        </ScrollView>
      </View>
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
    gap: 32,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  dateText: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: 'var(--gold-subtle)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'var(--gold-border)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroInfo: {
    gap: 8,
  },
  heroLabel: {
    color: 'var(--gold)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: '500',
  },
  heroPriceBadge: {
    backgroundColor: 'var(--gold)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  heroPrice: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  bookingCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  appointmentsGrid: {
    gap: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  apptCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  apptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  apptIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'var(--gold-subtle)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptDate: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  apptService: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  apptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  apptPrice: {
    color: 'var(--gold)',
    fontSize: 15,
    fontWeight: '700',
  },
  paymentSection: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    gap: 12,
  },
  paymentSub: {
    color: 'var(--text-secondary)',
    marginBottom: 12,
  },
  stripeWrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
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
  payBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  cancelPay: {
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: 'var(--text-muted)',
    fontSize: 13,
  },
  paymentMsg: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: 14,
  }
});
