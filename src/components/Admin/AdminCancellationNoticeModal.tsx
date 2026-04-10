import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  useWindowDimensions,
  Platform
} from 'react-native';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  X, 
  Info,
  Hash,
  ShieldAlert,
  Store
} from 'lucide-react';
import { Appointment } from '../../types';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

interface AdminCancellationNoticeModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onAcknowledge: (appointmentId: string) => Promise<void>;
  COLORS: any;
}

export default function AdminCancellationNoticeModal({ 
  visible, 
  appointment, 
  onClose, 
  onAcknowledge, 
  COLORS 
}: AdminCancellationNoticeModalProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const modalWidth = isMobile ? '95%' : 550;

  if (!appointment) return null;

  const handleAcknowledge = async () => {
    try {
      await onAcknowledge(appointment.id);
      onClose();
    } catch (error) {
      console.error("Error acknowledging cancellation by admin:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      <View style={styles.overlay}>
        <View style={[
          styles.container, 
          { 
            backgroundColor: '#050505', 
            borderColor: COLORS.primary,
            width: modalWidth,
            maxHeight: height * 0.9,
            borderWidth: 1.5,
          }
        ]}>
          {/* Header ID Bar */}
          <View style={[styles.idBar, { backgroundColor: COLORS.primary }]}>
            <View style={styles.idBadge}>
              <Hash size={14} color="#000" />
              <Text style={styles.idBarLabel}>ALERTA DE SISTEMA</Text>
            </View>
            <Text style={styles.idBarValue}>
              {appointment.id.slice(-8).toUpperCase()}
            </Text>
          </View>

          <View style={[styles.header, { borderBottomColor: 'rgba(212, 175, 55, 0.1)' }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#EAB308' }]}>
                <ShieldAlert color="#000" size={24} />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.text, fontSize: isMobile ? 18 : 22 }]}>Cita Cancelada por Barbero</Text>
                <Text style={[styles.subtitleLabel, { color: COLORS.textSecondary }]}>PANEL DE CONTROL ADMINISTRATIVO</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={COLORS.text} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.alertBanner, { backgroundColor: 'rgba(234, 179, 8, 0.05)', borderColor: 'rgba(234, 179, 8, 0.2)' }]}>
              <Info size={18} color="#EAB308" style={{ marginRight: 12 }} />
              <Text style={[styles.alertText, { color: COLORS.text, fontSize: isMobile ? 12 : 14 }]}>
                El barbero <Text style={{ fontWeight: '900', color: COLORS.primary }}>{appointment.barberName}</Text> ha cancelado esta cita. El reembolso al cliente se ha procesado de forma automática.
              </Text>
            </View>

            <Text style={[styles.sectionHeading, { color: COLORS.textSecondary }]}>DATOS DE LA OPERACIÓN</Text>
            <View style={[styles.detailsGrid, { backgroundColor: COLORS.surface }]}>
              <View style={styles.detailRow}>
                <User size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Cliente</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{appointment.userName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Scissors size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Servicio</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{appointment.serviceName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Store size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Sucursal</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{appointment.branch || 'Centro'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{formatFullDate(appointment.date)}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Clock size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Horario</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{formatTime12h(appointment.time)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: COLORS.textSecondary }]}>JUSTIFICANTE DEL BARBERO</Text>
              <View style={[styles.reasonBox, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: COLORS.border }]}>
                <Text style={[styles.reasonText, { color: COLORS.text }]}>
                  "{appointment.cancelReason || "No se especificó motivo."}"
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.btnPrimary, { backgroundColor: COLORS.primary }]} 
              onPress={handleAcknowledge}
            >
              <Text style={styles.btnPrimaryText}>MARCAR COMO REVISADO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { borderRadius: 24, overflow: 'hidden' },
  idBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, gap: 12 },
  idBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 6 },
  idBarLabel: { color: '#000', fontSize: 9, fontWeight: '900' },
  idBarValue: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  header: { padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '900' },
  subtitleLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  alertText: { flex: 1, fontWeight: '600', lineHeight: 20 },
  sectionHeading: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  detailsGrid: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { fontSize: 12, marginLeft: 12, width: 80, fontWeight: '600', color: '#888' },
  detailValue: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
  section: { marginBottom: 24 },
  reasonBox: { padding: 16, borderRadius: 16, borderWidth: 1 },
  reasonText: { lineHeight: 22, fontStyle: 'italic' },
  footer: { padding: 24 },
  btnPrimary: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnPrimaryText: { color: '#000', fontSize: 14, fontWeight: '900' },
});
