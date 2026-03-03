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

  const nextAppointment = myAppointments.length > 0 ? myAppointments[0] : null;

  // Cuando el usuario termina el wizard → NO guardamos aún, solo preparamos pago
  const handleNewBooking = async (data) => {
    setPendingAppointment(data);
    setPaymentMessage("");

    try {
      // Enviar precio en pesos (la Cloud Function convierte a centavos)
      const json = await createPaymentIntentWeb(data.price || 0);
      setClientSecret(json.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error("Error creando PaymentIntent:", error);
      setPaymentMessage("Error al preparar el pago: " + error.message);
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

      // Guardar cita en Firestore DESPUÉS del pago
      await createAppointment({
        userId: pendingAppointment.userId,
        userName: pendingAppointment.userName,
        branch: pendingAppointment.branch,
        barberId: pendingAppointment.barberId,
        barberName: pendingAppointment.barberName,
        date: pendingAppointment.date,
        time: pendingAppointment.time,
        serviceId: pendingAppointment.serviceId,
        serviceName: pendingAppointment.serviceName,
        price: pendingAppointment.price,
        duration: pendingAppointment.duration,
        type: pendingAppointment.type,
        paymentIntentId: result.paymentIntent.id,
      });

      // Limpiar estado de pago y cita pendiente
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  contentHeader: {
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 32,
    paddingBottom: 24,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  contentDivider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingBottom: 40,
  },
  bookingWrapper: {
    paddingBottom: 40,
  },
});
