import React, { useState, useMemo } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  Alert,
  Linking,
  Switch,
  Modal
} from 'react-native';
import { updateAppointmentStatus, createAppointment } from '../services/appointments';
import { db } from '../firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Calendar,
  Clock,
  TrendingUp,
  Scissors,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  Menu,
  User,
  Award,
  X,
  MessageSquare,
  AlertCircle,
  Instagram,
  Link,
  Edit2,
  Save
} from 'lucide-react';
import { formatFullDate, formatTime12h, getLocalTodayString, isAppointmentExpired, canChangeStatus, isDateToday } from '../utils/formatters';
import { startOfWeek, format, subWeeks } from 'date-fns';
import MainLayout from './Navigation/MainLayout';
import AdminUsers from './Admin/AdminUsers';
import { useSidebar } from '../context/SidebarContext';
import { Appointment, AppUser, UserRole } from '../types';
import { notifyCancellationToClient } from '../services/notificationDispatcher';

// Uber-Style Metrics Components
import WeeklyOverview from './Barber/Metrics/WeeklyOverview';
import WeeklySelector from './Barber/Metrics/WeeklySelector';
import EarningsActivity from './Barber/Metrics/EarningsActivity';
import MetricsFilters from './Barber/Metrics/MetricsFilters';
import { calculateWeeklyMetrics } from '../utils/barberMetrics';
import AppointmentCheckModal from './Barber/AppointmentCheckModal';


interface BarberDashboardProps {
  appointments: Appointment[];
  user: AppUser;
  onLogout: () => void;
  COLORS: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
  role?: UserRole;
  isMobile?: boolean;
}

