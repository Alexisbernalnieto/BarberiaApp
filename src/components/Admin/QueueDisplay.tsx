import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { formatFullDate, formatTime12h, getLocalTodayString } from '../../utils/formatters';
import { Appointment } from '../../types';
import { MapPin, Users, Clock, Info } from 'lucide-react';

interface QueueDisplayProps {
  appointments: Appointment[];
  onClose: () => void;
  COLORS: any;
}

export default function QueueDisplay({ appointments, onClose, COLORS }: QueueDisplayProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<'Lomas' | 'Centro'>('Lomas');

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Group and process appointments
  const groupedBarbers = useMemo(() => {
    const todayStr = getLocalTodayString();
    
    // 1. Filter by today, branch, and active status
    const branchApps = appointments.filter((app: any) => 
      (app.branch === selectedBranch || app.branchId === selectedBranch) &&
      app.date === todayStr && 
      app.status !== 'cancelled' && 
      app.status !== 'completed' &&
      app.status !== 'no_show'
    );

    // 2. Sort all by time
    branchApps.sort((a, b) => a.time.localeCompare(b.time));

    // 3. Group by barber
    const barbers: Record<string, { name: string, apps: Appointment[] }> = {};
    branchApps.forEach(app => {
      const bId = String(app.barberId);
      if (!barbers[bId]) {
        barbers[bId] = { name: app.barberName, apps: [] };
      }
      barbers[bId].apps.push(app);
    });

    // 4. Process exactly 3 slots per barber
    return Object.entries(barbers).map(([id, data]) => {
      const allApps = data.apps;
      
      // Determine "Current" slot (checked_in or in_progress first)
      let currentIdx = allApps.findIndex(a => a.status === 'in_progress' || a.status === 'checked_in');
      if (currentIdx === -1) currentIdx = 0; // If none active, show the earliest one as current

      const slots = [
        allApps[currentIdx] || null,
        allApps[currentIdx + 1] || null,
        allApps[currentIdx + 2] || null
      ];

      return {
        id,
        name: data.name,
        slots
      };
    });
  }, [appointments, selectedBranch]);

  const colWidth = useMemo(() => {
    const count = groupedBarbers.length;
    const containerPadding = 30 * 2; // container padding both sides
    const availableWidth = width - containerPadding;
    const gap = 20;
    
    if (count === 0) return 0;
    if (count === 1) return Math.min(availableWidth * 0.55, 650);
    if (count === 2) return (availableWidth - gap) / 2;
    if (count === 3) return (availableWidth - (gap * 2)) / 3;
    return 380; // Fixed for 4+ scrollable
  }, [groupedBarbers.length, width]);

  const styles = useMemo(() => getStyles(COLORS, isMobile, width, height, colWidth), [COLORS, isMobile, width, height, colWidth]);

  const timeString = formatTime12h(currentTime);
  const dateString = formatFullDate(getLocalTodayString()).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
                <Text style={styles.logoText}>B</Text>
            </View>
            <View>
                <Text style={styles.brandTitle}>EL CORONEL BARBÓN</Text>
                <Text style={styles.brandSubtitle}>PELUQUERÍA Y BARBERÍA DE ALTO NIVEL</Text>
            </View>
        </View>

        {/* Branch Toggle */}
        <View style={styles.branchController}>
            <TouchableOpacity 
                onPress={() => setSelectedBranch('Lomas')}
                style={[styles.branchTab, selectedBranch === 'Lomas' && styles.branchTabActive]}
            >
                <MapPin size={16} color={selectedBranch === 'Lomas' ? '#000' : '#888'} />
                <Text style={[styles.branchTabText, selectedBranch === 'Lomas' && styles.branchTabTextActive]}>LOMAS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => setSelectedBranch('Centro')}
                style={[styles.branchTab, selectedBranch === 'Centro' && styles.branchTabActive]}
            >
                <MapPin size={16} color={selectedBranch === 'Centro' ? '#000' : '#888'} />
                <Text style={[styles.branchTabText, selectedBranch === 'Centro' && styles.branchTabTextActive]}>CENTRO</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
            <Text style={styles.dateText}>{dateString}</Text>
            <Text style={styles.clockText}>{timeString}</Text>
        </View>
      </View>

      {/* Main Grid Content */}
      <View style={styles.mainContent}>
          {groupedBarbers.length > 0 ? (
              <View style={[
                  styles.barberGrid,
                  groupedBarbers.length <= 3 && { justifyContent: 'center' }
                ]}
              >
                {groupedBarbers.map((barber) => (
                    <View key={barber.id} style={styles.barberColumn}>
                        {/* Barber Name Header */}
                        <View style={styles.barberHeader}>
                            <Users size={24} color="#D4AF37" />
                            <Text style={styles.barberName}>{barber.name.toUpperCase()}</Text>
                        </View>

                        {/* 3 Slots */}
                        <View style={styles.slotsContainer}>
                            {barber.slots.map((app, index) => (
                                <View 
                                    key={index} 
                                    style={[
                                        styles.slotCard, 
                                        index === 0 ? styles.currentSlot : styles.upcomingSlot,
                                        !app && styles.emptySlot
                                    ]}
                                >
                                    {index === 0 && (
                                        <View style={styles.currentIndicator}>
                                            <View style={styles.pulseDot} />
                                            <Text style={styles.currentIndicatorText}>TURNO ACTUAL</Text>
                                        </View>
                                    )}

                                    {app ? (
                                        <View style={styles.slotDetails}>
                                            <Text style={[
                                                styles.clientName, 
                                                index === 0 ? styles.clientNameLG : styles.clientNameSM
                                            ]}>
                                                {app.userName || 'Cliente'}
                                            </Text>
                                            {app.id && (
                                                <Text style={[
                                                    styles.idLabel,
                                                    index === 0 ? styles.idLabelLG : styles.idLabelSM
                                                ]}>
                                                    ID: {app.id}
                                                </Text>
                                            )}
                                            <View style={styles.timeRow}>
                                                <Clock size={index === 0 ? 20 : 14} color="#D4AF37" />
                                                <Text style={[
                                                    styles.timeText,
                                                    index === 0 ? styles.timeTextLG : styles.timeTextSM
                                                ]}>
                                                    {formatTime12h(app.time)}
                                                </Text>
                                            </View>
                                            {app.status === 'checked_in' && index === 0 && (
                                                <View style={styles.statusPill}>
                                                    <Text style={styles.statusPillText}>EN LOCAL</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.emptySlotContent}>
                                            <Info size={32} color="rgba(255,255,255,0.05)" />
                                            <Text style={styles.emptySlotText}>DISPONIBLE</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
              </View>
          ) : (
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>NO HAY CITAS PROGRAMADAS</Text>
                  <Text style={styles.emptySubtitle}>Selecciona otra sucursal o espera a que se registren nuevas citas.</Text>
              </View>
          )}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Cerrar Fila Virtual</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (COLORS: any, isMobile: boolean, width: number, height: number, colWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505', // True black for high contrast TV
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  logoText: {
    color: '#D4AF37',
    fontSize: 32,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: { 
    color: '#D4AF37', 
    fontSize: 10, 
    letterSpacing: 3, 
    fontWeight: '700', 
    marginTop: 4 
  },
  branchController: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  branchTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  branchTabActive: {
    backgroundColor: '#D4AF37',
  },
  branchTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  branchTabTextActive: {
    color: '#000',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  clockText: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  mainContent: {
    flex: 1,
  },
  barberGrid: {
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },
  barberColumn: {
    width: colWidth,
    flexShrink: 0,
  },
  barberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 20,
    gap: 12,
  },
  barberName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  slotsContainer: {
    flex: 1,
    gap: 20,
  },
  slotCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  currentSlot: {
    flex: 1.6,
    backgroundColor: '#111',
    borderColor: '#D4AF37',
    borderWidth: 2,
    // Add a subtle glow for current turn
    shadowColor: '#D4AF37',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  upcomingSlot: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptySlot: {
    opacity: 0.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  currentIndicator: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    opacity: 0.8,
  },
  currentIndicatorText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  slotDetails: {
    gap: 12,
  },
  clientName: {
    color: '#FFF',
    fontWeight: '900',
  },
  clientNameLG: {
    fontSize: 36,
  },
  clientNameSM: {
    fontSize: 24,
  },
  serviceRow: {
    marginBottom: 4,
  },
  serviceText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  idLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: -4,
  },
  idLabelLG: {
    fontSize: 16,
  },
  idLabelSM: {
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#D4AF37',
    fontWeight: '900',
  },
  timeTextLG: {
    fontSize: 32,
  },
  timeTextSM: {
    fontSize: 20,
  },
  statusPill: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
  },
  emptySlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptySlotText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  emptyTitle: {
    color: '#333',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptySubtitle: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  closeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  }
});
