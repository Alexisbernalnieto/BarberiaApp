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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Tabs */}
        <View style={styles.tabContainer}>
            <TabButton 
                title="Nueva Reserva" 
                isActive={activeTab === 'book'} 
                onPress={() => setActiveTab('book')} 
            />
            <TabButton 
                title={`Mis Citas (${myAppointments.length})`} 
                isActive={activeTab === 'appointments'} 
                onPress={() => setActiveTab('appointments')} 
            />
        </View>

        {/* Content Area */}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.inactiveTabBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeTabButton: {
    backgroundColor: COLORS.activeTabBg,
  },
  tabText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
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
