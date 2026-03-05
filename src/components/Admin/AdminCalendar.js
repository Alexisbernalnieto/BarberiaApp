import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Helpers ─────────────────────────────────────────────
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/** Devuelve "YYYY-MM-DD" en zona local */
const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Devuelve el lunes (inicio) de la semana que contiene `date` */
const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=dom
    const diff = day === 0 ? -6 : 1 - day; // lunes
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/** Devuelve array de 7 Dates para la semana desde `weekStart` */
const getWeekDays = (weekStart) => {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });
};

// ─── Branches ────────────────────────────────────────────
const BRANCHES = [
    { key: 'all', label: 'Todas' },
    { key: 'centro', label: 'Centro' },
    { key: 'lomas', label: 'Lomas' },
];

// ─── Component ───────────────────────────────────────────
export default function AdminCalendar({ appointments, COLORS, isMobile, selectedDate, onDateChange }) {
    const { width } = useWindowDimensions();

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate || today));
    const [activeBranch, setActiveBranch] = useState('all');

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

    // ─── Filtrado ──────────────────────────────────────────
    const selectedDateStr = selectedDate ? toLocalDateStr(selectedDate) : toLocalDateStr(today);

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(app => {
                // Filtrar por fecha
                if (app.date !== selectedDateStr) return false;
                // Filtrar por sucursal
                if (activeBranch !== 'all') {
                    const appBranch = (app.branch || '').toLowerCase();
                    if (!appBranch.includes(activeBranch)) return false;
                }
                return true;
            })
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }, [appointments, selectedDateStr, activeBranch]);

    // ─── Resumen del día ──────────────────────────────────
    const dayTotal = filteredAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
    const dayCount = filteredAppointments.length;

    // ─── Navegación de semana ─────────────────────────────
    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    };
    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    };
    const goToToday = () => {
        if (onDateChange) onDateChange(today);
        setWeekStart(getWeekStart(today));
    };

    // ─── Saber si un día tiene citas ──────────────────────
    const datesWithAppointments = useMemo(() => {
        const set = new Set();
        appointments.forEach(a => {
            if (activeBranch === 'all' || (a.branch || '').toLowerCase().includes(activeBranch)) {
                set.add(a.date);
            }
        });
        return set;
    }, [appointments, activeBranch]);

    // ─── Responsive ───────────────────────────────────────
    const numColumns = width > 1200 ? 3 : width > 800 ? 2 : 1;
    const gap = 16;
    const listPadding = isMobile ? 0 : 0;
    const itemWidth = numColumns > 1
        ? (width - (isMobile ? 40 : 80) - listPadding * 2 - (numColumns - 1) * gap) / numColumns
        : '100%';

    // ─── Month & Year label ───────────────────────────────
    const monthLabel = `${MONTHS_ES[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;
    const monthLabelEnd = `${MONTHS_ES[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;
    const headerLabel = monthLabel === monthLabelEnd
        ? monthLabel
        : `${MONTHS_ES[weekDays[0].getMonth()]} – ${monthLabelEnd}`;

    const todayStr = toLocalDateStr(today);

    return (
        <View style={{ flex: 1 }}>

            {/* ═══════ TÍTULO + HOY ═══════ */}
            <View style={styles.titleRow}>
                <Text style={[styles.sectionTitle, { color: COLORS.text, fontSize: isMobile ? 18 : 22 }]}>Agenda</Text>
                <TouchableOpacity
                    onPress={goToToday}
                    style={[styles.todayBtn, { borderColor: COLORS.primary }]}
                    dataSet={{ branchTab: 'true' }}
                >
                    <MaterialCommunityIcons name="calendar-today" size={16} color={COLORS.primary} />
                    <Text style={[styles.todayBtnText, { color: COLORS.primary }]}>Hoy</Text>
                </TouchableOpacity>
            </View>

            {/* ═══════ BRANCH TABS ═══════ */}
            <View style={styles.branchRow}>
                {BRANCHES.map(b => {
                    const isActive = activeBranch === b.key;
                    return (
                        <TouchableOpacity
                            key={b.key}
                            onPress={() => setActiveBranch(b.key)}
                            style={[
                                styles.branchTab,
                                {
                                    backgroundColor: isActive ? COLORS.primary : COLORS.surface,
                                    borderColor: isActive ? COLORS.primary : COLORS.border,
                                },
                            ]}
                            dataSet={{ branchTab: 'true' }}
                        >
                            <Text
                                style={[
                                    styles.branchTabText,
                                    { color: isActive ? '#FFFFFF' : COLORS.textSecondary },
                                ]}
                            >
                                {b.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ═══════ WEEK NAVIGATOR ═══════ */}
            <View style={[styles.weekContainer, { backgroundColor: COLORS.surface, borderColor: COLORS.border, padding: isMobile ? 8 : 12 }]}>
                {/* Header: month + arrows */}
                <View style={styles.weekHeader}>
                    <TouchableOpacity onPress={prevWeek} style={styles.arrowBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.monthText, { color: COLORS.text }]}>{headerLabel}</Text>
                    <TouchableOpacity onPress={nextWeek} style={styles.arrowBtn}>
                        <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Days row */}
                <View style={styles.daysRow}>
                    {weekDays.map((day, idx) => {
                        const dateStr = toLocalDateStr(day);
                        const isSelected = dateStr === selectedDateStr;
                        const isToday = dateStr === todayStr;
                        const hasAppointments = datesWithAppointments.has(dateStr);

                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                    if (onDateChange) onDateChange(day);
                                }}
                                style={[
                                    styles.dayCell,
                                    isSelected && { backgroundColor: COLORS.primary },
                                    !isSelected && isToday && { borderColor: COLORS.primary, borderWidth: 2 },
                                ]}
                                dataSet={{ dayCell: 'true' }}
                            >
                                <Text
                                    style={[
                                        styles.dayLabel,
                                        { color: isSelected ? '#FFFFFF' : COLORS.textSecondary },
                                    ]}
                                >
                                    {DAYS_ES[day.getDay()]}
                                </Text>
                                <Text
                                    style={[
                                        styles.dayNumber,
                                        {
                                            color: isSelected ? '#FFFFFF' : COLORS.text,
                                            fontWeight: isToday ? '900' : '600',
                                        },
                                    ]}
                                >
                                    {day.getDate()}
                                </Text>
                                {/* Dot indicator */}
                                {hasAppointments && (
                                    <View
                                        style={[
                                            styles.dot,
                                            { backgroundColor: isSelected ? '#FFFFFF' : COLORS.primary },
                                        ]}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ═══════ DAY SUMMARY ═══════ */}
            <View style={[styles.summaryRow, { borderColor: COLORS.border, flexWrap: 'wrap', gap: isMobile ? 8 : 12 }]}>
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="calendar-check" size={18} color={COLORS.primary} />
                    <Text style={[styles.summaryValue, { color: COLORS.text }]}>{dayCount}</Text>
                    <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>
                        {dayCount === 1 ? 'cita' : 'citas'}
                    </Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: COLORS.border }]} />
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="cash" size={18} color={COLORS.primary} />
                    <Text style={[styles.summaryValue, { color: COLORS.text }]}>${dayTotal.toLocaleString()}</Text>
                    <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>ingresos</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: COLORS.border }]} />
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="store" size={18} color={COLORS.primary} />
                    <Text style={[styles.summaryValue, { color: COLORS.text }]}>
                        {activeBranch === 'all' ? 'Todas' : activeBranch === 'centro' ? 'Centro' : 'Lomas'}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>sucursal</Text>
                </View>
            </View>

            {/* ═══════ APPOINTMENT LIST ═══════ */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
                {dayCount === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={COLORS.textSecondary + '60'} />
                        <Text style={[styles.emptyTitle, { color: COLORS.textSecondary }]}>
                            Sin citas este día
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary + '99' }]}>
                            Selecciona otro día o cambia de sucursal
                        </Text>
                    </View>
                ) : (
                    <View style={[
                        styles.cardGrid,
                        numColumns > 1 && { flexDirection: 'row', flexWrap: 'wrap', gap },
                    ]}>
                        {filteredAppointments.map((item, index) => (
                            <View
                                key={item.id || index}
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: COLORS.surface,
                                        borderLeftColor: item.type === 'Walk-in' ? COLORS.success : COLORS.primary,
                                        width: numColumns > 1 ? itemWidth : '100%',
                                    },
                                ]}
                                dataSet={{ calendarCard: 'true' }}
                            >
                                {/* Card Header: Time + Type Badge */}
                                <View style={styles.cardHeader}>
                                    <View style={[styles.timeBadge, { backgroundColor: COLORS.primary }]}>
                                        <MaterialCommunityIcons name="clock-outline" size={14} color="#FFF" />
                                        <Text style={styles.timeBadgeText}>{item.time}</Text>
                                    </View>
                                    <View style={[
                                        styles.typeBadge,
                                        {
                                            backgroundColor: item.type === 'Walk-in'
                                                ? COLORS.success + '20'
                                                : COLORS.primary + '20',
                                        }
                                    ]}>
                                        <Text style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: item.type === 'Walk-in' ? COLORS.success : COLORS.primary,
                                            textTransform: 'uppercase',
                                        }}>
                                            {item.type || 'Online'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Client */}
                                <View style={styles.cardRow}>
                                    <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
                                    <Text style={[styles.cardPrimary, { color: COLORS.text }]}>{item.userName}</Text>
                                </View>

                                {/* Service + Price */}
                                <View style={styles.cardRow}>
                                    <MaterialCommunityIcons name="content-cut" size={16} color={COLORS.textSecondary} />
                                    <Text style={[styles.cardSecondary, { color: COLORS.textSecondary }]}>
                                        {item.serviceName}
                                    </Text>
                                    <View style={[styles.priceBadge, { backgroundColor: COLORS.primary + '15' }]}>
                                        <Text style={[styles.priceText, { color: COLORS.primary }]}>${item.price}</Text>
                                    </View>
                                </View>

                                {/* Barber */}
                                <View style={styles.cardRow}>
                                    <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textSecondary} />
                                    <Text style={[styles.cardSecondary, { color: COLORS.textSecondary }]}>
                                        {item.barberName}
                                    </Text>
                                </View>

                                {/* Branch (only when "Todas") */}
                                {activeBranch === 'all' && (
                                    <View style={styles.cardRow}>
                                        <MaterialCommunityIcons name="store-outline" size={16} color={COLORS.textSecondary} />
                                        <Text style={[styles.cardSecondary, { color: COLORS.textSecondary }]}>
                                            {item.branch || '—'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
    // Title
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    todayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    todayBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Branch Tabs
    branchRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    branchTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    branchTabText: {
        fontSize: 14,
        fontWeight: '700',
    },

    // Week Navigator
    weekContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    arrowBtn: {
        padding: 4,
    },
    monthText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        marginHorizontal: 3,
        minHeight: 68,
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 18,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 4,
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    summaryLabel: {
        fontSize: 12,
    },
    summaryDivider: {
        width: 1,
        height: 20,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 6,
    },

    // Card Grid
    cardGrid: {},
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 5,
    },
    timeBadgeText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    cardPrimary: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    cardSecondary: {
        fontSize: 14,
        flex: 1,
    },
    priceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priceText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