export default function BarberDashboard({
  appointments,
  user,
  onLogout,
  COLORS,
  toggleTheme,
  isDarkMode,
  isMobile: isMobileProp
}: BarberDashboardProps) {
  const { width } = useWindowDimensions();
  const isMobile = isMobileProp ?? width < 768;
  const { setIsOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming');
  
  // Uber-Style Metrics State
  const [metricsTabMode, setMetricsTabMode] = useState<'overview' | 'selector' | 'activity'>('overview');
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showMetricsFilters, setShowMetricsFilters] = useState(false);
  const [metricsFilters, setMetricsFilters] = useState({
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    branchId: 'all' as 'all' | 'Lomas' | 'Centro'
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedApptForCancel, setSelectedApptForCancel] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationType, setCancellationType] = useState('other');

  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [pendingStatusAppt, setPendingStatusAppt] = useState<Appointment | null>(null);
  const [pendingNewStatus, setPendingNewStatus] = useState<string>('');

  const [isOnBreak, setIsOnBreak] = useState(user.isOnBreak || false);
  const [showBreakConfirmModal, setShowBreakConfirmModal] = useState(false);
  const [pendingBreakInfo, setPendingBreakInfo] = useState<{
    type: 1 | 2;
    startTime: string;
    endTime: string;
    duration: number;
  } | null>(null);

  const [showCheckModal, setShowCheckModal] = useState(false);
  const [delayedAppt, setDelayedAppt] = useState<Appointment | null>(null);


  // Helper: Convert string HH:mm to minutes from midnight
  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper: Convert minutes back to HH:mm string
  const minutesToTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
    const toggleBreak = async (value: boolean) => {
        if (value && user.schedule) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const dayIndex = now.getDay();
            
            // Access schedule robustly (Object or Array)
            const schedule = user.schedule as any;
            const daySched = Array.isArray(schedule) ? schedule[dayIndex] : schedule[dayIndex.toString()];

            if (daySched && daySched.active) {
                const checkBreak = (startStr: string, endStr: string, type: number) => {
                    if (!startStr || !endStr) return null;
                    const startMinutes = timeToMinutes(startStr);
                    const endMinutes = timeToMinutes(endStr);

                    if (currentMinutes < startMinutes) {
                        return { type, start: startStr, end: endStr, duration: endMinutes - startMinutes };
                    }
                    return null;
                };

                const foundBreak = checkBreak(daySched.break1Start, daySched.break1End, 1) || 
                                  checkBreak(daySched.break2Start, daySched.break2End, 2);

                if (foundBreak) {
                    setPendingBreakInfo({
                        type: foundBreak.type as 1 | 2,
                        startTime: foundBreak.start,
                        endTime: foundBreak.end,
                        duration: foundBreak.duration
                    });
                    setShowBreakConfirmModal(true);
                    return;
                }
            }
        }
    
    setIsOnBreak(value);
    try {
      await updateDoc(doc(db, 'users', user.uid), { isOnBreak: value });
    } catch (e) {
      console.error(e);
      setIsOnBreak(!value);
    }
  };

  const handleConfirmAdvanceBreak = async (shouldAdvance: boolean) => {
    setShowBreakConfirmModal(false);
    setIsOnBreak(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      if (shouldAdvance && pendingBreakInfo && user.schedule) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const newStartTime = minutesToTime(currentMinutes);
        const newEndTime = minutesToTime(currentMinutes + pendingBreakInfo.duration);
        const dayIndex = now.getDay();

        // Preserve data type (Array or Object)
        let updatedSchedule: any;
        if (Array.isArray(user.schedule)) {
          updatedSchedule = [...user.schedule];
          updatedSchedule[dayIndex] = {
            ...updatedSchedule[dayIndex],
            ...(pendingBreakInfo.type === 1 
              ? { break1Start: newStartTime, break1End: newEndTime }
              : { break2Start: newStartTime, break2End: newEndTime })
          };
        } else {
          updatedSchedule = { ...user.schedule };
          updatedSchedule[dayIndex] = {
            ...updatedSchedule[dayIndex],
            ...(pendingBreakInfo.type === 1 
              ? { break1Start: newStartTime, break1End: newEndTime }
              : { break2Start: newStartTime, break2End: newEndTime })
          };
        }

        await updateDoc(userRef, {
          isOnBreak: true,
          schedule: updatedSchedule
        });
        
        Alert.alert('Descanso Adelantado', `Tu descanso se ha movido para iniciar ahora y terminar a las ${formatTime12h(newEndTime)}.`);
      } else {
        await updateDoc(userRef, { isOnBreak: true });
      }
    } catch (e) {
      console.error(e);
      setIsOnBreak(false);
      Alert.alert('Error', 'No se pudo actualizar el estado de descanso.');
    } finally {
      setPendingBreakInfo(null);
    }
  };

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editInstagram, setEditInstagram] = useState(user.instagram || '');
  const [editTiktok, setEditTiktok] = useState(user.tiktok || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: editName,
        phone: editPhone,
        instagram: editInstagram,
        tiktok: editTiktok
      });
      setIsEditingProfile(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleEditProfile = () => {
    if (isEditingProfile) {
      // Cancelar - revertir valores
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditInstagram(user.instagram || '');
      setEditTiktok(user.tiktok || '');
      setIsEditingProfile(false);
    } else {
      // Iniciar edición
      setIsEditingProfile(true);
    }
  };

  const cancelReasons = [
    { id: 'emergency', label: 'Emergencia Personal', icon: '🚑' },
    { id: 'overlap', label: 'Cruce de Horario', icon: '⏰' },
    { id: 'client_request', label: 'Petición del Cliente', icon: '👤' },
    { id: 'other', label: 'Otro Motivo', icon: '📝' }
  ];

  // Filter appointments assigned to this barber
  const myAppointments = useMemo(() => {
    const myName = (user?.name || '').toLowerCase().trim();
    return appointments.filter(app => {
      const appBarber = (app.barberName || '').toLowerCase().trim();
      const appBarberId = app.barberId;
      return appBarber === myName || appBarberId === user.uid;
    });
  }, [appointments, user?.name, user?.uid]);

  const today = getLocalTodayString();
  const [todayString, setTodayString] = useState(today);

  // Update todayString periodically to handle midnight transition
  React.useEffect(() => {
    const timer = setInterval(() => {
      const currentToday = getLocalTodayString();
      if (currentToday !== todayString) {
        setTodayString(currentToday);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [todayString]);




  // Sort and filter upcoming
  const upcomingAppointments = useMemo(() => {
    return myAppointments
      .filter(app => {
        // If it's today and not yet handled, it's upcoming
        if (isDateToday(app.date, todayString)) {
           // Keep in upcoming if confirmable or in progress
           if (['confirmed', 'in_progress', 'checked_in'].includes(app.status)) {
             return !isAppointmentExpired(app.date, app.time);
           }
           return false;
        }
        
        // Future dates
        if (app.date > todayString) return app.status === 'confirmed';

        return false;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return timeA - timeB;
      });
  }, [myAppointments, todayString]);

  // Combined History: Past days + Past hours from today
  const historyAppointments = useMemo(() => {
    return myAppointments
      .filter(app => {
        // Anything that is past today OR is handled today OR is expired today
        if (app.date < todayString) return true;
        
        if (isDateToday(app.date, todayString)) {
          if (['completed', 'cancelled', 'no_show', 'unhandled'].includes(app.status)) return true;
          return isAppointmentExpired(app.date, app.time);
        }

        return false;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return timeB - timeA; // descending
      });
  }, [myAppointments, todayString]);

  const todaysAppointments = useMemo(() => {
    return myAppointments.filter(app => isDateToday(app.date, todayString));
  }, [myAppointments, todayString]);
  
  // Monitor delayed appointments to avoid "unhandled/expired" state
  React.useEffect(() => {
    const checkDelayed = () => {
      const now = new Date();
      
      const delayed = todaysAppointments.find(app => {
        if (app.status !== 'confirmed') return false;
        
        const [h, m] = app.time.split(':').map(Number);
        const appTime = new Date();
        appTime.setHours(h, m, 0, 0);
        
        const diffMins = (now.getTime() - appTime.getTime()) / (1000 * 60);
        // Prompt if 10-60 mins late
        return diffMins >= 10 && diffMins < 60; 
      });

      if (delayed && !showCheckModal) {
        setDelayedAppt(delayed);
        setShowCheckModal(true);
      }
    };

    const interval = setInterval(checkDelayed, 60000); // Check every minute
    checkDelayed();
    
    return () => clearInterval(interval);
  }, [todaysAppointments, showCheckModal]);

  
  // Ganancia Real (Solo lo completado hoy)
  const todaysCompletedAppts = useMemo(() => {
    return todaysAppointments.filter(app => app.status === 'completed');
  }, [todaysAppointments]);

  const todaysEarnings = useMemo(() => {
    return todaysCompletedAppts.reduce((sum, app) => sum + (app.price || 0), 0);
  }, [todaysCompletedAppts]);

  // Ganancia Proyectada (Todo lo confirmado/en progreso/llegó del día)
  const todaysPotentialEarnings = useMemo(() => {
    return todaysAppointments
      .filter(app => !['cancelled', 'no_show', 'unhandled'].includes(app.status))
      .reduce((sum, app) => sum + (app.price || 0), 0);
  }, [todaysAppointments]);

  const allCompletedAppts = useMemo(() => {
     return myAppointments.filter(app => app.status === 'completed');
  }, [myAppointments]);

  const totalGross = useMemo(() => {
    return allCompletedAppts.reduce((sum, app) => sum + (app.price || 0), 0);
  }, [allCompletedAppts]);

  const totalEarnings = totalGross; // 100% earnings

  // Unified Metrics Calculation (Uber-Style)
  const metricsData = useMemo(() => {
    return calculateWeeklyMetrics(myAppointments, selectedWeekStart, {
      branchId: metricsFilters.branchId,
      startDate: metricsFilters.startDate,
      endDate: metricsFilters.endDate
    });
  }, [myAppointments, selectedWeekStart, metricsFilters]);

  const handleStatusChange = async (appId: string, newStatus: string, cancellationData?: any) => {
    try {
      await updateAppointmentStatus(appId, newStatus as any, user.uid, 'barber', cancellationData);

      if (newStatus === 'completed') {
        Alert.alert('¡Excelente!', 'Cita marcada como completada.');
      } else if (newStatus === 'cancelled') {
        // Trigger Notifications
        if (selectedApptForCancel) {
          await notifyCancellationToClient(selectedApptForCancel, cancellationReason || 'Cancelado por el barbero');
        }

        setShowCancelModal(false);
        setSelectedApptForCancel(null);
        setCancellationReason('');
        Alert.alert('Cita Cancelada', 'Se ha notificado al cliente vía Email/WhatsApp.');
      }
      
      // Close confirmation modal if open
      setShowStatusConfirmModal(false);
      setPendingStatusAppt(null);
      setPendingNewStatus('');
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita.');
      console.error(error);
    }
  };

  const triggerStatusConfirm = (app: Appointment, nextStatus: string) => {
    const validation = canChangeStatus(app, nextStatus);
    if (!validation.allowed) {
      Alert.alert('Acción restringida', validation.message);
      return;
    }
    setPendingStatusAppt(app);
    setPendingNewStatus(nextStatus);
    setShowStatusConfirmModal(true);
  };

  const confirmCancellation = () => {
    if (!selectedApptForCancel) return;

    handleStatusChange(selectedApptForCancel.id, 'cancelled', {
      reason: cancellationReason || 'Cancelado por el barbero',
      type: cancellationType
    });
  };

  // getNextHalfHour and handleTakeBreak logic replaced by toggleBreak Switch

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'Completada', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'checked_in': return { text: 'En Barbería', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'in_progress': return { text: 'Cortando', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'no_show': return { text: 'No Asistió', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'cancelled': return { text: 'Cancelada', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'unhandled': return { text: 'Expirada', color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)' };
      default: return { text: 'Confirmada', color: 'var(--gold)', bg: 'rgba(212, 175, 55, 0.1)' };
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      COLORS={COLORS}
      user={user}
    >
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.contentArea}
          contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {isMobile && (
                <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.menuBtn}>
                  <Menu size={24} color="var(--gold)" />
                </TouchableOpacity>
              )}
              <View>
                <Text style={[styles.greeting, { fontSize: isMobile ? 20 : 24 }]}>Hola, {user.name || 'Barbero'}</Text>
                <Text style={styles.dateText}>{formatFullDate(todayString)}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <View style={[styles.breakBtn, { flexDirection: 'row', alignItems: 'center', backgroundColor: isOnBreak ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass-surface)', borderColor: isOnBreak ? '#10B981' : 'var(--glass-border)', paddingHorizontal: 12, paddingVertical: 6 }]}>
                <Text style={[styles.breakBtnText, { color: isOnBreak ? '#10B981' : 'var(--text-muted)' }]}>
                  {isOnBreak ? 'En Descanso' : 'Descanso'}
                </Text>
                <Switch 
                  value={isOnBreak} 
                  onValueChange={toggleBreak} 
                  trackColor={{ false: '#4B5563', true: 'rgba(16, 185, 129, 0.5)' }}
                  thumbColor={isOnBreak ? '#10B981' : '#FFF'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 4 }}
                />
              </View>
              <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
                {isDarkMode ? <Sun size={20} color="var(--gold)" /> : <Moon size={20} color="var(--text-secondary)" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ display: activeTab === 'dashboard' ? 'flex' : 'none', width: '100%', gap: 32 }}>
            {/* Metrics Grid */}
            <View style={[styles.metricsRow, isMobile && { flexDirection: 'column' }]}>
              <View style={styles.metricCard} data-metric="true">
                <View style={[styles.iconBox, { backgroundColor: 'var(--gold-subtle)' }]}>
                  <Calendar size={20} color="var(--gold)" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{todaysAppointments.length}</Text>
                  <Text style={styles.metricLabel}>Citas Hoy</Text>
                </View>
              </View>
              <View style={styles.metricCard} data-metric="true">
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.metricValue}>${todaysEarnings.toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Balance Real</Text>
                  <Text style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Proyectado: ${todaysPotentialEarnings.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* View Toggle */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, viewMode === 'upcoming' && styles.tabButtonActive]}
                onPress={() => setViewMode('upcoming')}
              >
                <Text style={[styles.tabText, viewMode === 'upcoming' && styles.tabTextActive]}>Próximas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, viewMode === 'history' && styles.tabButtonActive]}
                onPress={() => setViewMode('history')}
              >
                <Text style={[styles.tabText, viewMode === 'history' && styles.tabTextActive]}>Historial</Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'upcoming' ? (
              <>
                {/* Main Schedule */}
                <View style={styles.scheduleSection}>
                  <Text style={styles.sectionTitle}>Mi Agenda de Hoy</Text>

                  {todaysAppointments.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Calendar size={48} color="rgba(255,255,255,0.1)" />
                      <Text style={styles.emptyText}>No tienes citas programadas para hoy.</Text>
                    </View>
                  ) : (
                    <View style={styles.appointmentList}>
                      {todaysAppointments.map((app) => {
                        const s = getStatusBadge(app.status);
                        return (
                          <View key={app.id} style={[styles.appCard, { flexDirection: 'column', alignItems: 'stretch' }]} data-glass="true">
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={styles.appTime}>
                                <Clock size={16} color="var(--gold)" />
                                <Text style={styles.timeText}>{formatTime12h(app.time)}</Text>
                              </View>
                              <View style={styles.appInfo}>
                                <Text style={styles.clientName}>{app.userName || 'Cliente'}</Text>
                                <Text style={styles.serviceText}>{app.serviceName} • ${app.price}</Text>
                              </View>
                              <View style={styles.appStatus}>
                                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                                  <CheckCircle2 size={14} color={s.color} />
                                  <Text style={[styles.statusText, { color: s.color }]}>{s.text}</Text>
                                </View>
                              </View>
                            </View>

                            {app.status !== 'completed' && app.status !== 'cancelled' && app.status !== 'no_show' && (
                              <View style={styles.actionRow}>
                                {(() => {
                                  const vLlego = canChangeStatus(app, 'checked_in');
                                  const vProgress = canChangeStatus(app, 'in_progress');
                                  const vDone = canChangeStatus(app, 'completed');
                                  const vNoShow = canChangeStatus(app, 'no_show');

                                  return (
                                    <>
                                      <TouchableOpacity 
                                        onPress={() => triggerStatusConfirm(app, 'checked_in')} 
                                        activeOpacity={vLlego.allowed ? 0.7 : 1}
                                        style={[styles.actionBtn, { borderColor: vLlego.allowed ? '#3B82F6' : 'rgba(255,255,255,0.05)', opacity: vLlego.allowed ? 1 : 0.4 }]}
                                      >
                                        <Text style={[styles.actionBtnText, { color: vLlego.allowed ? '#3B82F6' : 'rgba(255,255,255,0.3)' }]}>Llegó</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        onPress={() => triggerStatusConfirm(app, 'in_progress')} 
                                        activeOpacity={vProgress.allowed ? 0.7 : 1}
                                        style={[styles.actionBtn, { borderColor: vProgress.allowed ? '#F59E0B' : 'rgba(255,255,255,0.05)', opacity: vProgress.allowed ? 1 : 0.4 }]}
                                      >
                                        <Text style={[styles.actionBtnText, { color: vProgress.allowed ? '#F59E0B' : 'rgba(255,255,255,0.3)' }]}>Cortando</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        onPress={() => triggerStatusConfirm(app, 'completed')} 
                                        activeOpacity={vDone.allowed ? 0.7 : 1}
                                        style={[styles.actionBtn, { borderColor: vDone.allowed ? '#10B981' : 'rgba(255,255,255,0.05)', opacity: vDone.allowed ? 1 : 0.4 }]}
                                      >
                                        <Text style={[styles.actionBtnText, { color: vDone.allowed ? '#10B981' : 'rgba(255,255,255,0.3)' }]}>Completó</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        onPress={() => triggerStatusConfirm(app, 'no_show')} 
                                        activeOpacity={vNoShow.allowed ? 0.7 : 1}
                                        style={[styles.actionBtn, { borderColor: vNoShow.allowed ? '#EF4444' : 'rgba(255,255,255,0.05)', opacity: vNoShow.allowed ? 1 : 0.4 }]}
                                      >
                                        <Text style={[styles.actionBtnText, { color: vNoShow.allowed ? '#EF4444' : 'rgba(255,255,255,0.3)' }]}>Faltó</Text>
                                      </TouchableOpacity>
                                    </>
                                  );
                                })()}
                                
                                {(() => {
                                  const now = new Date();
                                  const appDate = new Date(`${app.date}T${app.time || '00:00'}`);
                                  const diffMins = (now.getTime() - appDate.getTime()) / (1000 * 60);
                                  const canCancel = app.status !== 'checked_in' && diffMins <= 30;
                                  
                                  if (!canCancel) return null;

                                  return (
                                    <TouchableOpacity
                                      onPress={() => {
                                        setSelectedApptForCancel(app);
                                        setShowCancelModal(true);
                                      }}
                                      style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.6)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
                                    >
                                      <Text style={[styles.actionBtnText, { color: '#EF4444', fontWeight: 'bold' }]}>Cancelar</Text>
                                    </TouchableOpacity>
                                  );
                                })()}
                              </View>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  )}
                </View>

                {/* Upcoming */}
                <View style={styles.upcomingSection}>
                  <Text style={styles.sectionTitle}>Próximos Días</Text>
                  <View style={styles.upcomingList}>
                    {upcomingAppointments.filter(app => app.date > today).slice(0, 5).map((app) => {
                      const dateParts = app.date.split('-');
                      const dayNumber = dateParts[2];
                      const monthNumber = dateParts[1];
                      return (
                        <View key={app.id} style={styles.upcomingItem}>
                          <View style={styles.upcomingDate}>
                            <Text style={[styles.upDay, { fontSize: 13, textAlign: 'center' }]}>
                                {formatFullDate(app.date).split(',')[0].substring(0, 3).toUpperCase()}
                            </Text>
                            <Text style={[styles.upDay, { fontSize: 18, fontWeight: '900' }]}>{dayNumber}</Text>
                          </View>
                          <View style={styles.upInfo}>
                            <Text style={styles.upClient}>{app.userName}</Text>
                            <Text style={styles.upService}>{app.serviceName} • {monthNumber}/{dayNumber} • {formatTime12h(app.time)}</Text>
                          </View>
                          <ChevronRight size={18} color="var(--text-muted)" />
                        </View>
                      );
                    })}
                    {upcomingAppointments.filter(app => app.date > today).length === 0 && (
                      <Text style={styles.emptyText}>No hay citas próximas programadas.</Text>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.scheduleSection}>
                <Text style={styles.sectionTitle}>Historial de Citas</Text>
                {historyAppointments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Clock size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyText}>No tienes un historial de citas aún.</Text>
                  </View>
                ) : (
                  <View style={styles.appointmentList}>
                    {historyAppointments.map((app) => {
                      const s = getStatusBadge(app.status);
                      return (
                        <View key={app.id} style={[styles.appCard, { opacity: 0.8 }]} data-glass="true">
                          <View style={[styles.upcomingDate, { width: 100 }]}>
                            <Text style={[styles.upDay, { fontSize: 12 }]}>{formatFullDate(app.date)}</Text>
                          </View>
                          <View style={styles.appInfo}>
                            <Text style={styles.clientName}>{app.userName || 'Cliente'}</Text>
                            <Text style={styles.serviceText}>{app.serviceName} • ${app.price}</Text>
                          </View>
                          <View style={styles.appStatus}>
                            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                              <Text style={[styles.statusText, { color: s.color }]}>
                                {s.text}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
            )}
          </View>

          {activeTab === 'metrics' && (
            <View style={{ flex: 1 }}>
              {metricsTabMode === 'overview' && (
                <WeeklyOverview
                  metrics={metricsData}
                  COLORS={COLORS}
                  onSelectWeek={() => setMetricsTabMode('selector')}
                  onViewActivity={() => setMetricsTabMode('activity')}
                  onOpenFilters={() => setShowMetricsFilters(true)}
                />
              )}
              
              {metricsTabMode === 'selector' && (
                <WeeklySelector
                  appointments={myAppointments}
                  currentWeekStart={selectedWeekStart}
                  COLORS={COLORS}
                  onSelectWeek={(weekStart) => {
                    setSelectedWeekStart(weekStart);
                    setMetricsTabMode('overview');
                  }}
                  onBack={() => setMetricsTabMode('overview')}
                />
              )}

              {metricsTabMode === 'activity' && (
                <EarningsActivity
                  appointments={metricsData.appointments}
                  COLORS={COLORS}
                  onBack={() => setMetricsTabMode('overview')}
                  onOpenFilter={() => setShowMetricsFilters(true)}
                />
              )}

              <MetricsFilters
                visible={showMetricsFilters}
                onClose={() => setShowMetricsFilters(false)}
                onApply={(newFilters) => {
                  setMetricsFilters(newFilters);
                  setShowMetricsFilters(false);
                }}
                initialFilters={metricsFilters}
                COLORS={COLORS}
              />
            </View>
          )}

          {activeTab === 'profile' && (
            <View style={styles.tabContent}>
              <View style={[styles.headerActions, { width: '100%', justifyContent: 'space-between', marginBottom: 16 }]}>
                <Text style={styles.sectionTitle}>Mi Perfil</Text>
                {!isEditingProfile ? (
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: 'var(--gold)', backgroundColor: 'var(--gold-subtle)', flexDirection: 'row', alignItems: 'center' }]} onPress={toggleEditProfile}>
                    <Edit2 size={16} color="var(--gold)" style={{ marginRight: 6 }} />
                    <Text style={[styles.actionBtnText, { color: 'var(--gold)' }]}>Editar Perfil</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: 'var(--glass-border)', flexDirection: 'row', alignItems: 'center' }]} onPress={toggleEditProfile} disabled={isSavingProfile}>
                      <X size={16} color="var(--text-muted)" style={{ marginRight: 6 }} />
                      <Text style={[styles.actionBtnText, { color: 'var(--text-muted)' }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', flexDirection: 'row', alignItems: 'center' }]} onPress={handleSaveProfile} disabled={isSavingProfile}>
                      <Save size={16} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={[styles.actionBtnText, { color: '#10B981' }]}>
                        {isSavingProfile ? 'Guardando...' : 'Guardar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.profileCard}>
                <View style={styles.profileAvatarLarge}>
                  <User size={48} color="var(--gold)" />
                </View>
                
                {isEditingProfile ? (
                  <TextInput
                    style={[styles.editInput, { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Tu Nombre"
                    placeholderTextColor="var(--text-muted)"
                  />
                ) : (
                  <Text style={styles.profileNameLarge}>{user.name}</Text>
                )}
                
                <Text style={styles.profileRoleLarge}>Especialista Barbero</Text>

                <View style={[styles.profileDataList, isEditingProfile && { gap: 24 }]}>
                  <View style={styles.profileDataRow}>
                    <Text style={styles.profileDataLabel}>Correo Electrónico:</Text>
                    <Text style={[styles.profileDataValue, { color: 'var(--text-muted)' }]}>{user.email} (No editable)</Text>
                  </View>
                  <View style={styles.profileDataRow}>
                    <Text style={styles.profileDataLabel}>Sucursal Asignada:</Text>
                    <Text style={[styles.profileDataValue, { color: 'var(--text-muted)' }]}>{user.branch || 'Principal'} (No editable)</Text>
                  </View>
                  <View style={styles.profileDataRow}>
                    <Text style={styles.profileDataLabel}>Teléfono:</Text>
                    {isEditingProfile ? (
                      <TextInput
                        style={[styles.editInput, { width: '50%' }]}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        placeholder="ej. 555 123 4567"
                        placeholderTextColor="var(--text-muted)"
                        keyboardType="phone-pad"
                      />
                    ) : (
                      <Text style={styles.profileDataValue}>{user.phone || 'No registrado'}</Text>
                    )}
                  </View>
                  
                  {isEditingProfile && (
                    <>
                      <View style={styles.profileDataRow}>
                        <Text style={styles.profileDataLabel}>Instagram (Usuario):</Text>
                        <TextInput
                          style={[styles.editInput, { width: '50%' }]}
                          value={editInstagram}
                          onChangeText={setEditInstagram}
                          placeholder="ej. @mi_usuario"
                          placeholderTextColor="var(--text-muted)"
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.profileDataRow}>
                        <Text style={styles.profileDataLabel}>TikTok (Usuario):</Text>
                        <TextInput
                          style={[styles.editInput, { width: '50%' }]}
                          value={editTiktok}
                          onChangeText={setEditTiktok}
                          placeholder="ej. @mi_usuario"
                          placeholderTextColor="var(--text-muted)"
                          autoCapitalize="none"
                        />
                      </View>
                    </>
                  )}
                </View>

                {/* Redes Sociales */}
                {!isEditingProfile && (
                  <View style={styles.socialContainer}>
                    <Text style={styles.socialTitle}>Redes Sociales Profesionales</Text>
                    <View style={styles.socialRow}>
                      <TouchableOpacity 
                        style={[styles.socialBtn, { backgroundColor: 'rgba(225, 48, 108, 0.1)', borderColor: 'rgba(225, 48, 108, 0.3)' }]}
                        onPress={() => user.instagram ? Linking.openURL(`https://instagram.com/${user.instagram.replace('@', '')}`) : Alert.alert('Aviso', 'No tienes un Instagram registrado. Haz click en Editar Perfil.')}
                      >
                        <Instagram size={20} color="#E1306C" />
                        <Text style={[styles.socialBtnText, { color: '#E1306C' }]}>
                          {user.instagram ? `@${user.instagram.replace('@', '')}` : 'Agregar Instagram'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.socialBtn, { backgroundColor: 'rgba(0, 242, 254, 0.1)', borderColor: 'rgba(0, 242, 254, 0.3)' }]}
                        onPress={() => user.tiktok ? Linking.openURL(`https://tiktok.com/@${user.tiktok.replace('@', '')}`) : Alert.alert('Aviso', 'No tienes un TikTok registrado. Haz click en Editar Perfil.')}
                      >
                        <Link size={20} color="#00F2FE" />
                        <Text style={[styles.socialBtnText, { color: '#00F2FE' }]}>
                          {user.tiktok ? `@${user.tiktok.replace('@', '')}` : 'Agregar TikTok'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'admin_users_override' && (
            <AdminUsers
              COLORS={COLORS}
              isMobile={isMobile}
              onBack={() => setActiveTab('dashboard')}
            />
          )}
        </ScrollView>

        {/* Cancellation Modal */}
        {showCancelModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: isMobile ? '95%' : 500 }]} data-glass="true">
              <View style={styles.modalHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <AlertCircle size={24} color="#EF4444" />
                </View>
                <TouchableOpacity onPress={() => setShowCancelModal(false)} style={styles.closeBtn}>
                  <X size={20} color="var(--text-muted)" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>Cancelar Cita</Text>
              <Text style={styles.modalSubtitle}>
                Esta acción enviará una notificación inmediata al cliente ({selectedApptForCancel?.userName}). Selecciona el motivo.
              </Text>

              <View style={styles.reasonsGrid}>
                {cancelReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    onPress={() => setCancellationType(reason.id)}
                    style={[
                      styles.reasonCapsule,
                      cancellationType === reason.id && styles.reasonCapsuleActive
                    ]}
                  >
                    <Text style={styles.reasonIcon}>{reason.icon}</Text>
                    <Text style={[
                      styles.reasonLabel,
                      cancellationType === reason.id && styles.reasonLabelActive
                    ]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Información adicional (Opcional)</Text>
                <View style={[styles.textAreaRow, { paddingVertical: 10 }]}>
                  <MessageSquare size={16} color="var(--gold)" style={{ marginTop: 4 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Escribe un motivo detallado para el cliente..."
                    placeholderTextColor="var(--text-muted)"
                    value={cancellationReason}
                    onChangeText={setCancellationReason}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCancelModal(false);
                    setSelectedApptForCancel(null);
                  }}
                  style={styles.cancelLink}
                >
                  <Text style={styles.cancelLinkText}>Volver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmCancellation}
                  style={styles.confirmCancelBtn}
                >
                  <Text style={styles.confirmCancelBtnText}>Confirmar Cancelación</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Break Confirmation Modal */}
        <Modal
          visible={showBreakConfirmModal && !!pendingBreakInfo}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowBreakConfirmModal(false);
            setIsOnBreak(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: isMobile ? '90%' : 420, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }]} data-glass="true">
              <View style={[styles.profileAvatarLarge, { 
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                width: 80, height: 80, borderRadius: 24, marginBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }]}>
                <Clock size={40} color="var(--gold)" />
              </View>

              <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 22, color: '#FFF', marginBottom: 12 }]}>
                Descanso Programado
              </Text>
              
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 32, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24 }]}>
                Tienes un descanso programado a las <Text style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{formatTime12h(pendingBreakInfo?.startTime || '')}</Text>.{"\n\n"}
                ¿Deseas adelantarlo a este momento o solo tomar un descanso temporal?
              </Text>

              <View style={{ gap: 12, width: '100%' }}>
                <TouchableOpacity
                  onPress={() => handleConfirmAdvanceBreak(true)}
                  style={[styles.confirmCancelBtn, { 
                    height: 54,
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 16,
                    backgroundColor: 'var(--gold)',
                    shadowColor: 'var(--gold)',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 5
                  }]}
                >
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>Adelantar Descanso</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleConfirmAdvanceBreak(false)}
                  style={[styles.socialBtn, { height: 54, width: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>Solo Descanso Temporal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowBreakConfirmModal(false);
                    setPendingBreakInfo(null);
                    setIsOnBreak(false);
                  }}
                  style={{ marginTop: 8, padding: 8, alignSelf: 'center' }}
                >
                  <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Status Confirmation Modal */}
        {showStatusConfirmModal && pendingStatusAppt && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: isMobile ? '95%' : 420, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }]} data-glass="true">
              <View style={[styles.iconBox, { 
                backgroundColor: pendingNewStatus === 'completed' ? 'rgba(16, 185, 129, 0.15)' :
                                pendingNewStatus === 'in_progress' ? 'rgba(245, 158, 11, 0.15)' :
                                pendingNewStatus === 'checked_in' ? 'rgba(59, 130, 246, 0.15)' :
                                'rgba(239, 68, 68, 0.15)',
                width: 80, height: 80, borderRadius: 24, marginBottom: 24,
                borderWidth: 1,
                borderColor: pendingNewStatus === 'completed' ? 'rgba(16, 185, 129, 0.3)' :
                             pendingNewStatus === 'in_progress' ? 'rgba(245, 158, 11, 0.3)' :
                             pendingNewStatus === 'checked_in' ? 'rgba(59, 130, 246, 0.3)' :
                             'rgba(239, 68, 68, 0.3)',
              }]}>
                {pendingNewStatus === 'completed' ? <CheckCircle2 size={40} color="#10B981" /> :
                 pendingNewStatus === 'in_progress' ? <Scissors size={40} color="#F59E0B" /> :
                 pendingNewStatus === 'checked_in' ? <User size={40} color="#3B82F6" /> :
                 <AlertCircle size={40} color="#EF4444" />}
              </View>

              <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 22, color: '#FFF', marginBottom: 12 }]}>
                {pendingNewStatus === 'completed' ? '¿Completar Cita?' :
                 pendingNewStatus === 'in_progress' ? '¿Iniciar Corte?' :
                 pendingNewStatus === 'checked_in' ? '¿Confirmar Llegada?' :
                 pendingNewStatus === 'cancelled' ? '¿Cancelar Cita?' :
                 '¿Confirmar Inasistencia?'}
              </Text>
              
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 32, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24 }]}>
                {pendingNewStatus === 'completed' ? `¿Confirmas que se completó el corte de ${pendingStatusAppt.userName}?` :
                 pendingNewStatus === 'in_progress' ? `¿Deseas confirmar que ya estás cortando a ${pendingStatusAppt.userName}?` :
                 pendingNewStatus === 'checked_in' ? `¿Confirmas que el cliente ${pendingStatusAppt.userName} ya llegó al local?` :
                 pendingNewStatus === 'cancelled' ? `¿Estás seguro de que deseas cancelar la cita de ${pendingStatusAppt.userName}? Se le enviará una notificación.` :
                 `¿Confirmas que el cliente ${pendingStatusAppt.userName} faltó a su cita?`}
              </Text>

              <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowStatusConfirmModal(false);
                    setPendingStatusAppt(null);
                    setPendingNewStatus('');
                  }}
                  style={[styles.actionBtn, { flex: 1, height: 54, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatusChange(pendingStatusAppt!.id, pendingNewStatus)}
                  style={[styles.actionBtn, { 
                    flex: 1,
                    height: 54,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 16,
                    backgroundColor: pendingNewStatus === 'completed' ? '#10B981' :
                                    pendingNewStatus === 'in_progress' ? '#F59E0B' :
                                    pendingNewStatus === 'checked_in' ? '#3B82F6' :
                                    '#EF4444',
                    borderColor: 'transparent',
                    shadowColor: pendingNewStatus === 'completed' ? '#10B981' :
                                pendingNewStatus === 'in_progress' ? '#F59E0B' :
                                pendingNewStatus === 'checked_in' ? '#3B82F6' :
                                '#EF4444',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 5
                  }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    gap: 32,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  dateText: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  breakBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'var(--gold-subtle)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakBtnText: {
    color: 'var(--gold)',
    fontSize: 14,
    fontWeight: '700',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleSection: {
    gap: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  appointmentList: {
    gap: 12,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  appTime: {
    width: 80,
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: 'var(--glass-border)',
    paddingRight: 16,
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  appInfo: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 4,
  },
  clientName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  serviceText: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  appStatus: {
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  upcomingSection: {
    gap: 20,
  },
  upcomingList: {
    gap: 12,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  upcomingDate: {
    alignItems: 'center',
    width: 40,
    marginRight: 16,
  },
  upMonth: {
    color: 'var(--gold)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  upDay: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  upInfo: {
    flex: 1,
    gap: 4,
  },
  upClient: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  upService: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'var(--gold-subtle)',
  },
  tabText: {
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'var(--gold)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginLeft: 96,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'var(--glass-surface)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabContent: {
    marginTop: 10,
    gap: 20,
  },
  metricsColumn: {
    gap: 16,
    flexDirection: 'column',
  },
  profileCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 2,
    borderColor: 'var(--gold)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileNameLarge: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileRoleLarge: {
    color: 'var(--gold)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 32,
  },
  profileDataList: {
    width: '100%',
    gap: 16,
  },
  profileDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'var(--glass-border)',
  },
  profileDataLabel: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  profileDataValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  editInput: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 150,
    textAlign: 'right',
  },
  socialContainer: {
    width: '100%',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'var(--glass-border)',
  },
  socialTitle: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  socialBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'var(--glass-border)',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  breakdownDay: {
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'var(--glass-border)',
  },
  dayDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reasonCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    gap: 6,
  },
  reasonCapsuleActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  reasonIcon: {
    fontSize: 14,
  },
  reasonLabel: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: '600',
  },
  reasonLabelActive: {
    color: '#EF4444',
  },
  inputContainer: {
    gap: 8,
    marginTop: 8,
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  textAreaRow: {
    flexDirection: 'row',
    backgroundColor: 'var(--glass-surface)',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  cancelLink: {
    padding: 8,
  },
  cancelLinkText: {
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmCancelBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmCancelBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
