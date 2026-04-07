import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Appointment } from '../../types';
import { Calendar, Clock, User, Scissors, Check, AlertCircle, Quote, ArrowLeft, MapPin } from 'lucide-react';
import { authorizeReschedule } from '../../services/appointments';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

interface RescheduleRequestsProps {
  appointments: Appointment[];
  COLORS: any;
  onUpdate?: () => void;
  adminId: string;
}

export default function RescheduleRequests({ appointments, COLORS, onUpdate, adminId }: RescheduleRequestsProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const onBack = onUpdate; // Using onUpdate to return to dashboard
  const pendingRequests = useMemo(() => {
    return appointments.filter(app => app.rescheduleRequested && !app.rescheduleAuthorized);
  }, [appointments]);

  const handleAuthorize = async (app: Appointment) => {
    Alert.alert(
      'Autorizar Reprogramación',
      `¿Deseas autorizar a ${app.userName} para reprogramar su cita de ${app.serviceName} sin costo adicional?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Autorizar', 
          onPress: async () => {
            try {
              await authorizeReschedule(app.id, adminId);
              if (onUpdate) onUpdate();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo autorizar la reprogramación.');
            }
          }
        }
      ]
    );
  };

  if (pendingRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {!isMobile && (
          <TouchableOpacity 
            style={[styles.backBtnHeader, { marginBottom: 20 }]} 
            onPress={onBack}
          >
            <ArrowLeft size={20} color={COLORS.text} />
            <Text style={[styles.backBtnText, { color: COLORS.text }]}>Volver</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.emptyIcon, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
          <Check size={32} color={COLORS.textMuted} />
        </View>
        <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No hay solicitudes pendientes.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {!isMobile && (
        <TouchableOpacity 
          style={styles.backBtnHeader} 
          onPress={onBack}
        >
          <ArrowLeft size={20} color={COLORS.text} />
          <Text style={[styles.backBtnText, { color: COLORS.text }]}>Volver al Dashboard</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.title, { color: COLORS.text }]}>Solicitudes de Reprogramación</Text>
      <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
        Clientes que no asistieron y enviaron una justificación para su cita.
      </Text>

      {pendingRequests.map(app => (
        <View key={app.id} style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.glassBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertCircle size={14} color="#EF4444" />
              <Text style={styles.statusText}>NO-SHOW</Text>
            </View>
            <Text style={[styles.appId, { color: COLORS.textMuted }]}>ID: {app.id}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.clientInfo}>
              <Text style={[styles.clientName, { color: COLORS.text }]}>{app.userName}</Text>
              <View style={styles.detailRow}>
                <Scissors size={14} color={COLORS.primary} />
                <Text style={[styles.detailText, { color: COLORS.textSecondary }]}>{app.serviceName} con {app.barberName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={14} color={COLORS.primary} />
                <Text style={[styles.detailText, { color: COLORS.textSecondary }]}>
                  {formatFullDate(app.date)} a las {formatTime12h(app.time)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={[styles.detailText, { color: COLORS.textSecondary }]}>{app.branch || 'Sucursal Matriz'}</Text>
              </View>
            </View>

            <View style={[styles.justificationBox, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.05)' : '#F8FAFC' }]}>
              <View style={styles.justificationHeader}>
                <Quote size={14} color={COLORS.primary} />
                <Text style={[styles.justificationLabel, { color: COLORS.primary }]}>JUSTIFICACIÓN RECIBIDA</Text>
              </View>
              <Text style={[styles.justificationText, { color: COLORS.text }]}>
                "{app.noShowJustification || "No se proporcionó justificación."}"
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.approveBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => handleAuthorize(app)}
              >
                <Check size={18} color="#000" />
                <Text style={styles.approveBtnText}>Autorizar Reprogramación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  card: { borderRadius: 24, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  appId: { fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 20 },
  clientName: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  clientInfo: { marginBottom: 4 },
  detailText: { fontSize: 14, fontWeight: '600' },
  justificationBox: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.1)' },
  justificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  justificationLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  justificationText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  actions: { marginTop: 24 },
  approveBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  approveBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  backBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
