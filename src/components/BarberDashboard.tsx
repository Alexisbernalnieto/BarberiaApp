import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Calendar, Clock, TrendingUp, Scissors, ChevronRight, Sun, Moon, LogOut, CheckCircle2, Menu } from 'lucide-react';
import MainLayout from './Navigation/MainLayout';
import { useSidebar } from '../context/SidebarContext';

export default function BarberDashboard({ appointments, user, onLogout, COLORS, toggleTheme, isDarkMode, isMobile: isMobileProp }: any) {
    const { width } = useWindowDimensions();
    const isMobile = isMobileProp ?? width < 768;
    const { setIsOpen } = useSidebar();
    const [activeTab, setActiveTab] = useState('dashboard');

    const myAppointments = useMemo(() => {
        return appointments.filter((app: any) => app.barberId === user.uid || app.barberName === user.name);
    }, [appointments, user]);

    return (
        <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} COLORS={COLORS} user={user}>
            <View style={styles.contentWrapper}>
                <ScrollView style={styles.contentArea} contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 20 : 40 }]}>
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

                    <View style={[styles.metricsRow, isMobile && { flexDirection: 'column' }]}>
                        <View style={styles.metricCard}>
                            <Calendar size={20} color="var(--gold)" />
                            <Text style={styles.metricValue}>{myAppointments.length}</Text>
                            <Text style={styles.metricLabel}>Citas Totales</Text>
                        </View>
                    </View>

                    <View style={styles.scheduleSection}>
                        <Text style={styles.sectionTitle}>Mi Agenda</Text>
                        {myAppointments.map((app: any) => (
                            <View key={app.id} style={styles.appCard}>
                                <View style={styles.appTime}>
                                    <Clock size={16} color="var(--gold)" />
                                    <Text style={styles.timeText}>{app.time}</Text>
                                </View>
                                <View style={styles.appInfo}>
                                    <Text style={styles.clientName}>{app.userName}</Text>
                                    <Text style={styles.serviceText}>{app.serviceName}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </MainLayout>
    );
}

const styles = StyleSheet.create({
  contentWrapper: { flex: 1 },
  contentArea: { flex: 1 },
  scrollContent: { gap: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--glass-surface)', borderWidth: 1, borderColor: 'var(--glass-border)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontWeight: '800', color: '#FFF' },
  dateText: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--glass-surface)', borderWidth: 1, borderColor: 'var(--glass-border)', alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', gap: 20 },
  metricCard: { flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'var(--glass-border)', flexDirection: 'row', alignItems: 'center', gap: 16 },
  metricValue: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  metricLabel: { color: 'var(--text-muted)', fontSize: 12 },
  scheduleSection: { gap: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  appCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'var(--glass-border)' },
  appTime: { width: 80, alignItems: 'center', gap: 4, borderRightWidth: 1, borderRightColor: 'var(--glass-border)', paddingRight: 16 },
  timeText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  appInfo: { flex: 1, paddingHorizontal: 16, gap: 4 },
  clientName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  serviceText: { color: 'var(--text-secondary)', fontSize: 13 }
});
