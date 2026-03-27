import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Clock, CreditCard, Banknote, Scissors, MapPin, X, Hash } from 'lucide-react';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

const AppointmentDetail = ({ appointment, visible, onClose, COLORS }: any) => {
    if (!appointment) return null;

    const isPaidOnline = appointment.paymentIntentId || appointment.paid;
    const paymentMethod = isPaidOnline ? 'Tarjeta de Crédito / Débito' : 'Efectivo en Sucursal';

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: 'var(--bg-card)' }]}>
                    
                    <View style={styles.header}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.brandTitle}>EL CORONEL</Text>
                            <Text style={styles.brandSubtitle}>BARBER SHOP</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={24} color="var(--text-secondary)" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        <View style={styles.statusSection}>
                            <View style={[styles.statusBadge, appointment.status === 'Confirmado' ? styles.confirmedBadge : styles.pendingBadge]}>
                                <View style={[styles.statusDot, appointment.status === 'Confirmado' ? { backgroundColor: '#10B981' } : { backgroundColor: '#F59E0B' }]} />
                                <Text style={[styles.statusText, appointment.status === 'Confirmado' ? { color: '#10B981' } : { color: '#F59E0B' }]}>
                                    {appointment.status || 'Confirmado'}
                                </Text>
                            </View>
                            <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                <Text style={styles.typeText}>{appointment.type || 'Online'}</Text>
                            </View>
                        </View>

                        <View style={styles.detailsList}>
                            <DetailRow icon={MapPin} label="SUCURSAL" value={appointment.branch || 'Sucursal Matriz'} />
                            <DetailRow icon={Scissors} label="SERVICIO" value={appointment.serviceName} />
                            <DetailRow icon={Clock} label="FECHA Y HORA" value={`${formatFullDate(appointment.date)} a las ${formatTime12h(appointment.time)}`} />
                            
                            <View style={styles.divider} />
                            
                            <DetailRow icon={isPaidOnline ? CreditCard : Banknote} label="MÉTODO DE PAGO" value={paymentMethod} />
                            
                            {appointment.paymentIntentId && (
                                <DetailRow 
                                    icon={Hash} 
                                    label="ID TRANSACCIÓN" 
                                    value={appointment.paymentIntentId.slice(-10).toUpperCase()} 
                                    mono 
                                />
                            )}
                        </View>

                        <View style={[styles.totalSection, { backgroundColor: 'rgba(212, 175, 55, 0.05)' }]}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>${appointment.price}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const DetailRow = ({ icon: Icon, label, value, mono }: any) => (
    <View style={styles.detailRow}>
        <View style={styles.detailLeft}>
            <Icon size={16} color="var(--gold)" />
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={[styles.detailValue, mono && styles.monoText]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({ web: { backdropFilter: 'blur(8px)' } as any })
    },
    container: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: '#111',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.15)',
        overflow: 'hidden',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    serviceName: {
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        color: '#FFF',
    },
    brandTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    brandSubtitle: { 
        color: 'rgba(255,255,255,0.4)', 
        fontSize: 10, 
        letterSpacing: 3, 
        fontWeight: '600', 
        marginTop: 4 
    },
    closeBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        maxHeight: '80vh' as any,
    },
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    confirmedBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
    pendingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    typeBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    typeText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    detailsList: { padding: 24, paddingTop: 0 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    detailLabel: { color: 'var(--text-secondary)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    detailValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    monoText: { fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: 'var(--gold)', letterSpacing: 1 },
    divider: { height: 1, backgroundColor: 'var(--glass-border)', marginVertical: 8 },
    totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1, borderColor: 'var(--glass-border)' },
    totalLabel: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    totalValue: { color: 'var(--gold)', fontSize: 28, fontWeight: '900' }
});

export default AppointmentDetail;
