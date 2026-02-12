import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../firebaseClient';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';

// Sub-components
import AdminHeader from './Admin/AdminHeader';
import AdminMetrics from './Admin/AdminMetrics';
import AdminQuickActions from './Admin/AdminQuickActions';
import AdminAppointmentList from './Admin/AdminAppointmentList';
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
  const isTablet = width >= 768 && width < 1024;

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
        const notifs = snapshot.docs.map(d => ({id: d.id, ...d.data()}))
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

  // Responsive Grid Config
  const containerPadding = isMobile ? 20 : 40; 
  const gap = 20;
  const numColumns = width > 1400 ? 3 : width > 900 ? 2 : 1; 
  const itemWidth = (width - (containerPadding * 2) - ((numColumns - 1) * gap)) / numColumns;

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, queue, finance, walkin, barbers, services, users

  const totalToday = appointments.reduce((acc, app) => acc + (app.price || 0), 0);
  const totalWalkins = appointments.filter(app => app.type === 'Walk-in').length;

  const handleWalkIn = (data) => {
    // Sobrescribir datos para Walk-in (Solo Recepción/Kiosco)
    const walkInData = {
        ...data,
        userId: 'admin-walkin',
        status: 'En Local',
        type: 'Walk-in',
        isPaid: true // Asumimos pago en caja o terminal
    };
    onAddAppointment(walkInData);
    if (role === 'reception') {
        // En modo kiosco, el BookingWizard lo maneja con onConfirm
    } else {
        setViewMode('dashboard');
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
      />

      <AdminMetrics 
        totalToday={totalToday}
        totalWalkins={totalWalkins}
        COLORS={COLORS}
      />

      <AdminQuickActions 
        setViewMode={setViewMode}
        COLORS={COLORS}
      />

      <AdminAppointmentList 
        appointments={appointments}
        numColumns={numColumns}
        itemWidth={itemWidth}
        COLORS={COLORS}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background, paddingTop: isMobile ? 20 : 40, paddingHorizontal: isMobile ? 20 : 40 }]}>
      {viewMode === 'dashboard' && renderDashboard()}
      
      {viewMode === 'users' && (
        <View style={{flex:1, backgroundColor: COLORS.background}}>
            <View style={{padding: 20, paddingBottom: 0}}>
                <TouchableOpacity onPress={() => setViewMode('dashboard')} style={{flexDirection: 'row', alignItems: 'center'}}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
                    <Text style={{color: COLORS.primary, marginLeft: 5, fontSize: 16}}>Volver al Panel</Text>
                </TouchableOpacity>
            </View>
            <View style={{flex: 1, padding: 20}}>
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
