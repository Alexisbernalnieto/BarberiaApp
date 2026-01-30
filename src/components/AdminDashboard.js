import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, useWindowDimensions, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../firebaseClient';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import QueueDisplay from './Admin/QueueDisplay';
import FinancialReport from './Admin/FinancialReport';
import BarberManagement from './Admin/BarberManagement';
import ServiceManagement from './Admin/ServiceManagement';
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
      const currentNotifications = [...notifications]; // Keep backup in case of error (optional)
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
          // Optionally revert state here if critical, but onSnapshot should handle consistency
      }
  };

  // Responsive Grid Config
  const containerPadding = isMobile ? 20 : 40; 
  const gap = 20;
  // Dynamic columns: Mobile 1, Tablet 2, Desktop 3+
  const numColumns = width > 1400 ? 3 : width > 900 ? 2 : 1; 
  const itemWidth = (width - (containerPadding * 2) - ((numColumns - 1) * gap)) / numColumns;

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, queue, finance, walkin, barbers, services

  const styles = useMemo(() => getStyles(COLORS, isMobile, isTablet), [COLORS, isMobile, isTablet]);

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
        // En modo kiosco, tal vez mostrar un mensaje de éxito y resetear
        // BookingWizard lo maneja con onConfirm, pero aquí cerramos el modal o reseteamos vista
    } else {
        setViewMode('dashboard');
    }
  };

  if (role === 'reception') {
      // MODO KIOSCO / TABLET
      return (
        <View style={styles.kioskContainer}>
            {/* Notification Button for Kiosk */}
            <TouchableOpacity 
                onPress={() => setShowNotifications(true)} 
                style={styles.kioskNotificationBtn}
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
                    <Text style={styles.kioskTitle}>Bienvenido a Barbería</Text>
                    <Text style={styles.kioskSubtitle}>Regístrate o mira tu turno</Text>
                </View>

                <View style={styles.kioskActions}>
                    <TouchableOpacity style={styles.kioskBtn} onPress={() => setViewMode('walkin')}>
                        <MaterialCommunityIcons name="calendar-plus" size={48} color={COLORS.white} />
                        <Text style={styles.kioskBtnText}>Registrar Cita</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.kioskBtnSecondary} onPress={() => setViewMode('queue')}>
                        <MaterialCommunityIcons name="monitor-dashboard" size={48} color={COLORS.primary} />
                        <Text style={styles.kioskBtnTextSecondary}>Ver Turnos</Text>
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
                        setViewMode('dashboard'); // Close modal to return to Kiosk Home
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
            
            <TouchableOpacity onPress={onLogout} style={styles.kioskLogout}>
                <MaterialCommunityIcons name="logout" size={24} color={COLORS.textSecondary} style={{marginRight: 8}} />
                <Text style={{color: COLORS.textSecondary, fontSize: 16}}>Salir (Admin)</Text>
            </TouchableOpacity>
        </View>
      );
  }

  const renderDashboard = () => (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Barbería</Text>
          <Text style={styles.subtitleHeader}>
            Panel Administrador
          </Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
                <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
                {notifications.length > 0 && (
                    <View style={styles.smallBadge}>
                        <Text style={styles.smallBadgeText}>{notifications.length}</Text>
                    </View>
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
              <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} style={{marginRight: 8}} />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
             <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.primary} />
             <Text style={styles.metricLabel}>Ingresos hoy</Text>
          </View>
          <Text style={styles.metricValue}>${totalToday}</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
             <MaterialCommunityIcons name="walk" size={24} color={COLORS.primary} />
             <Text style={styles.metricLabel}>Walk-ins</Text>
          </View>
          <Text style={styles.metricValue}>{totalWalkins}</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        {/* Admin Actions */}
        <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('finance')}>
            <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons name="finance" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Finanzas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('barbers')}>
            <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons name="content-cut" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Barberos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('services')}>
            <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons name="tag-multiple" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Servicios</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Agenda Global</Text>
      <FlatList
        key={`grid-${numColumns}`}
        data={appointments}
        numColumns={numColumns}
        keyExtractor={(item, index) => index.toString()}
        columnWrapperStyle={numColumns > 1 ? { gap: 20 } : undefined}
        renderItem={({ item }) => (
            <View style={[styles.card, { width: itemWidth }, item.type === 'Walk-in' && styles.walkInCard]}>
                <View style={styles.cardHeader}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                        <Text style={styles.clientName}>{item.userName}</Text>
                    </View>
                    <View style={styles.timeTag}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.white} style={{marginRight: 4}} />
                        <Text style={styles.timeTagText}>{item.time}</Text>
                    </View>
                </View>
                
                <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="content-cut" size={16} color={COLORS.textSecondary} style={{marginRight: 8}} />
                    <Text style={styles.detail}>{item.serviceName} - ${item.price}</Text>
                </View>
                
                <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textSecondary} style={{marginRight: 8}} />
                    <Text style={styles.detail}>{item.date}</Text>
                </View>

                <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textSecondary} style={{marginRight: 8}} />
                    <Text style={styles.detail}>{item.barberName}</Text>
                </View>
                
                <View style={styles.typeTagContainer}>
                    <Text style={[styles.typeTag, {color: item.type === 'Walk-in' ? COLORS.success : COLORS.primary}]}>
                        {item.type}
                    </Text>
                </View>
            </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {viewMode === 'dashboard' && renderDashboard()}
      
      {/* Modals for Reception */}
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

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.notificationModal}>
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>Notificaciones</Text>
                    <TouchableOpacity onPress={() => setShowNotifications(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="bell-sleep" size={48} color={COLORS.textSecondary} style={{marginBottom: 10}} />
                        <Text style={styles.emptyStateText}>No tienes nuevas notificaciones</Text>
                    </View>
                ) : (
                    <ScrollView style={{maxHeight: 400}}>
                        {notifications.map(notif => (
                            <View key={notif.id} style={styles.notificationItem}>
                                {/* Card Header */}
                                <View style={styles.notifItemHeader}>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <MaterialCommunityIcons name="calendar-check" size={18} color={COLORS.white} style={{marginRight: 8}} />
                                        <Text style={styles.notifItemTitle}>Nueva Cita Agendada</Text>
                                    </View>
                                    <Text style={styles.notifTime}>
                                        {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                </View>

                                {/* Card Body */}
                                <View style={styles.notifBody}>
                                    <View style={styles.notifRow}>
                                        <Text style={styles.notifLabel}>Cliente:</Text>
                                        <Text style={styles.notifValue}>{notif.clientName || notif.message}</Text>
                                    </View>
                                    
                                    <View style={styles.notifRow}>
                                        <Text style={styles.notifLabel}>Servicio:</Text>
                                        <Text style={styles.notifValue}>{notif.service}</Text>
                                    </View>

                                    <View style={styles.notifRow}>
                                        <Text style={styles.notifLabel}>Fecha:</Text>
                                        <Text style={styles.notifValue}>
                                            {notif.dateDisplay || notif.subtext} - {notif.time}
                                        </Text>
                                    </View>

                                    <View style={styles.notifRow}>
                                        <Text style={styles.notifLabel}>Sucursal:</Text>
                                        <Text style={styles.notifValue}>{notif.branch}</Text>
                                    </View>

                                    <View style={styles.notifRow}>
                                        <Text style={styles.notifLabel}>Barbero:</Text>
                                        <Text style={[styles.notifValue, {color: COLORS.primary}]}>{notif.barber}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {notifications.length > 0 && (
                    <TouchableOpacity 
                        onPress={handleMarkAsRead}
                        style={styles.markReadBtn}
                    >
                        <Text style={styles.markReadText}>Marcar todo como leído</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS, isMobile, isTablet) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: isMobile ? 20 : 40,
    paddingHorizontal: isMobile ? 20 : 40,
    minHeight: '100%',
  },
  // Kiosk Styles
  kioskContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kioskNotificationBtn: {
    position: 'absolute', 
    top: 40, 
    right: 40, 
    zIndex: 100,
    backgroundColor: COLORS.surface, 
    padding: 15, 
    borderRadius: 50, 
    elevation: 5,
    shadowColor: "#000",
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
    fontSize: isMobile ? 32 : 48,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  kioskSubtitle: {
    fontSize: isMobile ? 18 : 24,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  kioskActions: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 30,
    width: isMobile ? '100%' : 'auto',
  },
  kioskBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 250,
  },
  kioskBtnSecondary: {
    backgroundColor: COLORS.surface,
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    minWidth: 250,
  },
  kioskBtnText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  kioskBtnTextSecondary: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  kioskLogout: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Dashboard Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: isMobile ? 24 : 32,
    color: COLORS.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitleHeader: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 50,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 20,
  },
  actionCard: {
    width: isMobile ? '100%' : '32%',
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  
  // Appointment Card
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walkInCard: {
    borderLeftColor: COLORS.success,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  clientName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  timeTagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detail: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  typeTagContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceHighlight,
  },
  typeTag: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal & Notifications
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  notificationModal: {
    width: isMobile ? '90%' : '50%', 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    padding: 20, 
    maxHeight: '80%',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  notificationHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20
  },
  notificationTitle: {
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.primary
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  notificationItem: {
    backgroundColor: COLORS.background,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    elevation: 3
  },
  notifItemHeader: {
    backgroundColor: COLORS.primary, 
    paddingVertical: 10, 
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  notifItemTitle: {
    color: COLORS.white, 
    fontWeight: 'bold', 
    fontSize: 16
  },
  notifTime: {
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12
  },
  notifBody: {
    padding: 15
  },
  notifRow: {
    flexDirection: 'row', 
    marginBottom: 8
  },
  notifLabel: {
    width: 80, 
    color: COLORS.textSecondary, 
    fontWeight: 'bold'
  },
  notifValue: {
    color: COLORS.text, 
    flex: 1,
    fontSize: 14,
  },
  markReadBtn: {
    marginTop: 20, 
    backgroundColor: COLORS.primary, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center'
  },
  markReadText: {
    color: COLORS.white, 
    fontWeight: 'bold'
  },
  badgeContainer: {
    position: 'absolute', top: 0, right: 0, 
    backgroundColor: COLORS.error, borderRadius: 15, 
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background
  },
  badgeText: {
    color: 'white', fontSize: 14, fontWeight: 'bold'
  },
  smallBadge: {
    position: 'absolute', top: -5, right: -5, 
    backgroundColor: COLORS.error, borderRadius: 10, 
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
  },
  smallBadgeText: {
    color: 'white', fontSize: 10, fontWeight: 'bold'
  }
});
