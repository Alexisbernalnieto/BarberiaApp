import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Platform, useWindowDimensions, Animated, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingWizard from './Booking/BookingWizard';

export default function UserDashboard({ user, appointments, onLogout, onAddAppointment, COLORS, toggleTheme, isDarkMode, barbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  // Fade In Animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Responsive Grid Config
  const containerPadding = isMobile ? 20 : 40; 
  const gap = 24;
  const numColumns = width > 1200 ? 3 : width > 800 ? 2 : 1; 
  const itemWidth = (width - containerPadding * 2 - ((numColumns - 1) * gap)) / numColumns;

  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments'
  
  const styles = useMemo(() => getStyles(COLORS, isMobile, isTablet), [COLORS, isMobile, isTablet]);

  // Filter and sort appointments
  const myAppointments = useMemo(() => {
    return appointments
      .filter(app => app.userId === user.email)
      .sort((a, b) => {
         // Simple string comparison for date/time ISO strings or similar formats
         if (a.date !== b.date) return a.date > b.date ? 1 : -1;
         return a.time > b.time ? 1 : -1;
      });
  }, [appointments, user.email]);

  const nextAppointment = myAppointments.length > 0 ? myAppointments[0] : null; 

  const handleNewBooking = (data) => {
    onAddAppointment(data);
    setActiveTab('appointments'); // Go to appointments after booking
  };

  const renderAppointmentItem = ({ item }) => (
    <View style={[styles.card, { width: itemWidth }]}>
        <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <View style={styles.rowCenter}>
                   <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.primary} />
                   <Text style={styles.barberName}> {item.barberName}</Text>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}>
                <Text style={[styles.statusText, { color: COLORS.primary }]}>{item.status || 'Confirmado'}</Text>
            </View>
        </View>
        
        <View style={styles.cardBody}>
            <View style={styles.detailRow}>
                <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
                    <Text style={styles.detailLabel}>Fecha</Text>
                </View>
                <Text style={styles.detailValue}>{item.date}</Text>
            </View>
            <View style={styles.detailRow}>
                <View style={styles.rowCenter}>
                     <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
                    <Text style={styles.detailLabel}>Hora</Text>
                </View>
                <Text style={styles.detailValue}>{item.time}</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.detailLabelTotal}>Total</Text>
                <Text style={styles.priceValue}>${item.price}</Text>
            </View>
        </View>
    </View>
  );

  const renderAppointments = () => (
    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
      {myAppointments.length === 0 ? (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin Citas Programadas</Text>
            <Text style={styles.emptyText}>Agenda tu próxima visita para lucir impecable.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => setActiveTab('book')}>
                <Text style={styles.ctaButtonText}>RESERVAR AHORA</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" style={{marginLeft: 8}} />
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
            key={`grid-${numColumns}`}
            data={myAppointments}
            numColumns={numColumns}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 100, gap: gap }}
            columnWrapperStyle={numColumns > 1 ? { gap: gap } : undefined}
            renderItem={renderAppointmentItem}
            showsVerticalScrollIndicator={false}
        />
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenido,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
              <MaterialCommunityIcons name={isDarkMode ? "white-balance-sunny" : "weather-night"} size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <MaterialCommunityIcons name="logout" size={18} color={COLORS.error} />
              {!isMobile && <Text style={styles.logoutText}>CERRAR SESIÓN</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* DASHBOARD SUMMARY (Desktop: Row, Mobile: Column) */}
        <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow: 1}}>
            <View style={styles.dashboardSummary}>
            
            {/* NEXT APPOINTMENT CARD */}
            <View style={styles.heroCardContainer}>
                <Text style={styles.sectionTitle}>TU PRÓXIMA VISITA</Text>
                <View style={styles.heroCard}>
                {nextAppointment ? (
                    <>
                    <View style={styles.heroHeader}>
                        <View>
                            <Text style={styles.heroService}>{nextAppointment.serviceName}</Text>
                            <View style={styles.rowCenter}>
                                <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
                                <Text style={styles.heroBarber}>{nextAppointment.barberName}</Text>
                            </View>
                        </View>
                        <View style={styles.heroPriceBadge}>
                             <Text style={styles.heroPrice}>${nextAppointment.price}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.heroDivider} />
                    
                    <View style={styles.heroFooter}>
                        <View style={styles.heroInfoItem}>
                        <Text style={styles.heroInfoLabel}>FECHA</Text>
                        <View style={styles.rowCenter}>
                            <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                            <Text style={styles.heroInfoValue}>{nextAppointment.date}</Text>
                        </View>
                        </View>
                        <View style={styles.heroInfoSeparator} />
                        <View style={styles.heroInfoItem}>
                        <Text style={styles.heroInfoLabel}>HORA</Text>
                        <View style={styles.rowCenter}>
                            <MaterialCommunityIcons name="clock-time-four" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                            <Text style={styles.heroInfoValue}>{nextAppointment.time}</Text>
                        </View>
                        </View>
                    </View>
                    </>
                ) : (
                    <View style={styles.heroEmpty}>
                        <View style={styles.heroEmptyIconBg}>
                            <MaterialCommunityIcons name="calendar-clock" size={32} color={COLORS.primary} />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.heroEmptyTitle}>Sin reservas activas</Text>
                            <Text style={styles.heroEmptyText}>¿Listo para un nuevo look?</Text>
                        </View>
                        <TouchableOpacity onPress={() => setActiveTab('book')} style={styles.heroBookBtn}>
                            <Text style={styles.heroBookBtnText}>Reservar</Text>
                        </TouchableOpacity>
                    </View>
                )}
                </View>
            </View>

            {/* QUICK ACTIONS */}
            <View style={styles.actionsContainer}>
                <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
                <View style={styles.actionButtonsWrapper}>
                    <TouchableOpacity 
                    style={[styles.actionCard, activeTab === 'book' && styles.actionCardActive]} 
                    onPress={() => setActiveTab('book')}
                    >
                    <View style={[styles.actionIconCircle, activeTab === 'book' && styles.actionIconCircleActive]}>
                        <MaterialCommunityIcons 
                            name="chair-rolling" 
                            size={24} 
                            color={activeTab === 'book' ? COLORS.primary : COLORS.text} 
                        />
                    </View>
                    <View>
                        <Text style={[styles.actionCardTitle, activeTab === 'book' && styles.actionTextActive]}>Nueva Reserva</Text>
                        <Text style={[styles.actionCardDesc, activeTab === 'book' && styles.actionTextActive]}>Agenda tu corte</Text>
                    </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                    style={[styles.actionCard, activeTab === 'appointments' && styles.actionCardActive]} 
                    onPress={() => setActiveTab('appointments')}
                    >
                    <View style={[styles.actionIconCircle, activeTab === 'appointments' && styles.actionIconCircleActive]}>
                        <MaterialCommunityIcons 
                            name="calendar-multiselect" 
                            size={24} 
                            color={activeTab === 'appointments' ? COLORS.primary : COLORS.text} 
                        />
                    </View>
                    <View>
                        <Text style={[styles.actionCardTitle, activeTab === 'appointments' && styles.actionTextActive]}>Mis Citas</Text>
                        <Text style={[styles.actionCardDesc, activeTab === 'appointments' && styles.actionTextActive]}>Ver historial</Text>
                    </View>
                    </TouchableOpacity>
                </View>
            </View>
            </View>

            {/* MAIN CONTENT AREA */}
            <View style={styles.mainContent}>
                <View style={styles.contentHeader}>
                    <Text style={styles.contentTitle}>
                        {activeTab === 'book' ? 'Reservar Cita' : 'Historial de Citas'}
                    </Text>
                    <View style={styles.contentDivider} />
                </View>

                {activeTab === 'book' ? (
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
                    renderAppointments()
                )}
            </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isMobile, isTablet) => StyleSheet.create({
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
  rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 20 : 40,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...COLORS.shadows.light,
    zIndex: 10,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  userName: {
    color: COLORS.primary, // Gold text for name
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceHighlight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.error + '15', // Transparent error
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: 20,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 8,
  },
  
  // DASHBOARD SUMMARY
  dashboardSummary: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: isMobile ? 20 : 40,
    gap: isMobile ? 24 : 32,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  
  // HERO CARD
  heroCardContainer: {
    flex: isMobile ? undefined : 1.2,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...COLORS.shadows.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroService: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroPriceBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  heroPrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  heroBarber: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  heroDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfoItem: {
    flex: 1,
  },
  heroInfoLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroInfoValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  heroInfoSeparator: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
  },
  heroEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroEmptyIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmptyTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  heroBookBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  heroBookBtnText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // ACTIONS
  actionsContainer: {
    flex: isMobile ? undefined : 1.8,
  },
  actionButtonsWrapper: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
    ...COLORS.shadows.light,
    ...Platform.select({
        web: { cursor: 'pointer', transition: '0.2s' },
    }),
  },
  actionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface, // Keep surface bg but highlight border/text
    ...COLORS.shadows.medium,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconCircleActive: {
    backgroundColor: COLORS.primary + '20', // Light gold bg
  },
  actionCardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actionCardDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  actionTextActive: {
    color: COLORS.primary,
  },

  // MAIN CONTENT
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
    paddingHorizontal: isMobile ? 0 : 40, 
    paddingBottom: 40,
  },

  // APPOINTMENTS LIST
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.surfaceHighlight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 300,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    ...COLORS.shadows.medium,
  },
  ctaButtonText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 14,
  },

  // CARD ITEM (Ticket Style)
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...COLORS.shadows.light,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: COLORS.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  barberName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderStyle: 'dashed',
  },
  detailLabelTotal: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
