import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Bell,
  X,
  CheckCheck,
  Calendar,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  PlusCircle,
  XCircle,
} from 'lucide-react';
import { formatTime12h } from '../../utils/formatters';

const getNotifConfig = (type: string) => {
  switch (type) {
    case 'new_appointment':
      return { icon: Calendar, color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.1)', label: 'Nueva Cita' };
    case 'walk_in_registered':
      return { icon: PlusCircle, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Walk-in' };
    case 'check_in':
      return { icon: UserCheck, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Check-in' };
    case 'no_show_alert':
      return { icon: UserX, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'No-Show' };
    case 'appointment_cancelled':
      return { icon: XCircle, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Cancelada' };
    case 'barber_absent':
      return { icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Barbero Ausente' };
    case 'appointment_rescheduled':
      return { icon: RefreshCw, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'Reprogramada' };
    case 'barber_reassigned':
      return { icon: ArrowRightLeft, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'Reasignada' };
    default:
      return { icon: Bell, color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.1)', label: 'Notificación' };
  }
};

const formatTimestamp = (ts: any): string => {
  if (!ts) return '';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `${date.getDate()}/${date.getMonth() + 1} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: any[];
  handleMarkAsRead: () => void;
  COLORS: any;
}

const formatDateVerbose = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || !timeStr) return '';
  const [yyyy, mm, dd] = dateStr.split('-');
  const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  let [h, m] = timeStr.split(':');
  let hour = Number(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;

  return `${days[dateObj.getDay()]} ${dd} de ${months[dateObj.getMonth()]} a las ${hour}:${m} ${ampm}`;
};
const NotificationsModal = ({ visible, onClose, notifications = [], handleMarkAsRead, COLORS }: NotificationsModalProps) => {
  const hasNotifications = notifications.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.title, { color: COLORS.text }]}>Notificaciones</Text>
                  {hasNotifications && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{notifications.length}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.headerRight}>
                  {hasNotifications && (
                    <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAsRead}>
                      <CheckCheck size={16} color="#D4AF37" />
                      <Text style={styles.markReadText}>Leer todo</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notifications List */}
              {hasNotifications ? (
                <ScrollView
                  style={styles.listScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {notifications.map((notif: any) => {
                    const config = getNotifConfig(notif.type);
                    const Icon = config.icon;

                    return (
                      <View key={notif.id} style={[styles.notifCard, { borderColor: config.color + '20' }]}>
                        {/* Icon */}
                        <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                          <Icon size={18} color={config.color} />
                        </View>

                        {/* Content */}
                        <View style={styles.notifContent}>
                          <View style={styles.notifTop}>
                            <View style={[styles.typePill, { backgroundColor: config.bg }]}>
                              <Text style={[styles.typePillText, { color: config.color }]}>{config.label}</Text>
                            </View>
                            <Text style={styles.timeAgo}>{formatTimestamp(notif.createdAt)}</Text>
                          </View>

                          <Text style={[styles.notifMessage, { color: COLORS.text }]} numberOfLines={2}>
                            {notif.message}
                          </Text>

                          {(notif.branch || notif.service || notif.date) && (
                            <View style={styles.notifMeta}>
                              <View style={styles.metaRow}>
                                {notif.branch && (
                                  <Text style={styles.metaText}>📍 {notif.branch}</Text>
                                )}
                                {notif.service && (
                                  <>
                                    {notif.branch && <Text style={styles.metaDot}>•</Text>}
                                    <Text style={styles.metaText}>✂️ {notif.service}</Text>
                                  </>
                                )}
                              </View>
                              {(notif.date && notif.time) && (
                                <View style={[styles.metaRow, { marginTop: 4 }]}>
                                  <Text style={[styles.metaText, { color: 'var(--gold)' }]}>
                                    📅 {formatDateVerbose(notif.date, notif.time)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyBody}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                    <Bell size={48} color={COLORS.textSecondary} style={{ opacity: 0.3 }} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: COLORS.text }]}>
                    No tienes nuevas notificaciones
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                    Las notificaciones de citas aparecerán aquí
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  markReadText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  // List
  listScroll: {
    maxHeight: 400,
  },
  notifCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 6,
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase' as any,
    letterSpacing: 0.5,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '500',
  },
  notifMessage: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  notifMeta: {
    gap: 4,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: '800',
  },
  // Empty state
  emptyBody: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    textAlign: 'center' as any,
    fontWeight: '600',
    opacity: 0.8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center' as any,
    opacity: 0.5,
  },
});

export default NotificationsModal;
