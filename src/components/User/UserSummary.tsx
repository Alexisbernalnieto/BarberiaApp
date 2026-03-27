import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { 
    Calendar, 
    Clock, 
    ChevronRight, 
    Star, 
    Scissors, 
    Smartphone, 
    MapPin, 
    Gift,
    Zap,
    Watch
} from 'lucide-react';
import { Appointment } from '../../types';

interface UserSummaryProps {
  nextAppointment?: Appointment;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  COLORS: any;
  user?: any;
}

export default function UserSummary({ nextAppointment, activeTab, setActiveTab, COLORS, user }: UserSummaryProps) {
  const styles = getStyles(COLORS);
  
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* 1. SECCIÓN DE PRESENTACIÓN (CARTA BIENVENIDA) */}
      <View style={[styles.presentationCard, { 
        backgroundColor: COLORS.cardDark, 
        borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(197, 160, 33, 0.2)', 
        shadowColor: COLORS.mode === 'dark' ? '#000' : '#0F172A',
        shadowOpacity: COLORS.mode === 'dark' ? 0.3 : 0.15
      }]}>
        <View style={styles.glassBackground} />
        
        <View style={styles.cardHeader}>
            <View>
                <Text style={[styles.brandTitle, { color: COLORS.primary }]}>EL CORONEL</Text>
                <Text style={[styles.brandSubtitle, { color: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.8)' : 'rgba(197, 160, 33, 0.7)' }]}>EXECUTIVE BARBER SHOP</Text>
            </View>
            <Scissors size={28} color={COLORS.primary} />
        </View>

        <View style={styles.middleSection}>
            <Text style={[styles.slogan, { color: 'rgba(255,255,255,0.9)' }]}>"Donde la tradición se encuentra con la distinción"</Text>
            <View style={styles.scheduleRow}>
                <Clock size={12} color={COLORS.primary} />
                <Text style={[styles.scheduleText, { color: 'rgba(255,255,255,0.5)' }]}>Lun-Sáb: 10am-8pm | Dom: 10am-3pm</Text>
            </View>
        </View>
        
        <View style={styles.cardFooter}>
            <View>
                <Text style={[styles.userName, { color: '#FFFFFF' }]}>{user?.name?.toUpperCase() || 'CLIENTE DISTINGUIDO'}</Text>
                <Text style={[styles.memberId, { color: 'rgba(255,255,255,0.5)' }]}>ID: #COR-{user?.uid?.substring(0, 6).toUpperCase() || 'XXXX'}</Text>
            </View>
            <View style={[styles.eliteBadge, { backgroundColor: COLORS.primary }]}>
                <Star size={12} color="#000" fill="#000" />
                <Text style={styles.eliteText}>CLIENTE ÉLITE</Text>
            </View>
        </View>
      </View>

      {/* 2. ACCIONES RÁPIDAS */}
      <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.textMuted }]}>ACCIONES RÁPIDAS</Text>
          <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('book')}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(197, 160, 33, 0.08)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)' }]}>
                      <Calendar size={20} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: COLORS.text }]}>Agendar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('services')}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(124, 58, 237, 0.08)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)' }]}>
                      <Scissors size={20} color="#8B5CF6" />
                  </View>
                  <Text style={[styles.actionLabel, { color: COLORS.text }]}>Servicios</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('location')}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.08)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)' }]}>
                      <MapPin size={20} color="#10B981" />
                  </View>
                  <Text style={[styles.actionLabel, { color: COLORS.text }]}>Ubicación</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('schedules')}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.08)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)' }]}>
                      <Watch size={20} color="#F59E0B" />
                  </View>
                  <Text style={[styles.actionLabel, { color: COLORS.text }]}>Horarios</Text>
              </TouchableOpacity>
          </View>
      </View>

      {/* 3. PRÓXIMA CITA */}
      <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.textMuted }]}>TU PRÓXIMA EXPERIENCIA</Text>
          {nextAppointment ? (
            <TouchableOpacity 
              style={[styles.appointmentCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => setActiveTab('appointments')}
            >
              <View style={styles.appointmentInfo}>
                 <Text style={[styles.serviceName, { color: COLORS.text }]}>{nextAppointment.serviceName}</Text>
                 <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Calendar size={14} color={COLORS.textSecondary} />
                        <Text style={[styles.detailText, { color: COLORS.textSecondary }]}>{nextAppointment.date}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Clock size={14} color={COLORS.textSecondary} />
                        <Text style={[styles.detailText, { color: COLORS.textSecondary }]}>{nextAppointment.time}</Text>
                    </View>
                 </View>
                 <Text style={styles.barberLink}>Con: {nextAppointment.barberName}</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(197, 160, 33, 0.15)' }]}>
                <ChevronRight size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.emptyApptCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? '#333' : '#DDD' }]}
              onPress={() => setActiveTab('book')}
            >
              <Text style={[styles.emptyApptText, { color: COLORS.text }]}>No tienes citas activas</Text>
              <Text style={[styles.emptyApptSub, { color: COLORS.textSecondary }]}>¡Reserva tu lugar antes de que se agoten!</Text>
            </TouchableOpacity>
          )}
      </View>

      {/* 4. BANNER PROMOCIONAL */}
      <TouchableOpacity style={[styles.promoBanner, { backgroundColor: COLORS.mode === 'dark' ? '#1A1A1A' : '#EFF6FF', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)' }]}>
          <View style={styles.promoContent}>
              <Text style={styles.promoTag}>ESTILO DEL MES</Text>
              <Text style={[styles.promoTitle, { color: COLORS.text }]}>CORTE FADE + DISEÑO</Text>
              <Text style={[styles.promoSub, { color: COLORS.textSecondary }]}>Reserva hoy y obtén 100 ptos extra</Text>
          </View>
          <View style={styles.promoImagePlaceholder}>
              <Scissors size={40} color={COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(15, 23, 42, 0.05)'} />
          </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  glassBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      opacity: 0.5,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  presentationCard: {
    minHeight: 220,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    marginBottom: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: -2,
  },
  middleSection: {
    marginVertical: 12,
    gap: 8,
  },
  slogan: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
  },
  userName: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 2,
  },
  memberId: {
      fontSize: 11,
      marginTop: 2,
  },
  eliteBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
  eliteText: {
      color: '#000',
      fontSize: 10,
      fontWeight: '900',
  },
  section: {
      marginBottom: 32,
  },
  sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 2,
      marginBottom: 16,
      marginLeft: 4,
  },
  quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  actionBtn: {
      alignItems: 'center',
      gap: 8,
  },
  actionIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
  },
  actionLabel: {
      fontSize: 12,
      fontWeight: '600',
  },
  appointmentCard: {
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
  },
  appointmentInfo: {
      gap: 6,
  },
  serviceName: {
      fontSize: 18,
      fontWeight: '800',
  },
  detailsRow: {
      flexDirection: 'row',
      gap: 16,
  },
  detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  detailText: {
      fontSize: 13,
  },
  barberLink: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 4,
  },
  arrowCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  emptyApptCard: {
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      borderStyle: 'dashed',
      borderWidth: 1,
  },
  emptyApptText: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
  },
  emptyApptSub: {
      fontSize: 13,
  },
  promoBanner: {
      height: 140,
      borderRadius: 24,
      flexDirection: 'row',
      overflow: 'hidden',
      borderWidth: 1,
      marginBottom: 40,
  },
  promoContent: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      gap: 4,
  },
  promoTag: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
  },
  promoTitle: {
      fontSize: 20,
      fontWeight: '800',
  },
  promoSub: {
      fontSize: 12,
  },
  promoImagePlaceholder: {
      width: 120,
      alignItems: 'center',
      justifyContent: 'center',
  }
});
