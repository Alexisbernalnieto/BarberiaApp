import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BarberDashboard({ appointments, user, onLogout, COLORS, toggleTheme, isDarkMode }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isSmall = width < 400;

    const styles = getStyles(COLORS, isMobile, isSmall);

    // Filtrar citas asignadas a este barbero
    const myAppointments = appointments.filter(app => {
        const appBarber = (app.barberName || '').toLowerCase().trim();
        const myName = (user?.name || '').toLowerCase().trim();
        return appBarber === myName;
    });

    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = myAppointments.filter(app => app.date === today);
    const todaysEarnings = todaysAppointments.reduce((sum, app) => sum + (app.price || 0), 0);

    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Panel de Barbero</Text>
                    <Text style={styles.subtitle}>Hola, {user?.name || 'Barbero'}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
                        <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={isMobile ? 20 : 24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <MaterialCommunityIcons name="logout" size={isMobile ? 18 : 20} color={COLORS.error} />
                        {!isMobile && <Text style={styles.logoutText}>Salir</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Métricas Rápidas */}
                <View style={styles.metricsContainer}>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="calendar-check" size={isMobile ? 24 : 30} color={COLORS.primary} />
                        <View>
                            <Text style={styles.metricValue}>{todaysAppointments.length}</Text>
                            <Text style={styles.metricLabel}>Citas Hoy</Text>
                        </View>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="cash" size={isMobile ? 24 : 30} color="#10B981" />
                        <View>
                            <Text style={styles.metricValue}>${todaysEarnings.toLocaleString()}</Text>
                            <Text style={styles.metricLabel}>Generado Hoy</Text>
                        </View>
                    </View>
                </View>

                {/* Lista de Citas */}
                <Text style={styles.sectionTitle}>Tu Agenda de Hoy</Text>

                {todaysAppointments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank" size={isMobile ? 40 : 50} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>No tienes citas programadas para hoy.</Text>
                    </View>
                ) : (
                    todaysAppointments.map((app) => (
                        <View key={app.id} style={styles.appointmentCard}>
                            <View style={[styles.appTime, { backgroundColor: COLORS.primary }]}>
                                <Text style={styles.timeText}>{app.time}</Text>
                            </View>
                            <View style={styles.appInfo}>
                                <Text style={styles.clientName}>{app.userName || app.clientName || 'Cliente'}</Text>
                                <Text style={styles.serviceName}>{app.serviceName} • ${app.price}</Text>
                            </View>
                            <View style={styles.appStatus}>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Confirmada</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Próximas Citas</Text>
                {myAppointments.filter(app => app.date > today).length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No hay citas próximas.</Text>
                    </View>
                ) : (
                    myAppointments.filter(app => app.date > today).slice(0, 5).map((app) => (
                        <View key={app.id} style={[styles.appointmentCard, { borderLeftColor: COLORS.textSecondary, opacity: 0.8 }]}>
                            <View style={[styles.appTime, { backgroundColor: COLORS.textSecondary }]}>
                                <Text style={styles.timeText}>{app.date}</Text>
                            </View>
                            <View style={styles.appInfo}>
                                <Text style={styles.clientName}>{app.time}</Text>
                                <Text style={styles.serviceName}>{app.serviceName}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const getStyles = (COLORS, isMobile, isSmall) => StyleSheet.create({
    container: {
        flex: 1,
        padding: isMobile ? 16 : 40,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: isMobile ? 14 : 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: isMobile ? 16 : 20,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: isMobile ? 8 : 15,
    },
    title: {
        fontSize: isMobile ? 20 : 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: isMobile ? 13 : 14,
        color: COLORS.textSecondary,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderRadius: 8,
        gap: 5,
    },
    logoutText: {
        color: COLORS.error,
        fontWeight: 'bold',
        fontSize: 13,
    },
    iconBtn: {
        padding: 8,
    },
    metricsContainer: {
        flexDirection: isSmall ? 'column' : 'row',
        gap: isMobile ? 12 : 15,
        marginBottom: isMobile ? 20 : 30,
    },
    metricCard: {
        flex: isSmall ? undefined : 1,
        padding: isMobile ? 16 : 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: isMobile ? 12 : 15,
        elevation: 2,
        backgroundColor: COLORS.surface,
    },
    metricValue: {
        fontSize: isMobile ? 20 : 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    metricLabel: {
        fontSize: isMobile ? 11 : 12,
        color: COLORS.textSecondary,
    },
    sectionTitle: {
        fontSize: isMobile ? 16 : 18,
        fontWeight: 'bold',
        marginBottom: isMobile ? 12 : 15,
        color: COLORS.text,
    },
    emptyState: {
        alignItems: 'center',
        padding: isMobile ? 30 : 40,
        opacity: 0.6,
    },
    emptyText: {
        color: COLORS.textSecondary,
        marginTop: 10,
        fontSize: isMobile ? 13 : 14,
        textAlign: 'center',
    },
    appointmentCard: {
        flexDirection: 'row',
        padding: isMobile ? 12 : 15,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        alignItems: 'center',
        elevation: 1,
        backgroundColor: COLORS.surface,
    },
    appTime: {
        paddingVertical: 5,
        paddingHorizontal: isMobile ? 8 : 10,
        borderRadius: 6,
        marginRight: isMobile ? 10 : 15,
    },
    timeText: {
        fontWeight: 'bold',
        fontSize: isMobile ? 12 : 14,
        color: COLORS.white || '#FFFFFF',
    },
    appInfo: {
        flex: 1,
    },
    clientName: {
        fontWeight: 'bold',
        fontSize: isMobile ? 14 : 16,
        color: COLORS.text,
    },
    serviceName: {
        fontSize: isMobile ? 12 : 14,
        color: COLORS.textSecondary,
    },
    appStatus: {},
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    statusText: {
        color: 'white',
        fontSize: isMobile ? 9 : 10,
        fontWeight: 'bold',
    },
});