import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, useWindowDimensions, Animated, ScrollView } from 'react-native';

import BookingWizard from './Booking/BookingWizard';
import UserHeader from './User/UserHeader';
import UserSummary from './User/UserSummary';
import UserAppointments from './User/UserAppointments';

// Stripe Web
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Servicios
import { createAppointment } from '../services/appointments';
import { createPaymentIntentWeb } from '../services/payments';

export default function UserDashboard({ user, appointments, onLogout, COLORS, toggleTheme, isDarkMode, barbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const stripe = useStripe();
  const elements = useElements();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState('book');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingAppointment, setPendingAppointment] = useState(null); // cita en espera de pago

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const containerPadding = isMobile ? 20 : 40;
  const gap = 24;
  const numColumns = width > 1200 ? 3 : width > 800 ? 2 : 1;
  const itemWidth = (width - containerPadding * 2 - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  const myAppointments = useMemo(() => {
    return appointments
      .filter(app => app.userId === user.email)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date > b.date ? 1 : -1;
        return a.time > b.time ? 1 : -1;
      });
  }, [appointments, user.email]);

  // Solo citas futuras (hoy o después) para "Próxima Cita"
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const nextAppointment = useMemo(() => {
    return myAppointments.find(app => app.date >= todayStr) || null;
  }, [myAppointments, todayStr]);

  // Cuando el usuario termina el wizard → Soft-reserve del slot antes del pago
  const handleNewBooking = async (data) => {
    setPaymentMessage("");
    setLoading(true);

    try {
      // 1. Intentar crear la cita con estado 'Pending' para bloquear el slot
      // Esto fallará si alguien más lo ganó mientras el usuario navegaba el wizard
      const newApp = await createAppointment({
        ...data,
        status: 'pending_payment',
        paid: false
      });

      setPendingAppointment(newApp);

      // 2. Si el slot se bloqueó con éxito, preparamos el pago
      const json = await createPaymentIntentWeb(data.price || 0);
      setClientSecret(json.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error("Error al iniciar reserva:", error);
      setPaymentMessage(error.message || "Error al preparar la reserva.");
      Alert.alert("Error", error.message || "No se pudo reservar el horario.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !clientSecret || !pendingAppointment) return;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      setPaymentMessage("Error: " + result.error.message);
      return;
    }

    if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      setPaymentMessage("Pago completado con éxito 🎉");

      // 3. Confirmar la cita que ya estaba en 'Pending'
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
        // La cita ya está en 'pending_payment' con el userId, así que es rastreable
      }

      // Limpiar estado
      setShowPayment(false);
      setPendingAppointment(null);
      setClientSecret(null);

      // Ir al historial
      setActiveTab("appointments");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={styles.container}>

        <UserHeader
          user={user}
          onLogout={onLogout}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          COLORS={COLORS}
          isMobile={isMobile}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }}>
          <UserSummary
            nextAppointment={nextAppointment}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            COLORS={COLORS}
            isMobile={isMobile}
          />

          <View style={styles.mainContent}>
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>
                {activeTab === 'book' ? 'Reservar Cita' : 'Historial de Citas'}
              </Text>
              <View style={styles.contentDivider} />
            </View>

            <View style={styles.contentContainer}>

              {/* FORMULARIO DE PAGO STRIPE */}
              {showPayment && pendingAppointment && (
                <View style={{ marginVertical: 20 }}>
                  <Text style={{ fontSize: 20, color: COLORS.text, marginBottom: 10 }}>
                    Pagar servicio — ${pendingAppointment.price} MXN
                  </Text>

                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "18px",
                          color: COLORS.text,
                          "::placeholder": { color: COLORS.textSecondary },
                        },
                        invalid: { color: "#e5424d" },
                      },
                    }}
                  />

                  {paymentMessage !== "" && (
                    <Text
                      style={{
                        marginTop: 10,
                        color: paymentMessage.includes("éxito") ? "green" : "red",
                      }}
                    >
                      {paymentMessage}
                    </Text>
                  )}

                  <View style={{ marginTop: 20 }}>
                    <Text
                      onPress={handleConfirmPayment}
                      style={{
                        backgroundColor: COLORS.primary,
                        color: "white",
                        padding: 12,
                        textAlign: "center",
                        borderRadius: 8,
                        fontSize: 18,
                        cursor: "pointer",
                      }}
                    >
                      Confirmar Pago y Guardar Cita
                    </Text>
                  </View>
                </View>
              )}

              {/* CONTENIDO NORMAL */}
              {!showPayment && (
                activeTab === 'book' ? (
                  <Animated.View style={[styles.bookingWrapper, { opacity: fadeAnim }]}>
                    <BookingWizard
                      user={user}
                      existingAppointments={appointments}
                      onConfirm={handleNewBooking}
                      COLORS={COLORS}
                      barbers={barbers}
                    />
                  </Animated.View>
                ) : (
                  <UserAppointments
                    appointments={myAppointments}
                    COLORS={COLORS}
                    numColumns={numColumns}
                    gap={gap}
                    itemWidth={itemWidth}
                    fadeAnim={fadeAnim}
                    onBookNow={() => setActiveTab('book')}
                    isMobile={isMobile}
                  />
                )
              )}

            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  contentHeader: {
    paddingHorizontal: isMobile ? 20 : 48,
    paddingTop: 28,
    paddingBottom: 20,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  contentDivider: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 48,
    paddingBottom: 40,
  },
  bookingWrapper: {
    paddingBottom: 40,
  },
});
