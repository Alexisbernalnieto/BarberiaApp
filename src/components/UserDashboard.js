import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Platform, useWindowDimensions } from 'react-native';
import BookingWizard from './Booking/BookingWizard';

export default function UserDashboard({ user, appointments, onLogout, onAddAppointment, COLORS, toggleTheme, isDarkMode }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Responsive Grid Config
  const containerPadding = 40; 
  const gap = 20;
  // Use fewer columns for appointments as they need more horizontal space for details
  const numColumns = width > 1400 ? 3 : width > 900 ? 2 : 1; 
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments'
  
  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

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
            key={`grid-${numColumns}`}
            data={myAppointments}
            numColumns={numColumns}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 100, gap: 20 }}
            columnWrapperStyle={numColumns > 1 ? { gap: 20 } : undefined}
            renderItem={({ item }) => (
            <View style={[styles.card, { width: itemWidth, marginBottom: 0 }]}>
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
              <Text style={{fontSize: 20}}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.summarySection, !isMobile && { flexDirection: 'row', gap: 20, alignItems: 'flex-start' }]}>
          <View style={[styles.nextCard, !isMobile && { flex: 1, marginBottom: 0 }]}>
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

          <View style={[styles.quickActions, !isMobile && { flex: 1, marginTop: 0 }]}>
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
                    COLORS={COLORS}
                />
            ) : (
                renderAppointments()
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    minHeight: '100%', // Fix for web
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
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  nextCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  nextTitle: {
    color: COLORS.primary,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextPrice: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  nextBarber: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  branchNameSmall: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  nextInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.primary + '40', // 25% opacity (approx '40' hex) - Increased from 0.1
    padding: 8,
    borderRadius: 4,
  },
  nextInfoText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  nextInfoDot: {
    color: COLORS.primary,
    marginHorizontal: 8,
  },
  nextStatus: {
    color: COLORS.accent, // Using accent for status
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 'auto',
  },
  nextEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
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
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickActionTextActive: {
    color: '#FFF', // White text on Military Green background
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
    color: '#FFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Increased opacity for "franjas" visibility
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  barberName: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  branchName: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // Gold accent alpha
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  statusText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: '500',
  },
  priceValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
