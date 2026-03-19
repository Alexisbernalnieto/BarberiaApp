import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions, 
  Animated 
} from 'react-native';
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
    Menu
} from 'lucide-react';
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
    const todaysAppointments = myAppointments.filter(app => app.date === today);
    const todaysEarnings = todaysAppointments.reduce((sum, app) => sum + (app.price || 0), 0);

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
                            <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
                                {isDarkMode ? <Sun size={20} color="var(--gold)" /> : <Moon size={20} color="var(--text-secondary)" />}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.headerBtn, { borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={onLogout}>
                                <LogOut size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

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
                                {todaysAppointments.map((app) => (
                                    <View key={app.id} style={styles.appCard} data-glass="true">
                                        <View style={styles.appTime}>
                                            <Clock size={16} color="var(--gold)" />
                                            <Text style={styles.timeText}>{app.time}</Text>
                                        </View>
                                        <View style={styles.appInfo}>
                                            <Text style={styles.clientName}>{app.userName || 'Cliente'}</Text>
                                            <Text style={styles.serviceText}>{app.serviceName} • ${app.price}</Text>
                                        </View>
                                        <View style={styles.appStatus}>
                                            <View style={styles.statusBadge}>
                                                <CheckCircle2 size={14} color="#10B981" />
                                                <Text style={styles.statusText}>Confirmada</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Upcoming */}
                    <View style={styles.upcomingSection}>
                        <Text style={styles.sectionTitle}>Próximos Días</Text>
                        <View style={styles.upcomingList}>
                            {myAppointments.filter(app => app.date > today).slice(0, 3).map((app) => (
                                <View key={app.id} style={styles.upcomingItem}>
                                    <View style={styles.upcomingDate}>
                                        <Text style={styles.upMonth}>{new Date(app.date).toLocaleDateString('es-ES', { month: 'short' })}</Text>
                                        <Text style={styles.upDay}>{new Date(app.date).getDate()}</Text>
                                    </View>
                                    <View style={styles.upInfo}>
                                        <Text style={styles.upClient}>{app.userName}</Text>
                                        <Text style={styles.upService}>{app.serviceName} • {app.time}</Text>
                                    </View>
                                    <ChevronRight size={18} color="var(--text-muted)" />
                                </View>
                            ))}
                        </View>
                    </View>
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
  }
});
