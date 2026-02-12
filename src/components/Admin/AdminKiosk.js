import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingWizard from '../Booking/BookingWizard';
import QueueDisplay from './QueueDisplay';
import AdminNotifications from './AdminNotifications';

export default function AdminKiosk({ 
  notifications, 
  setShowNotifications,
  showNotifications,
  handleMarkAsRead,
  onLogout, 
  appointments, 
  handleWalkIn, 
  COLORS, 
  viewMode, 
  setViewMode,
  barbers 
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.kioskContainer}>
        {/* Notification Button for Kiosk */}
        <TouchableOpacity 
            onPress={() => setShowNotifications(true)} 
            style={[styles.kioskNotificationBtn, { backgroundColor: COLORS.surface }]}
        >
            <MaterialCommunityIcons name="bell-ring" size={30} color={COLORS.primary} />
            {notifications.length > 0 && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{notifications.length}</Text>
                </View>
            )}
        </TouchableOpacity>

        <View style={styles.kioskContent}>
            <View style={styles.kioskHeader}>
                <MaterialCommunityIcons name="mustache" size={80} color={COLORS.primary} style={{marginBottom: 20}} />
                <Text style={[styles.kioskTitle, { fontSize: isMobile ? 32 : 48, color: COLORS.primary }]}>Bienvenido a Barbería</Text>
                <Text style={[styles.kioskSubtitle, { fontSize: isMobile ? 18 : 24, color: COLORS.textSecondary }]}>Regístrate o mira tu turno</Text>
            </View>

            <View style={[styles.kioskActions, { flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }]}>
                <TouchableOpacity 
                    style={[styles.kioskBtn, { backgroundColor: COLORS.primary, shadowColor: COLORS.primary }]} 
                    onPress={() => setViewMode('walkin')}
                >
                    <MaterialCommunityIcons name="calendar-plus" size={48} color="#FFFFFF" />
                    <Text style={styles.kioskBtnText}>Registrar Cita</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.kioskBtnSecondary, { backgroundColor: COLORS.surface }]} 
                    onPress={() => setViewMode('queue')}
                >
                    <MaterialCommunityIcons name="monitor-dashboard" size={48} color={COLORS.primary} />
                    <Text style={[styles.kioskBtnTextSecondary, { color: COLORS.primary }]}>Ver Turnos</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Kiosk Modals */}
        <Modal visible={viewMode === 'walkin'} animationType="slide">
            <BookingWizard 
                user={null} // No logged in user
                isWalkIn={true}
                existingAppointments={appointments}
                onConfirm={(data) => {
                    handleWalkIn(data);
                    // setViewMode('dashboard'); // Handled by parent or implicit
                }}
                onCancel={() => setViewMode('dashboard')}
                COLORS={COLORS}
                barbers={barbers}
            />
        </Modal>

        <Modal visible={viewMode === 'queue'} animationType="slide">
            <View style={{flex:1, backgroundColor: COLORS.background}}>
                <QueueDisplay appointments={appointments} onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
            </View>
        </Modal>

        <AdminNotifications 
            showNotifications={showNotifications} 
            setShowNotifications={setShowNotifications} 
            notifications={notifications} 
            handleMarkAsRead={handleMarkAsRead}
            COLORS={COLORS}
        />
        
        <TouchableOpacity onPress={onLogout} style={styles.kioskLogout}>
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.textSecondary} style={{marginRight: 8}} />
            <Text style={{color: COLORS.textSecondary, fontSize: 16}}>Salir (Admin)</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  kioskContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kioskNotificationBtn: {
    position: 'absolute', 
    top: 40, 
    right: 40, 
    zIndex: 100,
    padding: 15, 
    borderRadius: 50, 
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  kioskContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  kioskHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  kioskTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  kioskSubtitle: {
    letterSpacing: 1,
    textAlign: 'center',
  },
  kioskActions: {
    gap: 30,
  },
  kioskBtn: {
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 250,
  },
  kioskBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  kioskBtnSecondary: {
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    minWidth: 250,
  },
  kioskBtnTextSecondary: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  kioskLogout: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  badgeContainer: {
    position: 'absolute', top: 0, right: 0, 
    backgroundColor: '#FF5252', borderRadius: 15, 
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF'
  },
  badgeText: {
    color: 'white', fontSize: 14, fontWeight: 'bold'
  },
});
