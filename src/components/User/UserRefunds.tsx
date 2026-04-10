import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  useWindowDimensions,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Receipt, 
  X, 
  CreditCard, 
  Trash2, 
  HelpCircle
} from 'lucide-react';
import { Appointment } from '../../types';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

interface UserRefundsProps {
  user: any;
  appointments?: Appointment[];
  COLORS: any;
  isMobile: boolean;
  initialSelectedAppointmentId?: string;
}

export default function UserRefunds({ user, appointments = [], COLORS, isMobile, initialSelectedAppointmentId }: UserRefundsProps) {
  const { width, height } = useWindowDimensions();
  const [selectedRefund, setSelectedRefund] = useState<Appointment | null>(null);

  // Auto-open detail if initial ID is provided
  useEffect(() => {
    if (initialSelectedAppointmentId && appointments.length > 0) {
      const target = appointments.find(app => app.id === initialSelectedAppointmentId);
      if (target) {
        setSelectedRefund(target);
      }
    }
  }, [initialSelectedAppointmentId, appointments]);

  // Filter for appointments that are cancelled AND have refund info
  const refundedAppointments = appointments
    .filter(app => app && app.status === 'cancelled' && (app.paid || app.refundStatus))
    .sort((a, b) => {
        const getTs = (item: any) => {
          if (item.refundedAt?.toDate) return item.refundedAt.toDate().getTime();
          if (item.cancelledAt?.toDate) return item.cancelledAt.toDate().getTime();
          return item.date ? new Date(item.date).getTime() : 0;
        };
        return getTs(b) - getTs(a);
    });

  const renderRefundItem = ({ item }: { item: Appointment }) => {
    const isCompleted = item.refundStatus === 'completed';
    const isFailed = item.refundStatus === 'failed';
    const isPending = !item.refundStatus && item.paid;

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setSelectedRefund(item)}
        style={[
          styles.refundCard, 
          { 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.06)' 
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <View style={[styles.mainIconWrapper, { backgroundColor: COLORS.primary + '15' }]}>
              <RotateCcw size={24} color={COLORS.primary} />
            </View>
          </View>
          
          <View style={styles.refundInfo}>
            <Text style={[styles.serviceName, { color: COLORS.text }]}>{item.serviceName}</Text>
            <Text style={[styles.barberInfo, { color: COLORS.textSecondary }]}>
              Cita ID: {item.id.substring(item.id.length - 8).toUpperCase()}
            </Text>
            <Text style={[styles.dateInfo, { color: COLORS.textSecondary }]}>Original: {formatFullDate(item.date)} a las {formatTime12h(item.time)}</Text>
          </View>

          <View style={styles.amountSection}>
            <Text style={[styles.amountText, { color: COLORS.primary }]}>-${item.price}</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: isCompleted ? '#10B98115' : isFailed ? '#EF444415' : '#F59E0B15',
              borderColor: isCompleted ? '#10B98130' : isFailed ? '#EF444430' : '#F59E0B30'
            }]}>
              <Text style={[styles.statusText, { color: isCompleted ? '#10B981' : isFailed ? '#EF4444' : '#F59E0B' }]}>
                {isCompleted ? 'COMPLETADO' : isFailed ? 'FALLIDO' : 'EN PROCESO'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

        <View style={styles.cardFooter}>
          <View style={styles.footerDetail}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text style={[styles.footerDetailText, { color: COLORS.textSecondary }]}>
              {isCompleted ? `Reembolsado el ${formatFullDate(item.refundedAt?.toDate ? item.refundedAt.toDate() : item.date)}` : 'Pendiente de confirmación bancaria'}
            </Text>
          </View>
          {item.refundId && (
            <View style={styles.footerDetail}>
              <Receipt size={14} color={COLORS.textSecondary} />
              <Text style={[styles.footerDetailText, { color: COLORS.textSecondary }]}>Ref: {(item.refundId || '').substring(0, 12)}...</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimelineItem = (icon: any, title: string, subtitle: string, isLast = false, isCompleted = false, color?: string) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineIcon, { 
          backgroundColor: isCompleted ? (color || COLORS.primary) + '20' : COLORS.textSecondary + '10',
          borderColor: isCompleted ? (color || COLORS.primary) + '40' : COLORS.textSecondary + '20'
        }]}>
          {React.cloneElement(icon, { size: 16, color: isCompleted ? (color || COLORS.primary) : COLORS.textSecondary })}
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: isCompleted ? (color || COLORS.primary) + '30' : COLORS.textSecondary + '15' }]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineTitle, { color: COLORS.text, opacity: isCompleted ? 1 : 0.6 }]}>{title}</Text>
        <Text style={[styles.timelineSubtitle, { color: COLORS.textSecondary, opacity: isCompleted ? 0.8 : 0.4 }]}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderDetailModal = () => {
    if (!selectedRefund) return null;

    const item = selectedRefund;
    const isCompleted = item.refundStatus === 'completed';
    const isFailed = item.refundStatus === 'failed';
    const isPending = !item.refundStatus && item.paid;

    return (
      <Modal
        visible={!!selectedRefund}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRefund(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setSelectedRefund(null)} 
          />
          <View style={[styles.modalContainer, { backgroundColor: COLORS.background, maxHeight: height * 0.85, width: isMobile ? '95%' : 500 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: COLORS.text }]}>Detalle de Reembolso</Text>
                <Text style={[styles.modalSubtitle, { color: COLORS.textSecondary }]}>Línea de Vida de tu Transacción</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRefund(null)} style={[styles.closeButton, { backgroundColor: COLORS.surface }]}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={[styles.summaryBox, { backgroundColor: COLORS.surface }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Referencia Cita</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: 15, fontWeight: '900' }]}>
                    {(item.id || '').substring(Math.max(0, (item.id || '').length - 8)).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Sucursal</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.text, fontSize: 14 }]}>{item.branch}</Text>
                </View>
                <View style={[styles.summaryRow, { marginBottom: 8 }]}>
                  <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Barbero</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.text, fontSize: 14, fontWeight: '700' }]}>{item.barberName}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginVertical: 4 }]} />

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Monto a Devolver</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.primary }]}>-${item.price}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Servicio</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.text }]}>{item.serviceName}</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Rastreo de Actividad</Text>
              
              <View style={styles.timelineContainer}>
                {renderTimelineItem(
                  <CreditCard />, 
                  "Pago Confirmado", 
                  `Recibido el ${formatFullDate(item.paidAt?.toDate ? item.paidAt.toDate() : item.createdAt?.toDate ? item.createdAt.toDate() : item.date)}`,
                  false,
                  true
                )}
                
                {renderTimelineItem(
                  <Trash2 />, 
                  "Cita Cancelada", 
                  item.cancelReason || "Solicitud de cancelación procesada",
                  false,
                  true,
                  '#EF4444'
                )}

                {renderTimelineItem(
                  <RotateCcw />, 
                  "Solicitud de Reembolso", 
                  isPending ? "Identificada y en cola de proceso" : "Enviada a procesador de pagos",
                  false,
                  !isPending || isCompleted
                )}

                {renderTimelineItem(
                  isCompleted ? <CheckCircle2 /> : isFailed ? <AlertCircle /> : <Clock />, 
                  isCompleted ? "Reembolso Exitoso" : isFailed ? "Error en Reembolso" : "Procesando en Stripe", 
                  isCompleted ? `Confirmado el ${formatFullDate(item.refundedAt?.toDate ? item.refundedAt.toDate() : new Date())}` : 
                  isFailed ? (item.refundError || "Contacta a soporte") : "Esperando respuesta de Stripe",
                  false,
                  isCompleted || isFailed,
                  isCompleted ? '#10B981' : isFailed ? '#EF4444' : '#F59E0B'
                )}

                {renderTimelineItem(
                  <HelpCircle />, 
                  "Confirmación Bancaria", 
                  isCompleted ? "Los fondos tardan 5-10 días hábiles en aparecer en tu estado de cuenta." : "Se activará una vez que Stripe confirme la transacción.",
                  true,
                  isCompleted
                )}
              </View>

              {item.refundId && (
                <View style={[styles.infoCard, { backgroundColor: COLORS.primary + '08', borderColor: COLORS.primary + '20' }]}>
                  <Receipt size={18} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoCardTitle, { color: COLORS.primary }]}>ID de Referencia Stripe</Text>
                    <Text style={[styles.infoCardText, { color: COLORS.text, fontWeight: '700' }]}>{item.refundId}</Text>
                    <Text style={[styles.infoCardSub, { color: COLORS.textSecondary }]}>Puedes usar este ID con tu banco si tienes dudas.</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              onPress={() => setSelectedRefund(null)}
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.actionButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: COLORS.text }]}>Tus Reembolsos</Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Transparencia total en tus transacciones</Text>
        </View>
      </View>

      <FlatList
        data={refundedAppointments}
        renderItem={renderRefundItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color={COLORS.textSecondary + '30'} />
            <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No tienes solicitudes de reembolso pendientes</Text>
          </View>
        }
      />
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, opacity: 0.8 },
  listContent: { gap: 16, paddingBottom: 40 },
  refundCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
  },
  barberInfo: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateInfo: {
    fontSize: 12,
  },
  amountSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    padding: 24,
    gap: 20,
    ...Platform.select({
      web: { boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    gap: 24,
    paddingVertical: 8,
  },
  summaryBox: {
    padding: 20,
    borderRadius: 20,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: -8,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  timelineSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: 14,
  },
  infoCardSub: {
    fontSize: 11,
    marginTop: 4,
  },
  actionButton: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
});
