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
  Linking
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
import { formatFullDate, formatTime12h } from '../utils/formatters';
import MainLayout from './Navigation/MainLayout';
import AdminUsers from './Admin/AdminUsers';
import { useSidebar } from '../context/SidebarContext';
import { Appointment, AppUser, UserRole } from '../types';
import { notifyCancellationToClient } from '../services/notificationDispatcher';

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
  const [showWeeklyBreakdown, setShowWeeklyBreakdown] = useState(false);
  const [showHistoricalBreakdown, setShowHistoricalBreakdown] = useState(false);
  const [showServicesBreakdown, setShowServicesBreakdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedApptForCancel, setSelectedApptForCancel] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationType, setCancellationType] = useState('other');

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

  const today = new Date().toISOString().split('T')[0];

  // Sort and filter upcoming
  const upcomingAppointments = useMemo(() => {
    return myAppointments
      .filter(app => app.date >= today)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dateA - dateB;
      });
  }, [myAppointments, today]);

  // Sort and filter history
  const historyAppointments = useMemo(() => {
    return myAppointments
      .filter(app => app.date < today)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dateB - dateA; // descending
      });
  }, [myAppointments, today]);

  const todaysAppointments = upcomingAppointments.filter(app => app.date === today);
  const todaysGross = todaysAppointments.reduce((sum, app) => sum + (app.price || 0), 0);
  const todaysEarnings = todaysGross * 0.5; // 50% commission

  const allCompletedAppts = historyAppointments.filter(app => app.status === 'completed');
  const totalGross = allCompletedAppts.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalEarnings = totalGross * 0.5; // 50% commission

  const thisWeekGross = allCompletedAppts.filter(app => {
    const diffTime = Math.abs(new Date().getTime() - new Date(app.date).getTime());
    return diffTime <= 7 * 24 * 60 * 60 * 1000;
  }).reduce((sum, app) => sum + (app.price || 0), 0);
  const thisWeekEarnings = thisWeekGross * 0.5;

  const last7DaysBreakdown = useMemo(() => {
    const breakdown = [];
    const todayD = new Date();
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(todayD);
      d.setDate(todayD.getDate() - i);

      const dateStr = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
      ].join('-');

      const dayGross = allCompletedAppts
        .filter(app => app.date === dateStr)
        .reduce((sum, app) => sum + (app.price || 0), 0);
      const dayEarnings = dayGross * 0.5;

      breakdown.push({
        date: dateStr,
        dayName: days[d.getDay()],
        formattedDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        earnings: dayEarnings
      });
    }
    return breakdown;
  }, [allCompletedAppts]);

  const historicalBreakdown = useMemo(() => {
    const groups: { [monthYear: string]: number } = {};
    allCompletedAppts.forEach(app => {
      // Create date object
      const parts = app.date.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const monthYear = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        // Add 50% commission to group
        groups[monthYear] = (groups[monthYear] || 0) + ((app.price || 0) * 0.5);
      }
    });
    return Object.entries(groups)
      .map(([period, earnings]) => ({ period: period.charAt(0).toUpperCase() + period.slice(1), earnings }))
      .slice(0, 12);
  }, [allCompletedAppts]);

  const servicesBreakdown = useMemo(() => {
    const groups: { [service: string]: number } = {};
    allCompletedAppts.forEach(app => {
      const sName = app.serviceName || 'Otros';
      groups[sName] = (groups[sName] || 0) + 1;
    });
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .map(([service, count]) => ({ service, count }));
  }, [allCompletedAppts]);

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
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita.');
      console.error(error);
    }
  };

  const confirmCancellation = () => {
    if (!selectedApptForCancel) return;

    handleStatusChange(selectedApptForCancel.id, 'cancelled', {
      reason: cancellationReason || 'Cancelado por el barbero',
      type: cancellationType
    });
  };

  const getNextHalfHour = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const isPastHalf = minutes >= 30;

    // Advance to next half hour block
    now.setHours(now.getHours() + (isPastHalf ? 1 : 0));
    now.setMinutes(isPastHalf ? 0 : 30);

    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleTakeBreak = () => {
    const nextTime = getNextHalfHour();
    Alert.alert(
      'Tomar un descanso',
      `¿Deseas bloquear tu agenda a las ${nextTime} por 30 minutos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await createAppointment({
                userId: 'system',
                userName: '☕ Descanso (Bloqueado)',
                branch: user.branch || 'Principal',
                barberId: user.uid,
                barberName: user.name || 'Barbero',
                date: today,
                time: nextTime,
                serviceId: 'break',
                serviceName: 'Descanso de 30m',
                price: 0,
                duration: 30
              });
              Alert.alert('Éxito', 'Ese horario ha sido bloqueado exitosamente.');
            } catch (error: any) {
              Alert.alert('Aviso', error.message || 'No se pudo bloquear el horario.');
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'Completada', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'En Local': return { text: 'En Barbería', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'in_progress': return { text: 'Cortando', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'no_show': return { text: 'No Asistió', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'cancelled': return { text: 'Cancelada', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
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
                <Text style={styles.dateText}>Tu agenda para hoy</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.breakBtn} onPress={handleTakeBreak}>
                <Text style={styles.breakBtnText}>☕ Descanso</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
                {isDarkMode ? <Sun size={20} color="var(--gold)" /> : <Moon size={20} color="var(--text-secondary)" />}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={onLogout}>
                <LogOut size={20} color="#EF4444" />
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
                  <Text style={styles.metricLabel}>Ganancia Neta (50%)</Text>
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
                                <TouchableOpacity onPress={() => handleStatusChange(app.id, 'En Local')} style={[styles.actionBtn, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                                  <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Llegó</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleStatusChange(app.id, 'in_progress')} style={[styles.actionBtn, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                                  <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Cortando</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleStatusChange(app.id, 'completed')} style={[styles.actionBtn, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                                  <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Completó</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleStatusChange(app.id, 'no_show')} style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Faltó</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedApptForCancel(app);
                                    setShowCancelModal(true);
                                  }}
                                  style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.6)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
                                >
                                  <Text style={[styles.actionBtnText, { color: '#EF4444', fontWeight: 'bold' }]}>Cancelar</Text>
                                </TouchableOpacity>
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
                    {upcomingAppointments.filter(app => app.date > today).slice(0, 5).map((app) => (
                      <View key={app.id} style={styles.upcomingItem}>
                        <View style={styles.upcomingDate}>
                          <Text style={[styles.upDay, { fontSize: 13, textAlign: 'center' }]}>{formatFullDate(app.date).split(' ')[0]}</Text>
                          <Text style={[styles.upDay, { fontSize: 18, fontWeight: '900' }]}>{new Date(app.date).getDate() + 1}</Text>
                        </View>
                        <View style={styles.upInfo}>
                          <Text style={styles.upClient}>{app.userName}</Text>
                          <Text style={styles.upService}>{app.serviceName} • {formatTime12h(app.time)}</Text>
                        </View>
                        <ChevronRight size={18} color="var(--text-muted)" />
                      </View>
                    ))}
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
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Tus Métricas Globales</Text>
              <View style={[styles.metricsRow, isMobile ? { flexDirection: 'column' } : { flexWrap: 'wrap', gap: 24 }]}>

                <View style={{
                  flex: isMobile ? undefined : 1, width: isMobile ? '100%' : 'auto', minWidth: 280, maxHeight: 280,
                  backgroundColor: 'var(--bg-card)', borderRadius: 20, borderWidth: 1, borderColor: 'var(--glass-border)',
                  overflow: 'hidden', marginBottom: isMobile ? 24 : 0, elevation: 4,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
                }}>
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 32, flexDirection: 'column', alignItems: 'center' }} showsVerticalScrollIndicator={true}>
                    <View style={[styles.iconBox, { backgroundColor: 'var(--gold-subtle)', marginBottom: 24 }]}>
                      <TrendingUp size={24} color="var(--gold)" />
                    </View>
                    <Text style={[styles.metricValue, { fontSize: 36, marginBottom: 8, textAlign: 'center' }]}>${thisWeekEarnings.toLocaleString()}</Text>
                    <Text style={[styles.metricLabel, { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>Mi Ganancia 7 Días (50%)</Text>

                    <TouchableOpacity
                      style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'var(--bg-card)', borderRadius: 24, borderWidth: 1, borderColor: 'var(--gold-subtle)' }}
                      onPress={() => {
                        setShowWeeklyBreakdown(!showWeeklyBreakdown);
                        setShowHistoricalBreakdown(false);
                        setShowServicesBreakdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: 'var(--gold)', fontSize: 12, fontWeight: '700', marginRight: 8 }}>
                        {showWeeklyBreakdown ? 'OCULTAR DESGLOSE' : 'VER DESGLOSE'}
                      </Text>
                      <View style={{ transform: [{ rotate: showWeeklyBreakdown ? '-90deg' : '90deg' }] }}>
                        <ChevronRight size={16} color="var(--gold)" />
                      </View>
                    </TouchableOpacity>

                    {showWeeklyBreakdown && (
                      <View style={[styles.breakdownContainer, { width: '100%', marginTop: 24, paddingTop: 16, backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                        {last7DaysBreakdown.map((day, idx) => (
                          <View key={idx} style={[
                            styles.breakdownRow,
                            idx === last7DaysBreakdown.length - 1 && { borderBottomWidth: 0 }
                          ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={[styles.dayDot, day.earnings > 0 && styles.dayDotActive]} />
                              <Text style={styles.breakdownDay}>{day.dayName} {day.formattedDate}</Text>
                            </View>
                            <Text style={[
                              styles.breakdownAmount,
                              day.earnings > 0 ? { color: '#10B981' } : { color: 'var(--text-muted)' }
                            ]}>
                              ${day.earnings.toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                </View>

                <View style={{
                  flex: isMobile ? undefined : 1, width: isMobile ? '100%' : 'auto', minWidth: 280, maxHeight: 280,
                  backgroundColor: 'var(--bg-card)', borderRadius: 20, borderWidth: 1, borderColor: 'var(--glass-border)',
                  overflow: 'hidden', marginBottom: isMobile ? 24 : 0, elevation: 4,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
                }}>
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 32, flexDirection: 'column', alignItems: 'center' }} showsVerticalScrollIndicator={true}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', marginBottom: 24 }]}>
                      <Award size={24} color="#10B981" />
                    </View>
                    <Text style={[styles.metricValue, { fontSize: 36, marginBottom: 8, textAlign: 'center' }]}>${totalEarnings.toLocaleString()}</Text>
                    <Text style={[styles.metricLabel, { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>Total Acumulado (50%)</Text>

                    <TouchableOpacity
                      style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'var(--bg-card)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)' }}
                      onPress={() => {
                        setShowHistoricalBreakdown(!showHistoricalBreakdown);
                        setShowWeeklyBreakdown(false);
                        setShowServicesBreakdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700', marginRight: 8 }}>
                        {showHistoricalBreakdown ? 'OCULTAR DESGLOSE' : 'VER DESGLOSE'}
                      </Text>
                      <View style={{ transform: [{ rotate: showHistoricalBreakdown ? '-90deg' : '90deg' }] }}>
                        <ChevronRight size={16} color="#10B981" />
                      </View>
                    </TouchableOpacity>

                    {showHistoricalBreakdown && (
                      <View style={[styles.breakdownContainer, { width: '100%', marginTop: 24, paddingTop: 16, backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                        {historicalBreakdown.length > 0 ? historicalBreakdown.map((item, idx) => (
                          <View key={idx} style={[
                            styles.breakdownRow,
                            idx === historicalBreakdown.length - 1 && { borderBottomWidth: 0 }
                          ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={[styles.dayDot, { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 4 }]} />
                              <Text style={styles.breakdownDay}>{item.period}</Text>
                            </View>
                            <Text style={[styles.breakdownAmount, { color: '#10B981' }]}>
                              ${item.earnings.toLocaleString()}
                            </Text>
                          </View>
                        )) : (
                          <Text style={[styles.breakdownDay, { textAlign: 'center', padding: 12 }]}>No hay datos</Text>
                        )}
                      </View>
                    )}
                  </ScrollView>
                </View>

                <View style={{
                  flex: isMobile ? undefined : 1, width: isMobile ? '100%' : 'auto', minWidth: 280, maxHeight: 280,
                  backgroundColor: 'var(--bg-card)', borderRadius: 20, borderWidth: 1, borderColor: 'var(--glass-border)',
                  overflow: 'hidden', marginBottom: 0, elevation: 4,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
                }}>
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 32, flexDirection: 'column', alignItems: 'center' }} showsVerticalScrollIndicator={true}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)', marginBottom: 24 }]}>
                      <CheckCircle2 size={24} color="#3B82F6" />
                    </View>
                    <Text style={[styles.metricValue, { fontSize: 36, marginBottom: 8, textAlign: 'center' }]}>{allCompletedAppts.length}</Text>
                    <Text style={[styles.metricLabel, { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>Cortes Completados</Text>

                    <TouchableOpacity
                      style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'var(--bg-card)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                      onPress={() => {
                        setShowServicesBreakdown(!showServicesBreakdown);
                        setShowWeeklyBreakdown(false);
                        setShowHistoricalBreakdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '700', marginRight: 8 }}>
                        {showServicesBreakdown ? 'OCULTAR DESGLOSE' : 'VER DESGLOSE'}
                      </Text>
                      <View style={{ transform: [{ rotate: showServicesBreakdown ? '-90deg' : '90deg' }] }}>
                        <ChevronRight size={16} color="#3B82F6" />
                      </View>
                    </TouchableOpacity>

                    {showServicesBreakdown && (
                      <View style={[styles.breakdownContainer, { width: '100%', marginTop: 24, paddingTop: 16, backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                        {servicesBreakdown.length > 0 ? servicesBreakdown.map((item, idx) => (
                          <View key={idx} style={[
                            styles.breakdownRow,
                            idx === servicesBreakdown.length - 1 && { borderBottomWidth: 0 }
                          ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={[styles.dayDot, { backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOpacity: 0.5, shadowRadius: 4 }]} />
                              <Text style={styles.breakdownDay}>{item.service}</Text>
                            </View>
                            <Text style={[styles.breakdownAmount, { color: '#FFF' }]}>
                              {item.count} {item.count === 1 ? 'corte' : 'cortes'}
                            </Text>
                          </View>
                        )) : (
                          <Text style={[styles.breakdownDay, { textAlign: 'center', padding: 12 }]}>Aún no hay cortes</Text>
                        )}
                      </View>
                    )}
                  </ScrollView>
                </View>

              </View>
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
