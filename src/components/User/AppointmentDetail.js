import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppointmentDetail({ visible, appointment, onClose, COLORS, isMobile }) {
    if (!appointment) return null;

    const isPast = (() => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return appointment.date < todayStr;
    })();

    const paymentMethod = appointment.paymentIntentId ? 'Tarjeta' : 'Efectivo';
    const paymentIcon = appointment.paymentIntentId ? 'credit-card-outline' : 'cash';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, {
                    backgroundColor: COLORS.surface,
                    maxWidth: isMobile ? '95%' : 480,
                    borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.08)',
                }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* ═══ TICKET HEADER ═══ */}
                        <View style={[styles.ticketHeader, {
                            backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.06)' : 'rgba(212, 175, 55, 0.04)',
                            borderBottomColor: COLORS.border,
                        }]}>
                            <MaterialCommunityIcons name="content-cut" size={28} color={COLORS.primary} />
                            <Text style={[styles.ticketTitle, { color: COLORS.primary }]}>EL CORONEL BARBÓN</Text>
                            <Text style={[styles.ticketSubtitle, { color: COLORS.textSecondary }]}>RESUMEN DE CITA</Text>
                        </View>

                        {/* ═══ STATUS BADGE ═══ */}
                        <View style={styles.statusSection}>
                            <View style={[styles.statusBadge, {
                                backgroundColor: isPast
                                    ? (COLORS.mode === 'dark' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)')
                                    : (COLORS.mode === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)'),
                                borderColor: isPast ? '#10B981' : '#3B82F6',
                            }]}>
                                <MaterialCommunityIcons
                                    name={isPast ? 'check-circle' : 'clock-outline'}
                                    size={16}
                                    color={isPast ? '#10B981' : '#3B82F6'}
                                />
                                <Text style={[styles.statusText, { color: isPast ? '#10B981' : '#3B82F6' }]}>
                                    {isPast ? 'Completada' : (appointment.status || 'Confirmada')}
                                </Text>
                            </View>
                            {appointment.type && (
                                <View style={[styles.typeBadge, { backgroundColor: COLORS.primary + '15' }]}>
                                    <Text style={[styles.typeText, { color: COLORS.primary }]}>
                                        {appointment.type}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* ═══ DETAILS ═══ */}
                        <View style={styles.detailsSection}>

                            {/* Servicio */}
                            <DetailRow
                                icon="content-cut"
                                label="SERVICIO"
                                value={appointment.serviceName || '—'}
                                COLORS={COLORS}
                            />

                            {/* Barbero */}
                            <DetailRow
                                icon="account-tie"
                                label="BARBERO"
                                value={appointment.barberName || '—'}
                                COLORS={COLORS}
                            />

                            {/* Sucursal */}
                            <DetailRow
                                icon="store-outline"
                                label="SUCURSAL"
                                value={appointment.branch || 'Centro'}
                                COLORS={COLORS}
                            />

                            <View style={[styles.divider, { borderColor: COLORS.border }]} />

                            {/* Fecha */}
                            <DetailRow
                                icon="calendar-month"
                                label="FECHA"
                                value={appointment.date || '—'}
                                COLORS={COLORS}
                            />

                            {/* Hora */}
                            <DetailRow
                                icon="clock-outline"
                                label="HORA"
                                value={appointment.time || '—'}
                                COLORS={COLORS}
                            />

                            {/* Duración */}
                            {appointment.duration && (
                                <DetailRow
                                    icon="timer-outline"
                                    label="DURACIÓN"
                                    value={`${appointment.duration} min`}
                                    COLORS={COLORS}
                                />
                            )}

                            <View style={[styles.divider, { borderColor: COLORS.border }]} />

                            {/* Método de pago */}
                            <DetailRow
                                icon={paymentIcon}
                                label="MÉTODO DE PAGO"
                                value={paymentMethod}
                                COLORS={COLORS}
                            />

                            {/* ID de pago (si existe) */}
                            {appointment.paymentIntentId && (
                                <DetailRow
                                    icon="identifier"
                                    label="ID TRANSACCIÓN"
                                    value={appointment.paymentIntentId.slice(-8).toUpperCase()}
                                    COLORS={COLORS}
                                    mono
                                />
                            )}

                        </View>

                        {/* ═══ TOTAL ═══ */}
                        <View style={[styles.totalSection, {
                            backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.06)' : 'rgba(212, 175, 55, 0.04)',
                            borderTopColor: COLORS.border,
                        }]}>
                            <Text style={[styles.totalLabel, { color: COLORS.text }]}>TOTAL</Text>
                            <Text style={[styles.totalValue, { color: COLORS.primary }]}>
                                ${(appointment.price || 0).toLocaleString()} MXN
                            </Text>
                        </View>

                        {/* Ticket holes decoration */}
                        <View style={[styles.ticketHole, styles.holeLeft, { backgroundColor: COLORS.mode === 'dark' ? '#000' : '#F5F3EF' }]} />
                        <View style={[styles.ticketHole, styles.holeRight, { backgroundColor: COLORS.mode === 'dark' ? '#000' : '#F5F3EF' }]} />

                    </ScrollView>

                    {/* ═══ CLOSE BUTTON ═══ */}
                    <TouchableOpacity
                        style={[styles.closeBtn, {
                            borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.closeBtnText, { color: COLORS.text }]}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function DetailRow({ icon, label, value, COLORS, mono }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
                <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>{label}</Text>
            </View>
            <Text style={[
                styles.detailValue,
                { color: COLORS.text },
                mono && { fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, letterSpacing: 1 },
            ]}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        ...Platform.select({
            web: { backdropFilter: 'blur(8px)' },
        }),
    },
    container: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
        ...Platform.select({
            web: {
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 80px rgba(212, 175, 55, 0.05)',
            },
            default: {
                elevation: 20,
            },
        }),
    },

    // Ticket Header
    ticketHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderStyle: 'dashed',
    },
    ticketTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 3,
        marginTop: 8,
    },
    ticketSubtitle: {
        fontSize: 10,
        letterSpacing: 3,
        fontWeight: '600',
        marginTop: 4,
    },

    // Status
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // Details
    detailsSection: {
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        flexShrink: 1,
        marginLeft: 12,
    },
    divider: {
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        marginVertical: 4,
        opacity: 0.4,
    },

    // Total
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderStyle: 'dashed',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
    },

    // Ticket holes
    ticketHole: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    holeLeft: {
        left: -10,
        top: '60%',
    },
    holeRight: {
        right: -10,
        top: '60%',
    },

    // Close
    closeBtn: {
        marginHorizontal: 24,
        marginVertical: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
