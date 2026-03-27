import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  Alert
} from 'react-native';
import { updateAppointmentStatus, createAppointment } from '../services/appointments';
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
  Award
} from 'lucide-react';
import { formatFullDate, formatTime12h } from '../utils/formatters';
import MainLayout from './Navigation/MainLayout';
import { useSidebar } from '../context/SidebarContext';
import { Appointment, AppUser, UserRole } from '../types';

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
  const todaysEarnings = todaysAppointments.reduce((sum, app) => sum + (app.price || 0), 0);

  const allCompletedAppts = historyAppointments.filter(app => app.status === 'completed');
  const totalEarnings = allCompletedAppts.reduce((sum, app) => sum + (app.price || 0), 0);
  const thisWeekEarnings = allCompletedAppts.filter(app => {
    const diffTime = Math.abs(new Date().getTime() - new Date(app.date).getTime());
    return diffTime <= 7 * 24 * 60 * 60 * 1000;
  }).reduce((sum, app) => sum + (app.price || 0), 0);

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

      const dayEarnings = allCompletedAppts
        .filter(app => app.date === dateStr)
        .reduce((sum, app) => sum + (app.price || 0), 0);

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
        groups[monthYear] = (groups[monthYear] || 0) + (app.price || 0);
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
      .sort((a,b) => b[1] - a[1])
      .map(([service, count]) => ({ service, count }));
  }, [allCompletedAppts]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appId, newStatus as any, user.uid, 'barber');
      if (newStatus === 'completed') {
        Alert.alert('¡Excelente!', 'Cita marcada como completada.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita.');
      console.error(error);
    }
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
                  <Text style={styles.metricLabel}>Generado Hoy</Text>
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
                    <Text style={[styles.metricLabel, { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>Ingresos de los últimos 7 días</Text>
                    
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
                    <Text style={[styles.metricLabel, { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>Ingresos Totales (Histórico)</Text>
                    
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
              <Text style={styles.sectionTitle}>Mi Perfil</Text>
              <View style={styles.profileCard}>
                <View style={styles.profileAvatarLarge}>
                  <User size={48} color="var(--gold)" />
                </View>
                <Text style={styles.profileNameLarge}>{user.name}</Text>
                <Text style={styles.profileRoleLarge}>Especialista Barbero</Text>

                <View style={styles.profileDataList}>
                  <View style={styles.profileDataRow}>
                    <Text style={styles.profileDataLabel}>Correo Electrónico:</Text>
                    <Text style={styles.profileDataValue}>{user.email}</Text>
                  </View>
                  <View style={styles.profileDataRow}>
                    <Text style={styles.profileDataLabel}>Teléfono:</Text>
                    <Text style={styles.profileDataValue}>{user.phone || 'No registrado'}</Text>
                  </View>
                  <View style={styles.profileDataRow}>
                    <Text style={styles.profileDataLabel}>Sucursal Asignada:</Text>
                    <Text style={styles.profileDataValue}>{user.branch || 'Principal'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
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
  }
});
