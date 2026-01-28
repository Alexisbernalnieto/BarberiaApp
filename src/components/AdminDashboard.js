import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, useWindowDimensions, ScrollView } from 'react-native';
import { db } from '../firebaseClient';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import QueueDisplay from './Admin/QueueDisplay';
import FinancialReport from './Admin/FinancialReport';
import BarberManagement from './Admin/BarberManagement';
import ServiceManagement from './Admin/ServiceManagement';
import BookingWizard from './Booking/BookingWizard';

export default function AdminDashboard({ appointments, onLogout, onAddAppointment, role = 'admin', COLORS, toggleTheme, isDarkMode }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Notification Logic
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const q = query(
        collection(db, 'notifications'),
        where('targetRoles', 'array-contains', role),
        orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const myId = role; // 'admin' or 'reception'
        const notifs = snapshot.docs.map(d => ({id: d.id, ...d.data()}))
            .filter(n => !n.readBy || !n.readBy.includes(myId));
        setNotifications(notifs);
    });
    
    return () => unsubscribe();
  }, [role]);

  const handleMarkAsRead = async () => {
      const myId = role;
      const batch = writeBatch(db);
      notifications.forEach(n => {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { readBy: arrayUnion(myId) });
      });
      try {
          await batch.commit();
          setShowNotifications(false);
      } catch (e) { console.error(e); }
  };

  // Responsive Grid Config
  const containerPadding = 40; 
  const gap = 20;
  const numColumns = width > 1400 ? 3 : width > 900 ? 2 : 1; 
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, queue, finance, walkin, barbers, services

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

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
                style={{
                    position: 'absolute', top: 40, right: 40, zIndex: 100,
                    backgroundColor: COLORS.surface, padding: 15, borderRadius: 50, elevation: 5
                }}
            >
                <Text style={{fontSize: 30}}>🔔</Text>
                {notifications.length > 0 && (
                    <View style={{
                        position: 'absolute', top: 0, right: 0, 
                        backgroundColor: COLORS.error, borderRadius: 15, 
                        width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background
                    }}>
                        <Text style={{color: 'white', fontSize: 14, fontWeight: 'bold'}}>{notifications.length}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.kioskHeader}>
                <Text style={styles.kioskTitle}>Bienvenido a Barbería</Text>
                <Text style={styles.kioskSubtitle}>Regístrate o mira tu turno</Text>
            </View>

            <View style={styles.kioskActions}>
                <TouchableOpacity style={styles.kioskBtn} onPress={() => setViewMode('walkin')}>
                    <Text style={styles.kioskBtnIcon}>📅</Text>
                    <Text style={styles.kioskBtnText}>Registrar Cita</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.kioskBtnSecondary} onPress={() => setViewMode('queue')}>
                    <Text style={styles.kioskBtnIcon}>📺</Text>
                    <Text style={styles.kioskBtnTextSecondary}>Ver Turnos</Text>
                </TouchableOpacity>
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
                />
            </Modal>

            <Modal visible={viewMode === 'queue'} animationType="slide">
                <View style={{flex:1, backgroundColor: COLORS.background}}>
                    <QueueDisplay appointments={appointments} onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
                </View>
            </Modal>
            
            <TouchableOpacity onPress={onLogout} style={styles.kioskLogout}>
                <Text style={{color: COLORS.textSecondary}}>Salir (Admin)</Text>
            </TouchableOpacity>
        </View>
      );
  }

  const renderDashboard = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Barbería</Text>
          <Text style={styles.subtitleHeader}>
            Panel Administrador
          </Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.themeBtn}>
                <Text style={{fontSize: 20}}>🔔</Text>
                {notifications.length > 0 && (
                    <View style={{
                        position: 'absolute', top: -5, right: -5, 
                        backgroundColor: COLORS.error, borderRadius: 10, 
                        width: 20, height: 20, justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>{notifications.length}</Text>
                    </View>
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
              <Text style={{fontSize: 20}}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Ingresos estimados hoy</Text>
          <Text style={styles.metricValue}>${totalToday}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Clientes walk-in</Text>
          <Text style={styles.metricValue}>{totalWalkins}</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        {/* Admin Actions */}
        <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('finance')}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Finanzas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('barbers')}>
            <Text style={styles.actionIcon}>✂️</Text>
            <Text style={styles.actionText}>Barberos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('services')}>
            <Text style={styles.actionIcon}>🏷️</Text>
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
                <Text style={styles.clientName}>{item.userName}</Text>
                <Text style={styles.status}>{item.time}</Text>
            </View>
            <Text style={styles.detail}>{item.date} - {item.barberName}</Text>
            <Text style={styles.detail}>{item.serviceName} - ${item.price}</Text>
            <Text style={styles.typeTag}>{item.type}</Text>
            </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </>
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
        />
      </Modal>

      {/* Modals for Admin */}
      <Modal visible={viewMode === 'finance'} animationType="slide">
        <FinancialReport appointments={appointments} onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
      </Modal>

      <Modal visible={viewMode === 'barbers'} animationType="slide">
        <BarberManagement appointments={appointments} onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
      </Modal>

      <Modal visible={viewMode === 'services'} animationType="slide">
        <ServiceManagement onClose={() => setViewMode('dashboard')} COLORS={COLORS} />
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="fade" transparent={true}>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
            <View style={{
                width: isMobile ? '90%' : '50%', 
                backgroundColor: COLORS.surface, 
                borderRadius: 20, 
                padding: 20, 
                maxHeight: '80%',
                elevation: 10
            }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                    <Text style={{fontSize: 24, fontWeight: 'bold', color: COLORS.primary}}>Notificaciones</Text>
                    <TouchableOpacity onPress={() => setShowNotifications(false)}>
                        <Text style={{fontSize: 24, color: COLORS.text}}>✕</Text>
                    </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                    <Text style={{textAlign: 'center', color: COLORS.textSecondary, padding: 20}}>No tienes nuevas notificaciones</Text>
                ) : (
                    <ScrollView>
                        {notifications.map(notif => (
                            <View key={notif.id} style={{
                                backgroundColor: COLORS.background,
                                marginBottom: 15,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                overflow: 'hidden',
                                elevation: 3
                            }}>
                                {/* Card Header */}
                                <View style={{
                                    backgroundColor: COLORS.primary, 
                                    paddingVertical: 8, 
                                    paddingHorizontal: 15,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Text style={{color: COLORS.white, fontWeight: 'bold', fontSize: 16}}>
                                        Nueva Cita Agendada
                                    </Text>
                                    <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12}}>
                                        {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                </View>

                                {/* Card Body */}
                                <View style={{padding: 15}}>
                                    <View style={{flexDirection: 'row', marginBottom: 8}}>
                                        <Text style={{width: 80, color: COLORS.textSecondary, fontWeight: 'bold'}}>Cliente:</Text>
                                        <Text style={{color: COLORS.text, fontWeight: 'bold', fontSize: 16}}>{notif.clientName || notif.message}</Text>
                                    </View>
                                    
                                    <View style={{flexDirection: 'row', marginBottom: 8}}>
                                        <Text style={{width: 80, color: COLORS.textSecondary, fontWeight: 'bold'}}>Servicio:</Text>
                                        <Text style={{color: COLORS.text, flex: 1}}>{notif.service}</Text>
                                    </View>

                                    <View style={{flexDirection: 'row', marginBottom: 8}}>
                                        <Text style={{width: 80, color: COLORS.textSecondary, fontWeight: 'bold'}}>Fecha:</Text>
                                        <Text style={{color: COLORS.text, flex: 1}}>
                                            {notif.dateDisplay || notif.subtext} - {notif.time}
                                        </Text>
                                    </View>

                                    <View style={{flexDirection: 'row', marginBottom: 8}}>
                                        <Text style={{width: 80, color: COLORS.textSecondary, fontWeight: 'bold'}}>Sucursal:</Text>
                                        <Text style={{color: COLORS.text, flex: 1}}>{notif.branch}</Text>
                                    </View>

                                    <View style={{flexDirection: 'row'}}>
                                        <Text style={{width: 80, color: COLORS.textSecondary, fontWeight: 'bold'}}>Barbero:</Text>
                                        <Text style={{color: COLORS.primary, fontWeight: 'bold', flex: 1}}>{notif.barber}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {notifications.length > 0 && (
                    <TouchableOpacity 
                        onPress={handleMarkAsRead}
                        style={{
                            marginTop: 20, 
                            backgroundColor: COLORS.primary, 
                            padding: 15, 
                            borderRadius: 10, 
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{color: COLORS.white, fontWeight: 'bold'}}>Marcar todo como leído</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  subtitleHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  themeBtn: {
    padding: 8,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 8,
  },
  logoutText: {
    color: COLORS.text,
  },
  metricRow: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  actionCard: {
    width: isMobile ? '100%' : '31%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 5,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  walkInCard: {
    borderLeftColor: '#2ecc71',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  clientName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  detail: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  typeTag: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
    textTransform: 'uppercase',
  },
  actionCardWide: {
    width: '48%',
  },
  // Kiosk Styles
  kioskContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: isMobile ? 20 : 40,
    minHeight: '100%',
  },
  kioskHeader: {
    alignItems: 'center',
    marginBottom: isMobile ? 30 : 60,
  },
  kioskTitle: {
    color: COLORS.primary,
    fontSize: isMobile ? 32 : 48,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  kioskSubtitle: {
    color: COLORS.text,
    fontSize: 24,
    textAlign: 'center',
  },
  kioskActions: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 50,
    width: '100%',
  },
  kioskBtn: {
    backgroundColor: COLORS.primary,
    padding: isMobile ? 20 : 40,
    borderRadius: 20,
    alignItems: 'center',
    width: isMobile ? '100%' : 300,
    maxWidth: 400,
    elevation: 5,
  },
  kioskBtnSecondary: {
    backgroundColor: COLORS.surface,
    padding: isMobile ? 20 : 40,
    borderRadius: 20,
    alignItems: 'center',
    width: isMobile ? '100%' : 300,
    maxWidth: 400,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  kioskBtnIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  kioskBtnText: {
    color: '#FFF', // White text for contrast on Military Green
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  kioskBtnTextSecondary: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  kioskLogout: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 10,
  }
});
