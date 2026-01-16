import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Platform } from 'react-native';
import BookingWizard from './Booking/BookingWizard';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#222222',
  text: '#ffffff',
  textSecondary: '#888888',
  activeTabBg: '#d4af37',
  inactiveTabBg: '#333333'
};

export default function UserDashboard({ user, appointments, onLogout, onAddAppointment }) {
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments'
  
  // Filtrar solo las citas de este usuario
  const myAppointments = appointments.filter(app => app.userId === user.email);
  const nextAppointment = myAppointments.length > 0 ? myAppointments[0] : null;

  const handleNewBooking = (data) => {
    onAddAppointment(data);
    setActiveTab('appointments'); // Ir a mis citas tras reservar
  };

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.activeTabButton]} 
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const renderAppointments = () => (
    <View style={styles.contentContainer}>
      {myAppointments.length === 0 ? (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No tienes citas programadas aún</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => setActiveTab('book')}>
                <Text style={styles.ctaButtonText}>RESERVAR AHORA</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
            data={myAppointments}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.serviceName}>{item.serviceName}</Text>
                        <Text style={styles.barberName}>con {item.barberName}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha:</Text>
                        <Text style={styles.detailValue}>{item.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hora:</Text>
                        <Text style={styles.detailValue}>{item.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total:</Text>
                        <Text style={styles.priceValue}>${item.price}</Text>
                    </View>
                </View>
            </View>
            )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>Tu próxima cita</Text>
            {nextAppointment ? (
              <View style={styles.nextContent}>
                <View style={styles.nextMainRow}>
                  <Text style={styles.nextService}>{nextAppointment.serviceName}</Text>
                  <Text style={styles.nextPrice}>${nextAppointment.price}</Text>
                </View>
                <Text style={styles.nextBarber}>Con {nextAppointment.barberName}</Text>
                <View style={styles.nextInfoRow}>
                  <Text style={styles.nextInfoText}>{nextAppointment.date}</Text>
                  <Text style={styles.nextInfoDot}>•</Text>
                  <Text style={styles.nextInfoText}>{nextAppointment.time}</Text>
                  <Text style={styles.nextInfoDot}>•</Text>
                  <Text style={styles.nextStatus}>{nextAppointment.status}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.nextEmptyText}>Aún no tienes ninguna reserva activa.</Text>
            )}
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionBtn, activeTab === 'book' && styles.quickActionActive]} 
              onPress={() => setActiveTab('book')}
            >
              <Text style={[styles.quickActionText, activeTab === 'book' && styles.quickActionTextActive]}>
                Nueva reserva
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionBtn, activeTab === 'appointments' && styles.quickActionActive]} 
              onPress={() => setActiveTab('appointments')}
            >
              <Text style={[styles.quickActionText, activeTab === 'appointments' && styles.quickActionTextActive]}>
                Mis citas ({myAppointments.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
            {activeTab === 'book' ? (
                <BookingWizard 
                    user={user} 
                    existingAppointments={appointments} 
                    onConfirm={handleNewBooking}
                />
            ) : (
                renderAppointments()
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  userName: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  nextCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  nextTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextContent: {
    gap: 4,
  },
  nextMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextService: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextPrice: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  nextBarber: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  nextInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  nextInfoText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  nextInfoDot: {
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  nextStatus: {
    color: '#2ecc71',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  nextEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  quickActionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickActionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionTextActive: {
    color: '#000',
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  // Appointments Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  barberName: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statusBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#2ecc71',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 15,
  },
  cardDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontWeight: '500',
  },
  priceValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
