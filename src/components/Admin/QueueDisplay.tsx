import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

export default function QueueDisplay({ appointments, onClose, COLORS }: any) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768; // For TV it will be false, but good to have fallback
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const styles = useMemo(() => getStyles(COLORS, isMobile, width, height), [COLORS, isMobile, width, height]);

  // Filter and process appointments
  const { currentApp, upcomingApps } = useMemo(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Get valid today appointments
    let todayApps = appointments.filter((app: any) => 
      app.date === todayStr && 
      app.status !== 'cancelled' && 
      app.status !== 'completed'
    );

    // Sort by time
    todayApps.sort((a: any, b: any) => a.time.localeCompare(b.time));

    // Determine current app (Prioritize 'En Local', otherwise the first one)
    let current = todayApps.find((app: any) => app.status === 'En Local');
    if (!current && todayApps.length > 0) {
      current = todayApps[0];
    }

    // Filter out the current from the upcoming
    const upcoming = current 
        ? todayApps.filter((app: any) => app.id !== current.id) 
        : todayApps;

    return { currentApp: current, upcomingApps: upcoming };
  }, [appointments, currentTime.getMinutes()]); // Update slightly when minute changes, just in case

  const timeString = formatTime12h(`${currentTime.getHours()}:${currentTime.getMinutes()}`);
  const dateStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
  const dateString = formatFullDate(dateStr).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Top Header / Clock */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
                <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={styles.brandTitle}>EL CORONEL</Text>
        </View>
        <View style={styles.headerRight}>
            <Text style={styles.dateText}>{dateString}</Text>
            <Text style={styles.clockText}>{timeString}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
          {/* LEFT SIDE: CURRENT APPOINTMENT */}
          <View style={styles.leftPanel}>
              <View style={styles.currentCard}>
                  <Text style={styles.currentLabel}>TURNO ACTUAL</Text>
                  
                  {currentApp ? (
                      <View style={styles.currentDetails}>
                          <Text style={styles.currentClientName} numberOfLines={2} adjustsFontSizeToFit>
                              {currentApp.userName || 'Cliente Web'}
                          </Text>
                          
                          <View style={styles.serviceBox}>
                              <Text style={styles.currentService}>{currentApp.serviceName}</Text>
                          </View>

                          <View style={styles.barberRow}>
                              <Text style={styles.barberLabel}>BARBERO:</Text>
                              <Text style={styles.currentBarber}>{currentApp.barberName || 'Sin asignar'}</Text>
                          </View>

                          <View style={styles.timeBadgeContainer}>
                              <Text style={styles.timeBadgeText}>{formatTime12h(currentApp.time)}</Text>
                          </View>
                      </View>
                  ) : (
                      <View style={styles.emptyCurrent}>
                          <Text style={styles.emptyCurrentText}>NO HAY TURNOS EN FILA</Text>
                      </View>
                  )}
              </View>
          </View>

          {/* RIGHT SIDE: UPCOMING APPOINTMENTS */}
          <View style={styles.rightPanel}>
              <View style={styles.upcomingHeader}>
                  <Text style={styles.upcomingTitle}>PRÓXIMOS TURNOS</Text>
              </View>
              
              {upcomingApps.length > 0 ? (
                  <FlatList
                      data={upcomingApps.slice(0, 5)} // Show only next 5
                      keyExtractor={item => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 20, gap: 15 }}
                      renderItem={({ item, index }) => (
                          <View style={styles.upcomingRow}>
                              <View style={styles.upcomingIndexBox}>
                                  <Text style={styles.upcomingIndex}>{index + 1}</Text>
                              </View>
                              <View style={styles.upcomingInfo}>
                                  <Text style={styles.upcomingName} numberOfLines={1}>{item.userName || 'Cliente'}</Text>
                                  <Text style={styles.upcomingService} numberOfLines={1}>{item.serviceName} • {item.barberName}</Text>
                              </View>
                              <Text style={styles.upcomingTime}>{formatTime12h(item.time)}</Text>
                          </View>
                      )}
                  />
              ) : (
                  <View style={styles.emptyUpcoming}>
                      <Text style={styles.emptyUpcomingText}>Sin citas próximas</Text>
                  </View>
              )}
          </View>
      </View>

      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Cerrar Fila Virtual</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (COLORS: any, isMobile: boolean, width: number, height: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Deep black for TV
    padding: isMobile ? 15 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)', // Gold transparent
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D4AF37', // Gold
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoText: {
    color: '#D4AF37',
    fontSize: 28,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#AAA',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  clockText: {
    color: '#D4AF37',
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  mainContent: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    gap: 40,
  },
  leftPanel: {
    flex: 6, // 60% approx
  },
  rightPanel: {
    flex: 4, // 40% approx
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#222',
  },
  currentCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 50,
    borderWidth: 4,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 40px rgba(212, 175, 55, 0.15)',
      },
      default: {
        elevation: 10,
      }
    })
  },
  currentLabel: {
    color: '#D4AF37',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 30,
  },
  currentDetails: {
    alignItems: 'center',
    width: '100%',
  },
  currentClientName: {
    color: '#FFF',
    fontSize: 90,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 100,
  },
  serviceBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 40,
  },
  currentService: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 15,
  },
  barberLabel: {
    color: '#888',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  currentBarber: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
  },
  timeBadgeContainer: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 50,
  },
  timeBadgeText: {
    color: '#000',
    fontSize: 48,
    fontWeight: '900',
  },
  emptyCurrent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCurrentText: {
    color: '#444',
    fontSize: 48,
    fontWeight: 'bold',
  },
  // Upcoming Panel
  upcomingHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 20,
    marginBottom: 30,
  },
  upcomingTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  upcomingIndexBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  upcomingIndex: {
    color: '#AAA',
    fontSize: 24,
    fontWeight: 'bold',
  },
  upcomingInfo: {
    flex: 1,
    marginRight: 20,
  },
  upcomingName: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 5,
  },
  upcomingService: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  upcomingTime: {
    color: '#D4AF37',
    fontSize: 32,
    fontWeight: '900',
  },
  emptyUpcoming: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyUpcomingText: {
    color: '#555',
    fontSize: 24,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    backgroundColor: 'rgba(255,0,0,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
