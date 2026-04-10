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
  ArrowRight,
  Info,
  CreditCard,
  Hash,
  Store
} from 'lucide-react';
import { Appointment } from '../../types';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

interface CancellationNoticeModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onAcknowledge: (appointmentId: string) => Promise<void>;
  onGoToRefunds: (appointmentId: string) => void;
  COLORS: any;
}

export default function CancellationNoticeModal({ 
  visible, 
  appointment, 
  onClose, 
  onAcknowledge, 
  onGoToRefunds,
  COLORS 
}: CancellationNoticeModalProps) {
  const { width, height } = useWindowDimensions();
  
  // Responsiveness logic
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const modalWidth = isMobile ? '95%' : isTablet ? 500 : 550;

  if (!appointment) return null;

  const handleAcknowledge = async () => {
    try {
      await onAcknowledge(appointment.id);
      onClose();
    } catch (error) {
      console.error("Error acknowledging cancellation:", error);
    }
  };

  const handleGoToRefunds = async () => {
    try {
      // First acknowledge so it doesn't pop up again
      await onAcknowledge(appointment.id);
      // Then trigger redirection with the specific appointment ID
      onGoToRefunds(appointment.id);
      onClose();
    } catch (error) {
      console.error("Error going to refunds:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
        {/* Backdrop - Total Solid Block for Luxury Feel */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
        
        <View style={[styles.overlay, { padding: isMobile ? 12 : 24 }]}>
          <View style={[
            styles.container, 
            { 
              backgroundColor: '#050505', 
              borderColor: COLORS.primary,
              width: modalWidth,
              maxHeight: height * 0.95,
              borderWidth: 1.5,
              shadowColor: COLORS.primary,
              shadowOpacity: 0.2,
              shadowRadius: 30,
              elevation: 24,
            }
          ]}>
            {/* Header ID Bar - High Visibility */}
            <View style={[styles.idBar, { backgroundColor: COLORS.primary }]}>
                <View style={styles.idBadge}>
                  <Hash size={14} color="#000" />
                  <Text style={styles.idBarLabel}>ID CITA</Text>
                </View>
                <Text style={styles.idBarValue} numberOfLines={1}>
                  {(appointment.id || '').substring(Math.max(0, (appointment.id || '').length - 8)).toUpperCase()}
                </Text>
            </View>
  
            {/* Header Content */}
            <View style={[styles.header, { borderBottomColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: isMobile ? 16 : 24, paddingVertical: isMobile ? 20 : 24 }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DC2626', width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }]}>
                  <AlertTriangle color="#FFF" size={isMobile ? 20 : 24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: COLORS.text, fontSize: isMobile ? 16 : 22 }]} numberOfLines={1}>Notificación de Cancelación</Text>
                  <Text style={[styles.subtitleLabel, { color: COLORS.textSecondary }]}>SISTEMA DE SEGURIDAD EL CORONEL</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <X color={COLORS.text} size={20} />
              </TouchableOpacity>
            </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Alert Banner */}
            <View style={[styles.alertBanner, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Info size={18} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={[styles.alertText, { color: COLORS.text, fontSize: isMobile ? 13 : 15 }]}>
                Tu cita ha sido cancelada por {appointment.cancelledBy || 'la administración'}.
              </Text>
            </View>

            {/* Details Section */}
            <Text style={[styles.sectionHeading, { color: COLORS.textSecondary }]}>DETALLES DEL SERVICIO</Text>
            <View style={[styles.detailsGrid, { backgroundColor: COLORS.surface }]}>
              <View style={styles.detailRow}>
                <User size={16} color={COLORS.primary} />
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>Barbero</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{appointment.barberName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Scissors size={16} color={COLORS.primary} />
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>Servicio</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{appointment.serviceName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Store size={16} color={COLORS.primary} />
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>Sucursal</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{appointment.branch || 'Centro'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Calendar size={16} color={COLORS.primary} />
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>Fecha</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{formatFullDate(appointment.date)}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Clock size={16} color={COLORS.primary} />
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>Hora</Text>
                <Text style={[styles.detailValue, { color: COLORS.text }]}>{formatTime12h(appointment.time)}</Text>
              </View>
            </View>

            {/* Reason Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: COLORS.textSecondary }]}>MOTIVO DE CANCELACIÓN</Text>
              <View style={[styles.reasonBox, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: COLORS.border }]}>
                <Text style={[styles.reasonText, { color: COLORS.text, fontSize: isMobile ? 14 : 16 }]}>
                  "{appointment.cancelReason || "No se proporcionó un motivo específico."}"
                </Text>
              </View>
            </View>

            {/* Refund Info */}
            <View style={[styles.refundPanel, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
              <View style={styles.refundHeader}>
                <CreditCard size={20} color="#22C55E" />
                <Text style={[styles.refundTitle, { color: '#22C55E' }]}>Reembolso Automático</Text>
              </View>
              <Text style={[styles.refundText, { color: COLORS.textSecondary, fontSize: isMobile ? 12 : 14 }]}>
                El monto total será devuelto a tu método de pago original. Puedes rastrear el estado en tiempo real en la sección de mis reembolsos.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.footer, { borderTopColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: isMobile ? 'column-reverse' : 'row' }]}>
            <TouchableOpacity 
              style={[styles.btnSecondary, { borderColor: COLORS.border, width: isMobile ? '100%' : 'auto' }]} 
              onPress={handleAcknowledge}
            >
              <Text style={[styles.btnSecondaryText, { color: COLORS.textSecondary }]}>Entendido</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnPrimary, { backgroundColor: COLORS.primary, width: isMobile ? '100%' : 'auto' }]} 
              onPress={handleGoToRefunds}
            >
              <Text style={styles.btnPrimaryText}>Ver Reembolso</Text>
              <ArrowRight size={18} color="#000" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Deepest solid black
  },
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 24,
  },
  idBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6
  },
  idBarLabel: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  idBarValue: {
    color: '#000',
    fontSize: 15, // Slightly larger for better readability
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    flex: 1,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitleLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  alertText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  detailsGrid: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    fontSize: 12,
    marginLeft: 12,
    width: 80,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right'
  },
  section: {
    marginBottom: 24,
  },
  reasonBox: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  reasonText: {
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  refundPanel: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  refundTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 10,
  },
  refundText: {
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
  },
  btnPrimary: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  btnSecondary: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

