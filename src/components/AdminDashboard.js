import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../firebaseClient';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';

// Sub-components
import AdminHeader from './Admin/AdminHeader';
import AdminMetrics from './Admin/AdminMetrics';
import AdminQuickActions from './Admin/AdminQuickActions';
import AdminCalendar from './Admin/AdminCalendar';
import AdminNotifications from './Admin/AdminNotifications';
import AdminKiosk from './Admin/AdminKiosk';

// Modals/Features
import QueueDisplay from './Admin/QueueDisplay';
import FinancialReport from './Admin/FinancialReport';
import BarberManagement from './Admin/BarberManagement';
import ServiceManagement from './Admin/ServiceManagement';
import UserManagement from './Admin/UserManagement';
import BookingWizard from './Booking/BookingWizard';

export default function AdminDashboard({ appointments, onLogout, onAddAppointment, role = 'admin', COLORS, toggleTheme, isDarkMode, barbers, setBarbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Animation for Fade In
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Notification Logic
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!role) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetRoles', 'array-contains', role),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const myId = role;
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(n => {
          const isRead = n.readBy && n.readBy.includes(myId);
          return !isRead;
        });
      console.log(`[Notifications] Role: ${role}, Total: ${snapshot.docs.length}, Unread: ${notifs.length}`);
      setNotifications(notifs);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });

    return () => unsubscribe();
  }, [role]);

  const handleMarkAsRead = async () => {
    if (!notifications.length) return;

    const myId = role;
    console.log(`[MarkAsRead] Marking ${notifications.length} as read for ${myId}`);

    // Optimistic update to clear UI immediately
    const currentNotifications = [...notifications];
    setNotifications([]);
    setShowNotifications(false);

    const batch = writeBatch(db);
    currentNotifications.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { readBy: arrayUnion(myId) });
    });

    try {
      await batch.commit();
      console.log("[MarkAsRead] Batch committed successfully");
    } catch (e) {
      console.error("Error marking notifications as read:", e);
    }
  };

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, queue, finance, walkin, barbers, services, users

  // Fecha seleccionada en el calendario (por default: hoy)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Formato "YYYY-MM-DD" para comparar con app.date
  const selectedDateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Métricas filtradas por el día seleccionado
  const dayAppointments = useMemo(() => {
    return appointments.filter(app => app.date === selectedDateStr);
  }, [appointments, selectedDateStr]);

  const totalToday = dayAppointments.reduce((acc, app) => acc + (app.price || 0), 0);
  const totalWalkins = dayAppointments.filter(app => app.type === 'Walk-in').length;

  // Label para las métricas
  const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dateLabel = `${selectedDate.getDate()} ${MONTHS_SHORT[selectedDate.getMonth()]}`;

  const handleWalkIn = async (data) => {
    // Today's date for comparison
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const walkInData = {
      ...data,
      userId: data.userId || 'admin-walkin',
      status: data.date === todayStr ? 'En Local' : 'Confirmado',
      // type already set by BookingWizard (Walk-in if same day, Online if future)
      paid: true // Walk-ins created by admin are marked as paid (or handled in checkout)
    };

    try {
      await onAddAppointment(walkInData);
      if (role !== 'reception') {
        setViewMode('dashboard');
      }
    } catch (error) {
      console.error("Error creating walk-in:", error);
      Alert.alert("Error", error.message || "No se pudo agendar la cita. Verifique el horario.");
    }
  };

  if (role === 'reception') {
    // MODO KIOSCO / TABLET
    return (
      <AdminKiosk
        notifications={notifications}
        setShowNotifications={setShowNotifications}
        showNotifications={showNotifications}
        handleMarkAsRead={handleMarkAsRead}
        onLogout={onLogout}
        appointments={appointments}
        handleWalkIn={handleWalkIn}
        COLORS={COLORS}
        viewMode={viewMode}
        setViewMode={setViewMode}
        barbers={barbers}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  }

  const renderDashboard = () => (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <AdminHeader
        notifications={notifications}
        setShowNotifications={setShowNotifications}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        onLogout={onLogout}
        COLORS={COLORS}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isMobile={isMobile}
      />

      <AdminMetrics
        totalToday={totalToday}
        totalWalkins={totalWalkins}
        dateLabel={dateLabel}
        COLORS={COLORS}
        isMobile={isMobile}
      />

      <AdminQuickActions
        setViewMode={setViewMode}
        COLORS={COLORS}
        isMobile={isMobile}
      />

      <AdminCalendar
        appointments={appointments}
        COLORS={COLORS}
        isMobile={isMobile}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background, paddingTop: isMobile ? 20 : 40, paddingHorizontal: isMobile ? 20 : 40 }]}>
      {viewMode === 'dashboard' && renderDashboard()}

      {viewMode === 'users' && (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={{ padding: 20, paddingBottom: 0 }}>
            <TouchableOpacity onPress={() => setViewMode('dashboard')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, marginLeft: 5, fontSize: 16 }}>Volver al Panel</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, padding: 20 }}>
            <UserManagement COLORS={COLORS} />
          </View>
        </View>
      )}

      {/* Modals for Reception (available in Admin too if needed via viewMode hack or future use) */}
      <Modal visible={viewMode === 'queue'} animationType="slide">
        <QueueDisplay appointments={appointments} onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
      </Modal>

      <Modal visible={viewMode === 'walkin'} animationType="slide">
        <BookingWizard
          user={{ email: role, name: 'Recepción' }}
          existingAppointments={appointments}
          onConfirm={handleWalkIn}
          onCancel={() => setViewMode('dashboard')}
          COLORS={COLORS}
          barbers={barbers}
        />
      </Modal>

      {/* Modals for Admin */}
      <Modal visible={viewMode === 'finance'} animationType="slide">
        <FinancialReport appointments={appointments} onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
      </Modal>

      <Modal visible={viewMode === 'barbers'} animationType="slide">
        <BarberManagement
          appointments={appointments}
          onClose={() => setViewMode('dashboard')}
          COLORS={COLORS}
          barbers={barbers}
          setBarbers={setBarbers}
        />
      </Modal>

      <Modal visible={viewMode === 'services'} animationType="slide">
        <ServiceManagement onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
      </Modal>

      {/* Notifications Modal Component */}
      <AdminNotifications
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        COLORS={COLORS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
  },
});
