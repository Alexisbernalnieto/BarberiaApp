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
    Zap
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
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* 1. SECCIÓN DE MEMBRESÍA (CARTA ELITE) */}
      <View style={styles.membershipCard}>
        <View style={styles.glassBackground} />
        <View style={styles.cardHeader}>
            <View>
                <Text style={styles.membershipLabel}>MEMBRESÍA EXCLUSIVA</Text>
                <Text style={styles.membershipTitle}>ELITE PLATINUM</Text>
            </View>
            <Zap size={24} color="#D4AF37" fill="#D4AF37" />
        </View>
        
        <View style={styles.cardFooter}>
            <View>
                <Text style={styles.userName}>{user?.name?.toUpperCase() || 'CLIENTE DISTINGUIDO'}</Text>
                <Text style={styles.memberId}>ID: #COR-{user?.uid?.substring(0, 6) || 'XXXX'}</Text>
            </View>
            <View style={styles.pointsBadge}>
                <Star size={12} color="#000" fill="#000" />
                <Text style={styles.pointsText}>850 pts</Text>
            </View>
        </View>
      </View>

      {/* 2. ACCIONES RÁPIDAS */}
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
          <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('book')}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                      <Calendar size={20} color="#D4AF37" />
                  </View>
                  <Text style={styles.actionLabel}>Agendar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                      <Scissors size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.actionLabel}>Servicios</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <MapPin size={20} color="#10B981" />
                  </View>
                  <Text style={styles.actionLabel}>Ubicación</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      <Gift size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.actionLabel}>Premios</Text>
              </TouchableOpacity>
          </View>
      </View>

      {/* 3. PRÓXIMA CITA */}
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>TU PRÓXIMA EXPERIENCIA</Text>
          {nextAppointment ? (
            <TouchableOpacity 
              style={[styles.appointmentCard, { borderColor: 'rgba(212, 175, 55, 0.3)' }]}
              onPress={() => setActiveTab('appointments')}
            >
              <View style={styles.appointmentInfo}>
                 <Text style={styles.serviceName}>{nextAppointment.serviceName}</Text>
                 <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Calendar size={14} color="#888" />
                        <Text style={styles.detailText}>{nextAppointment.date}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Clock size={14} color="#888" />
                        <Text style={styles.detailText}>{nextAppointment.time}</Text>
                    </View>
                 </View>
                 <Text style={styles.barberLink}>Con: {nextAppointment.barberName}</Text>
              </View>
              <View style={styles.arrowCircle}>
                <ChevronRight size={20} color="#D4AF37" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.emptyApptCard}
              onPress={() => setActiveTab('book')}
            >
              <Text style={styles.emptyApptText}>No tienes citas activas</Text>
              <Text style={styles.emptyApptSub}>¡Reserva tu lugar antes de que se agoten!</Text>
            </TouchableOpacity>
          )}
      </View>

      {/* 4. BANNER PROMOCIONAL */}
      <TouchableOpacity style={styles.promoBanner}>
          <View style={styles.promoContent}>
              <Text style={styles.promoTag}>ESTILO DEL MES</Text>
              <Text style={styles.promoTitle}>CORTE FADE + DISEÑO</Text>
              <Text style={styles.promoSub}>Reserva hoy y obtén 100 ptos extra</Text>
          </View>
          <View style={styles.promoImagePlaceholder}>
              <Scissors size={40} color="rgba(255,255,255,0.1)" />
          </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  membershipCard: {
    height: 200,
    borderRadius: 24,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'space-between',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
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
  membershipLabel: {
    color: 'rgba(212, 175, 55, 0.6)',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '800',
    marginBottom: 4,
  },
  membershipTitle: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
  },
  userName: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 2,
  },
  memberId: {
      color: '#666',
      fontSize: 11,
      marginTop: 2,
  },
  pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#D4AF37',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
  pointsText: {
      color: '#000',
      fontSize: 11,
      fontWeight: '800',
  },
  section: {
      marginBottom: 32,
  },
  sectionTitle: {
      color: '#888',
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
      borderColor: 'rgba(255,255,255,0.05)',
  },
  actionLabel: {
      color: '#EEE',
      fontSize: 12,
      fontWeight: '600',
  },
  appointmentCard: {
      backgroundColor: 'rgba(255,255,255,0.03)',
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
      color: '#FFF',
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
      color: '#888',
      fontSize: 13,
  },
  barberLink: {
      color: '#D4AF37',
      fontSize: 13,
      fontWeight: '600',
      marginTop: 4,
  },
  arrowCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  emptyApptCard: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: '#333',
  },
  emptyApptText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
  },
  emptyApptSub: {
      color: '#666',
      fontSize: 13,
  },
  promoBanner: {
      height: 140,
      borderRadius: 24,
      backgroundColor: '#1A1A1A',
      flexDirection: 'row',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      marginBottom: 40,
  },
  promoContent: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      gap: 4,
  },
  promoTag: {
      color: '#8B5CF6',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
  },
  promoTitle: {
      color: '#FFF',
      fontSize: 20,
      fontWeight: '800',
  },
  promoSub: {
      color: '#888',
      fontSize: 12,
  },
  promoImagePlaceholder: {
      width: 120,
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
  }
});
