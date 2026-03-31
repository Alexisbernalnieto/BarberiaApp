// src/components/Admin/AppointmentCommandCenter.tsx
// ═══════════════════════════════════════════════════════════════
// THE APPOINTMENT COMMAND CENTER
// Real-time control panel for managing all appointments,
// barber status, walk-ins, and no-shows across both branches.
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
  TextInput,
} from 'react-native';
import {
  ClipboardCheck,
  Clock,
  UserCheck,
  UserX,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  CalendarOff,
  ArrowRightLeft,
  Ban,
  Timer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  checkInAppointment,
  startService,
  completeService,
  markNoShow,
  cancelAppointment,
  reassignBarber,
  rescheduleAppointment,
  isAppointmentPastTolerance,
  getAvailableSlotsForBarber,
} from '../../services/appointments';
import { markBarberAbsent } from '../../services/barberTracking';
import { formatTime12h } from '../../utils/formatters';
import { Appointment, AppointmentStatus, AppUser } from '../../types';

// ─── Constants ───────────────────────────────────────────────
const BRANCHES = [
  { key: 'all', label: 'Todas' },
  { key: 'centro', label: 'Centro' },
  { key: 'lomas', label: 'Lomas' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_payment: { label: 'Pendiente Pago', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', icon: Timer },
  confirmed: { label: 'Confirmada', color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.1)', icon: CheckCircle2 },
  checked_in: { label: 'En Local', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: UserCheck },
  in_progress: { label: 'Cortando', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: Scissors },
  completed: { label: 'Completada', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle2 },
  no_show: { label: 'No Asistió', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: UserX },
  cancelled: { label: 'Cancelada', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', icon: XCircle },
  rescheduled: { label: 'Reagendada', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', icon: RefreshCw },
};

interface CommandCenterProps {
  appointments: Appointment[];
  COLORS: any;
  isMobile: boolean;
  onBack: () => void;
  onOpenWalkIn: () => void;
}

export default function AppointmentCommandCenter({
  appointments,
  COLORS,
  isMobile,
  onBack,
  onOpenWalkIn,
}: CommandCenterProps) {
  const { currentUser } = useAuth();
  const { barbers } = useData();
  const { width } = useWindowDimensions();

  // ─── State ───────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Modals
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showBarberAbsenceModal, setShowBarberAbsenceModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAbsentBarber, setSelectedAbsentBarber] = useState<AppUser | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [reassignTarget, setReassignTarget] = useState<AppUser | null>(null);
  const [reassignReason, setReassignReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // ─── Today's Date ──────────────────────────────────────────
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const isToday = selectedDate === todayStr;

  // ─── Filtered & Sorted Appointments ────────────────────────
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(app => {
        if (app.date !== selectedDate) return false;
        if (selectedBranch !== 'all') {
          const appBranch = (app.branch || '').toLowerCase();
          if (!appBranch.includes(selectedBranch)) return false;
        }
        // Hide rescheduled original appointments from timeline
        if (app.status === 'rescheduled') return false;
        return true;
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, selectedDate, selectedBranch]);

  // ─── Statistics ────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = dayAppointments.length;
    const confirmed = dayAppointments.filter(a => a.status === 'confirmed').length;
    const checkedIn = dayAppointments.filter(a => a.status === 'checked_in').length;
    const inProgress = dayAppointments.filter(a => a.status === 'in_progress').length;
    const completed = dayAppointments.filter(a => a.status === 'completed').length;
    const noShows = dayAppointments.filter(a => a.status === 'no_show').length;
    const walkIns = dayAppointments.filter(a => (a as any).type === 'Walk-in').length;
    const cancelled = dayAppointments.filter(a => a.status === 'cancelled').length;
    const revenue = dayAppointments
      .filter(a => a.status === 'completed')
      .reduce((acc, a) => acc + (a.price || 0), 0);
    const activeStatuses: AppointmentStatus[] = ['confirmed', 'checked_in', 'in_progress'];
    const active = dayAppointments.filter(a => activeStatuses.includes(a.status)).length;

    return { total, confirmed, checkedIn, inProgress, completed, noShows, walkIns, cancelled, revenue, active };
  }, [dayAppointments]);

  // ─── Barber Stats for Panel ────────────────────────────────
  const barberStats = useMemo(() => {
    const map: Record<string, { name: string; branch: string; completed: number; total: number; revenue: number; walkIns: number; noShows: number }> = {};

    dayAppointments.forEach(app => {
      const bId = String(app.barberId);
      if (!map[bId]) {
        map[bId] = { name: app.barberName, branch: app.branch, completed: 0, total: 0, revenue: 0, walkIns: 0, noShows: 0 };
      }
      map[bId].total += 1;
      if (app.status === 'completed') {
        map[bId].completed += 1;
        map[bId].revenue += app.price || 0;
      }
      if ((app as any).type === 'Walk-in') map[bId].walkIns += 1;
      if (app.status === 'no_show') map[bId].noShows += 1;
    });

    return Object.entries(map).map(([id, data]) => ({ id, ...data }));
  }, [dayAppointments]);

  // ─── Date Navigation ───────────────────────────────────────
  const navigateDate = (direction: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + direction);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hoy';
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  };

  // ─── Action Handlers ───────────────────────────────────────
  const handleAction = useCallback(async (action: string, app: Appointment) => {
    if (processing) return;
    setProcessing(true);

    try {
      const adminId = currentUser?.uid || 'admin';

      switch (action) {
        case 'check_in':
          await checkInAppointment(app.id, adminId);
          break;
        case 'start':
          await startService(app.id, adminId);
          break;
        case 'complete':
          await completeService(app.id, adminId);
          break;
        case 'no_show':
          await markNoShow(app.id, adminId);
          break;
        case 'cancel':
          await cancelAppointment(app.id, 'Cancelada por el administrador', adminId);
          break;
        case 'reassign':
          setSelectedAppointment(app);
          setShowReassignModal(true);
          break;
        case 'reschedule':
          setSelectedAppointment(app);
          setRescheduleDate('');
          setRescheduleTime('');
          setShowRescheduleModal(true);
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo realizar la acción.');
    } finally {
      setProcessing(false);
    }
  }, [currentUser, processing]);

  const handleReassignConfirm = async () => {
    if (!selectedAppointment || !reassignTarget || !reassignReason) return;
    setProcessing(true);
    try {
      await reassignBarber(
        selectedAppointment.id,
        reassignTarget.uid || reassignTarget.id,
        reassignTarget.name || 'Barbero',
        reassignReason,
        currentUser?.uid || 'admin'
      );
      setShowReassignModal(false);
      setReassignTarget(null);
      setReassignReason('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
    setProcessing(true);
    try {
      await rescheduleAppointment(
        selectedAppointment.id,
        rescheduleDate,
        rescheduleTime,
        currentUser?.uid || 'admin'
      );
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkBarberAbsent = async (barber: AppUser) => {
    setProcessing(true);
    try {
      await markBarberAbsent(
        barber.uid || barber.id,
        selectedDate,
        barber.branch || 'Centro',
        barber.name || 'Barbero',
        currentUser?.uid || 'admin'
      );
      setSelectedAbsentBarber(barber);
      setShowBarberAbsenceModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  // ─── Get Available Actions for a Status ────────────────────
  const getActionsForStatus = (app: Appointment) => {
    const actions: { key: string; label: string; color: string; icon: any }[] = [];
    const pastTolerance = isToday && isAppointmentPastTolerance(app.time, app.date);

    switch (app.status) {
      case 'confirmed':
        actions.push({ key: 'check_in', label: 'Llegó', color: '#3B82F6', icon: UserCheck });
        if (pastTolerance) {
          actions.push({ key: 'no_show', label: 'No Asistió', color: '#EF4444', icon: UserX });
        }
        actions.push({ key: 'reassign', label: 'Reasignar', color: '#8B5CF6', icon: ArrowRightLeft });
        actions.push({ key: 'reschedule', label: 'Posponer', color: '#F59E0B', icon: RefreshCw });
        actions.push({ key: 'cancel', label: 'Cancelar', color: '#6B7280', icon: Ban });
        break;
      case 'checked_in':
        actions.push({ key: 'start', label: 'Cortando', color: '#F59E0B', icon: Scissors });
        actions.push({ key: 'complete', label: 'Completar', color: '#10B981', icon: CheckCircle2 });
        break;
      case 'in_progress':
        actions.push({ key: 'complete', label: 'Completar', color: '#10B981', icon: CheckCircle2 });
        break;
    }

    return actions;
  };

  // Available barbers for reassignment (same branch, excluding current)
  const availableBarbers = useMemo(() => {
    if (!selectedAppointment) return [];
    return barbers.filter(b => {
      const bId = b.uid || b.id;
      return bId !== selectedAppointment.barberId &&
        (b.branch === selectedAppointment.branch || b.branch === 'Ambas');
    });
  }, [barbers, selectedAppointment]);

  // Absent barber's appointments for the modal
  const absentBarberAppointments = useMemo(() => {
    if (!selectedAbsentBarber) return [];
    const bId = selectedAbsentBarber.uid || selectedAbsentBarber.id;
    return dayAppointments.filter(a =>
      String(a.barberId) === String(bId) &&
      a.status !== 'cancelled' && a.status !== 'no_show' && a.status !== 'completed'
    );
  }, [selectedAbsentBarber, dayAppointments]);

  // Generate time slots for reschedule
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 10; h < 20; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // Generate next 14 days for reschedule date picker
  const futureDates = useMemo(() => {
    const dates: { value: string; label: string }[] = [];
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push({ value: val, label: `${days[d.getDay()]} ${d.getDate()}` });
    }
    return dates;
  }, []);

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      {/* ─── HEADER ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <ClipboardCheck size={28} color="var(--gold)" />
          <Text style={styles.title}>Control de Citas</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.walkInBtn} onPress={onOpenWalkIn}>
            <PlusCircle size={18} color="#000" />
            <Text style={styles.walkInBtnText}>Walk-in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── BRANCH & DATE FILTERS ──────────────────────────── */}
      <View style={[styles.filtersRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
        {/* Branch Tabs */}
        <View style={styles.branchTabs}>
          {BRANCHES.map(b => (
            <TouchableOpacity
              key={b.key}
              style={[styles.branchTab, selectedBranch === b.key && styles.branchTabActive]}
              onPress={() => setSelectedBranch(b.key)}
            >
              <MapPin size={14} color={selectedBranch === b.key ? '#000' : 'var(--text-muted)'} />
              <Text style={[styles.branchTabText, selectedBranch === b.key && styles.branchTabTextActive]}>
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateArrow}>
            <ChevronLeft size={18} color="var(--text-secondary)" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSelectedDate(todayStr)} style={styles.dateLabel}>
            <Calendar size={16} color="var(--gold)" />
            <Text style={[styles.dateLabelText, isToday && styles.dateLabelToday]}>
              {formatDateLabel(selectedDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigateDate(1)} style={styles.dateArrow}>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── STATS BAR ──────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsRow}>
        <View style={[styles.statChip, { borderColor: 'var(--gold)' }]}>
          <Text style={[styles.statValue, { color: 'var(--gold)' }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statChip, { borderColor: '#3B82F6' }]}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={[styles.statChip, { borderColor: '#10B981' }]}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={[styles.statChip, { borderColor: '#EF4444' }]}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.noShows}</Text>
          <Text style={styles.statLabel}>No-Show</Text>
        </View>
        <View style={[styles.statChip, { borderColor: '#10B981' }]}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.walkIns}</Text>
          <Text style={styles.statLabel}>Walk-ins</Text>
        </View>
        <View style={[styles.statChip, { borderColor: '#D4AF37' }]}>
          <Text style={[styles.statValue, { color: '#D4AF37' }]}>${stats.revenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </ScrollView>

      {/* ─── MAIN CONTENT: Timeline + Barber Panel ──────────── */}
      <View style={[styles.mainContent, isMobile && { flexDirection: 'column' }]}>
        {/* TIMELINE */}
        <ScrollView style={[styles.timelinePanel, isMobile ? { maxHeight: 500 } : {}]} showsVerticalScrollIndicator={false}>
          {dayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarOff size={48} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>No hay citas para este día</Text>
              <TouchableOpacity style={styles.emptyAction} onPress={onOpenWalkIn}>
                <PlusCircle size={16} color="var(--gold)" />
                <Text style={styles.emptyActionText}>Registrar Walk-in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dayAppointments.map((app, idx) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.confirmed;
              const StatusIcon = config.icon;
              const actions = getActionsForStatus(app);
              const pastTolerance = isToday && isAppointmentPastTolerance(app.time, app.date);
              const isWalkIn = (app as any).type === 'Walk-in';
              const isNoShow = app.status === 'no_show';

              return (
                <View key={app.id} style={[
                  styles.appointmentCard,
                  isNoShow && styles.noShowCard,
                ]} data-appointment-card="true">
                  {/* Time Column */}
                  <View style={styles.timeColumn}>
                    <Clock size={14} color="var(--gold)" />
                    <Text style={styles.timeText}>{formatTime12h(app.time)}</Text>
                    {isWalkIn && (
                      <View style={styles.walkInBadge}>
                        <Text style={styles.walkInBadgeText}>WALK-IN</Text>
                      </View>
                    )}
                  </View>

                  {/* Info Column */}
                  <View style={styles.infoColumn}>
                    <View style={styles.clientRow}>
                      <Text style={styles.clientName} numberOfLines={1}>{app.userName}</Text>
                      <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
                        <StatusIcon size={12} color={config.color} />
                        <Text style={[styles.statusPillText, { color: config.color }]}>{config.label}</Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <Text style={styles.serviceNameText}>{app.serviceName}</Text>
                      <Text style={styles.priceText}>${app.price}</Text>
                    </View>

                    <View style={styles.barberRow}>
                      <View style={styles.barberAvatar}>
                        <Text style={styles.barberInitial}>{app.barberName?.charAt(0)}</Text>
                      </View>
                      <Text style={styles.barberNameText}>{app.barberName}</Text>
                      <View style={styles.branchPill}>
                        <MapPin size={10} color="var(--text-muted)" />
                        <Text style={styles.branchPillText}>{app.branch}</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    {actions.length > 0 && (
                      <View style={styles.actionsRow}>
                        {actions.map(action => {
                          const ActionIcon = action.icon;
                          return (
                            <TouchableOpacity
                              key={action.key}
                              style={[styles.actionButton, { borderColor: action.color + '40' }]}
                              onPress={() => handleAction(action.key, app)}
                              disabled={processing}
                            >
                              <ActionIcon size={14} color={action.color} />
                              <Text style={[styles.actionButtonText, { color: action.color }]}>
                                {action.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* No-Show Available Slot Highlight */}
                    {isNoShow && (
                      <View style={styles.slotAvailable}>
                        <AlertTriangle size={14} color="#F59E0B" />
                        <Text style={styles.slotAvailableText}>Slot disponible para Walk-in</Text>
                        <TouchableOpacity style={styles.slotBtn} onPress={onOpenWalkIn}>
                          <PlusCircle size={14} color="#000" />
                          <Text style={styles.slotBtnText}>Asignar</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Past Tolerance Warning */}
                    {app.status === 'confirmed' && pastTolerance && (
                      <View style={styles.toleranceWarning}>
                        <Timer size={14} color="#EF4444" />
                        <Text style={styles.toleranceText}>Han pasado +10 min — Marcar como No-Show?</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* BARBER STATUS PANEL */}
        <View style={[styles.barberPanel, isMobile && { marginTop: 24 }]}>
          <View style={styles.barberPanelHeader}>
            <Users size={18} color="var(--gold)" />
            <Text style={styles.barberPanelTitle}>Barberos del Día</Text>
          </View>

          {barberStats.length === 0 ? (
            <Text style={styles.emptyBarberText}>Sin actividad hoy</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {barberStats.map(bs => (
                <View key={bs.id} style={styles.barberCard}>
                  <View style={styles.barberCardHeader}>
                    <View style={styles.barberCardAvatar}>
                      <Text style={styles.barberCardInitial}>{bs.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.barberCardName}>{bs.name}</Text>
                      <View style={styles.barberCardBranch}>
                        <MapPin size={10} color="var(--text-muted)" />
                        <Text style={styles.barberCardBranchText}>{bs.branch}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.absentBtn}
                      onPress={() => {
                        const barber = barbers.find(b => String(b.uid || b.id) === String(bs.id));
                        if (barber) {
                          handleMarkBarberAbsent(barber);
                        } else {
                          Alert.alert('Error', `No se encontró el barbero con ID ${bs.id} en la lista.`);
                        }
                      }}
                    >
                      <CalendarOff size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.barberMetrics}>
                    <View style={styles.barberMetric}>
                      <Text style={styles.barberMetricValue}>{bs.completed}/{bs.total}</Text>
                      <Text style={styles.barberMetricLabel}>Citas</Text>
                    </View>
                    <View style={styles.barberMetricDivider} />
                    <View style={styles.barberMetric}>
                      <Text style={styles.barberMetricValue}>{bs.walkIns}</Text>
                      <Text style={styles.barberMetricLabel}>Walk-ins</Text>
                    </View>
                    <View style={styles.barberMetricDivider} />
                    <View style={styles.barberMetric}>
                      <Text style={[styles.barberMetricValue, { color: '#10B981' }]}>${bs.revenue.toLocaleString()}</Text>
                      <Text style={styles.barberMetricLabel}>Revenue</Text>
                    </View>
                    {bs.noShows > 0 && (
                      <>
                        <View style={styles.barberMetricDivider} />
                        <View style={styles.barberMetric}>
                          <Text style={[styles.barberMetricValue, { color: '#EF4444' }]}>{bs.noShows}</Text>
                          <Text style={styles.barberMetricLabel}>No-Show</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* ═══ REASSIGN MODAL ═══════════════════════════════════ */}
      <Modal visible={showReassignModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ArrowRightLeft size={24} color="var(--gold)" />
              <Text style={styles.modalTitle}>Reasignar Barbero</Text>
            </View>

            {selectedAppointment && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  Cliente: {selectedAppointment.userName}
                </Text>
                <Text style={styles.modalInfoText}>
                  Barbero actual: {selectedAppointment.barberName}
                </Text>
                <Text style={styles.modalInfoText}>
                  Horario: {formatTime12h(selectedAppointment.time)}
                </Text>
              </View>
            )}

            <Text style={styles.modalSectionTitle}>Barberos Disponibles</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {availableBarbers.map(barber => (
                <TouchableOpacity
                  key={barber.id}
                  style={[styles.barberOption, reassignTarget?.id === barber.id && styles.barberOptionSelected]}
                  onPress={() => setReassignTarget(barber)}
                >
                  <View style={styles.barberOptionAvatar}>
                    <Text style={styles.barberOptionInitial}>{barber.name?.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.barberOptionName}>{barber.name}</Text>
                    <Text style={styles.barberOptionBranch}>{barber.branch}</Text>
                  </View>
                  {reassignTarget?.id === barber.id && <CheckCircle2 size={18} color="var(--gold)" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalSectionTitle}>Motivo de Reasignación</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Barbero se reportó enfermo"
              placeholderTextColor="var(--text-muted)"
              value={reassignReason}
              onChangeText={setReassignReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowReassignModal(false); setReassignTarget(null); setReassignReason(''); }}>
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!reassignTarget || !reassignReason) && styles.modalBtnDisabled]}
                onPress={handleReassignConfirm}
                disabled={!reassignTarget || !reassignReason || processing}
              >
                <Text style={styles.modalConfirmText}>{processing ? 'PROCESANDO...' : 'REASIGNAR'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ RESCHEDULE MODAL ═════════════════════════════════ */}
      <Modal visible={showRescheduleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RefreshCw size={24} color="var(--gold)" />
              <Text style={styles.modalTitle}>Posponer Cita</Text>
            </View>

            {selectedAppointment && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>Cliente: {selectedAppointment.userName}</Text>
                <Text style={styles.modalInfoText}>Original: {selectedAppointment.date} a las {formatTime12h(selectedAppointment.time)}</Text>
              </View>
            )}

            <Text style={styles.modalSectionTitle}>Nueva Fecha</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {futureDates.map(d => (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.dateChip, rescheduleDate === d.value && styles.dateChipActive]}
                    onPress={() => setRescheduleDate(d.value)}
                  >
                    <Text style={[styles.dateChipText, rescheduleDate === d.value && styles.dateChipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.modalSectionTitle}>Nuevo Horario</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {timeSlots.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.dateChip, rescheduleTime === slot && styles.dateChipActive]}
                    onPress={() => setRescheduleTime(slot)}
                  >
                    <Text style={[styles.dateChipText, rescheduleTime === slot && styles.dateChipTextActive]}>{formatTime12h(slot)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRescheduleModal(false)}>
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!rescheduleDate || !rescheduleTime) && styles.modalBtnDisabled]}
                onPress={handleRescheduleConfirm}
                disabled={!rescheduleDate || !rescheduleTime || processing}
              >
                <Text style={styles.modalConfirmText}>{processing ? 'PROCESANDO...' : 'REAGENDAR'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ BARBER ABSENCE MODAL ═════════════════════════════ */}
      <Modal visible={showBarberAbsenceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color="#EF4444" />
              <Text style={styles.modalTitle}>Barbero Ausente</Text>
            </View>

            {selectedAbsentBarber && (
              <View style={styles.modalInfo}>
                <Text style={[styles.modalInfoText, { fontSize: 16, fontWeight: '700', color: '#FFF' }]}>
                  {selectedAbsentBarber.name} no puede presentarse hoy
                </Text>
                <Text style={styles.modalInfoText}>
                  {absentBarberAppointments.length} citas necesitan acción
                </Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 300 }}>
              {absentBarberAppointments.map(app => (
                <View key={app.id} style={styles.absenceAppCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.absenceClientName}>{app.userName}</Text>
                    <Text style={styles.absenceService}>{app.serviceName} — {formatTime12h(app.time)}</Text>
                  </View>
                  <View style={styles.absenceActions}>
                    <TouchableOpacity
                      style={[styles.absenceActionBtn, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
                      onPress={() => {
                        setShowBarberAbsenceModal(false);
                        setSelectedAppointment(app);
                        setShowReassignModal(true);
                      }}
                    >
                      <ArrowRightLeft size={12} color="#8B5CF6" />
                      <Text style={[styles.absenceActionText, { color: '#8B5CF6' }]}>Reasignar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.absenceActionBtn, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
                      onPress={() => {
                        setShowBarberAbsenceModal(false);
                        setSelectedAppointment(app);
                        setShowRescheduleModal(true);
                      }}
                    >
                      <RefreshCw size={12} color="#F59E0B" />
                      <Text style={[styles.absenceActionText, { color: '#F59E0B' }]}>Posponer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.absenceActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                      onPress={async () => {
                        await cancelAppointment(app.id, 'Barbero ausente', currentUser?.uid);
                      }}
                    >
                      <XCircle size={12} color="#EF4444" />
                      <Text style={[styles.absenceActionText, { color: '#EF4444' }]}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBarberAbsenceModal(false)}>
              <Text style={styles.modalCancelText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  headerActions: { flexDirection: 'row', gap: 12 },
  walkInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'var(--gold)', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14,
  },
  walkInBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },

  // Filters
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  branchTabs: { flexDirection: 'row', backgroundColor: 'var(--bg-card)', padding: 4, borderRadius: 14, gap: 4 },
  branchTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  branchTabActive: { backgroundColor: 'var(--gold)' },
  branchTabText: { color: 'var(--text-secondary)', fontSize: 13, fontWeight: '600' },
  branchTabTextActive: { color: '#000' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateArrow: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: 'var(--glass-border)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'var(--bg-card)' },
  dateLabelText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  dateLabelToday: { color: 'var(--gold)' },

  // Stats
  statsScroll: { flexGrow: 0 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5,
    backgroundColor: 'var(--bg-card)', minWidth: 80, alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { color: 'var(--text-muted)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as any, marginTop: 2 },

  // Main Layout
  mainContent: { flex: 1, flexDirection: 'row', gap: 24 },

  // Timeline
  timelinePanel: { flex: 3 },
  appointmentCard: {
    backgroundColor: 'var(--bg-card)', borderRadius: 20, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: 'var(--glass-border)', flexDirection: 'row',
  },
  noShowCard: { borderColor: 'rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.03)' },
  timeColumn: { width: 72, alignItems: 'center', gap: 6, borderRightWidth: 1, borderRightColor: 'var(--glass-border)', paddingRight: 14, justifyContent: 'flex-start', paddingTop: 2 },
  timeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  walkInBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, marginTop: 4,
  },
  walkInBadgeText: { color: '#10B981', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  infoColumn: { flex: 1, paddingLeft: 16, gap: 8 },
  clientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' as any },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceNameText: { color: 'var(--text-secondary)', fontSize: 13, fontWeight: '500' },
  priceText: { color: 'var(--gold)', fontSize: 14, fontWeight: '800' },
  barberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barberAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'var(--glass-surface)', borderWidth: 1, borderColor: 'var(--glass-border)', alignItems: 'center', justifyContent: 'center' },
  barberInitial: { color: 'var(--gold)', fontSize: 10, fontWeight: '800' },
  barberNameText: { color: 'var(--text-secondary)', fontSize: 12, fontWeight: '600' },
  branchPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' as any },
  branchPillText: { color: 'var(--text-muted)', fontSize: 10, textTransform: 'capitalize' as any },

  // Actions
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  actionButtonText: { fontSize: 12, fontWeight: '700' },

  // Slot Available
  slotAvailable: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: 10,
    padding: 10, marginTop: 4,
  },
  slotAvailableText: { color: '#F59E0B', fontSize: 12, fontWeight: '600', flex: 1 },
  slotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'var(--gold)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  slotBtnText: { color: '#000', fontSize: 11, fontWeight: '800' },

  // Tolerance Warning
  toleranceWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 10,
    padding: 10, marginTop: 4,
  },
  toleranceText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  // Barber Panel
  barberPanel: {
    flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'var(--glass-border)', maxHeight: 600,
  },
  barberPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  barberPanelTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  emptyBarberText: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' as any, marginTop: 40 },
  barberCard: {
    backgroundColor: 'var(--bg-sidebar)', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'var(--glass-border)',
  },
  barberCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  barberCardAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'var(--gold-subtle)',
    alignItems: 'center', justifyContent: 'center',
  },
  barberCardInitial: { color: 'var(--gold)', fontSize: 16, fontWeight: '900' },
  barberCardName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  barberCardBranch: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  barberCardBranchText: { color: 'var(--text-muted)', fontSize: 11 },
  absentBtn: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  barberMetrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  barberMetric: { alignItems: 'center' },
  barberMetricValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  barberMetricLabel: { color: 'var(--text-muted)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as any, marginTop: 2 },
  barberMetricDivider: { width: 1, height: 24, backgroundColor: 'var(--glass-border)' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { color: 'var(--text-muted)', fontSize: 14 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'var(--gold-subtle)' },
  emptyActionText: { color: 'var(--gold)', fontSize: 13, fontWeight: '700' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 500, backgroundColor: 'var(--bg-sidebar)', borderRadius: 24,
    padding: 28, borderWidth: 1, borderColor: 'var(--glass-border)',
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  modalInfo: { backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 16, marginBottom: 20, gap: 6 },
  modalInfoText: { color: 'var(--text-secondary)', fontSize: 13, fontWeight: '500' },
  modalSectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  modalInput: {
    backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 14,
    borderWidth: 1, borderColor: 'var(--glass-border)', marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalCancelText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'var(--gold)',
  },
  modalConfirmText: { color: '#000', fontWeight: '800', fontSize: 14 },
  modalBtnDisabled: { opacity: 0.4 },

  // Barber options in reassign modal
  barberOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: 'var(--bg-card)', marginBottom: 8, borderWidth: 1, borderColor: 'var(--glass-border)',
  },
  barberOptionSelected: { borderColor: 'var(--gold)', backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  barberOptionAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'var(--gold-subtle)',
    alignItems: 'center', justifyContent: 'center',
  },
  barberOptionInitial: { color: 'var(--gold)', fontSize: 14, fontWeight: '800' },
  barberOptionName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  barberOptionBranch: { color: 'var(--text-muted)', fontSize: 11 },

  // Date/Time chips
  dateChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: 'var(--glass-border)', backgroundColor: 'var(--bg-card)',
  },
  dateChipActive: { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)' },
  dateChipText: { color: 'var(--text-secondary)', fontSize: 12, fontWeight: '600' },
  dateChipTextActive: { color: '#000' },

  // Absence modal cards
  absenceAppCard: {
    backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'var(--glass-border)',
  },
  absenceClientName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  absenceService: { color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 },
  absenceActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  absenceActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
  },
  absenceActionText: { fontSize: 11, fontWeight: '700' },
});
