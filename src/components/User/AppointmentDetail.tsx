import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Clock, CreditCard, Banknote, Scissors, MapPin, X, Hash, ChevronRight, User } from 'lucide-react';
import { formatFullDate, formatTime12h } from '../../utils/formatters';
import { getPaymentMetadata, PaymentMetadata } from '../../services/payments';

const AppointmentDetail = ({ appointment, visible, onClose, COLORS }: any) => {
    const [metadata, setMetadata] = useState<PaymentMetadata | null>(null);
    const [loadingMeta, setLoadingMeta] = useState(false);

    useEffect(() => {
        if (visible && appointment?.paymentIntentId) {
            setLoadingMeta(true);
            getPaymentMetadata(appointment.paymentIntentId)
                .then(data => setMetadata(data))
                .catch(err => console.error("Could not fetch metadata:", err))
                .finally(() => setLoadingMeta(false));
        } else {
            setMetadata(null);
        }
    }, [visible, appointment]);

    if (!appointment) return null;

    const isPaidOnline = appointment.paymentIntentId || appointment.paid;
    const paymentMethod = isPaidOnline ? 'Tarjeta de Crédito / Débito' : 'Efectivo en Sucursal';

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: 'var(--bg-card)' }]}>
                    
                    <View style={styles.header}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.brandTitle}>EL CORONEL BARBÓN</Text>
                            <Text style={styles.brandSubtitle}>Peluquería y Barbería de alto nivel</Text>
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
                            <DetailRow icon={Hash} label="ID RESERVACIÓN" value={appointment.id} mono />
                            <DetailRow icon={MapPin} label="SUCURSAL" value={appointment.branch || 'Sucursal Matriz'} />
                            <DetailRow icon={User} label="BARBERO" value={appointment.barberName} />
                            <DetailRow icon={Scissors} label="SERVICIO" value={appointment.serviceName} />
                            <DetailRow icon={Clock} label="FECHA Y HORA" value={`${formatFullDate(appointment.date)} a las ${formatTime12h(appointment.time)}`} />
                            
                            <View style={styles.divider} />
                            
                            {/* PREMIUM TICKET SECTION */}
                            <DetailRow icon={isPaidOnline ? CreditCard : Banknote} label="MÉTODO DE PAGO" value={paymentMethod} />
                            
                            {isPaidOnline && appointment.paymentIntentId && (
                                <View style={styles.stripeCardBox}>
                                    <View style={styles.stripeCardHeader}>
                                        <Hash size={14} color="var(--gold)" />
                                        <Text style={styles.stripeCardTitle}>TICKET DE PAGO ORIGINAL</Text>
                                    </View>
                                    
                                    {loadingMeta ? (
                                        <View style={styles.metaLoading}>
                                            <ActivityIndicator size="small" color="var(--gold)" />
                                            <Text style={styles.metaLoadingText}>Recuperando de Stripe...</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.metaContent}>
                                            <View style={styles.metaRow}>
                                                <Text style={styles.metaLabel}>ID TRANSACCIÓN</Text>
                                                <Text style={[styles.metaValue, styles.monoText]}>{appointment.paymentIntentId.split('_').pop()?.toUpperCase()}</Text>
                                            </View>
                                            
                                            {metadata?.brand && metadata?.last4 && (
                                                <View style={styles.metaRow}>
                                                    <Text style={styles.metaLabel}>TARJETA USADA</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <View style={styles.cardBrandChip}>
                                                            <Text style={styles.cardBrandText}>{metadata.brand.toUpperCase()}</Text>
                                                        </View>
                                                        <Text style={styles.metaValue}>•••• {metadata.last4}</Text>
                                                    </View>
                                                </View>
                                            )}

                                            {metadata?.receipt_url && Platform.OS === 'web' && (
                                                <TouchableOpacity 
                                                    style={styles.receiptButton}
                                                    onPress={() => window.open(metadata.receipt_url as string, '_blank')}
                                                >
                                                    <Text style={styles.receiptButtonText}>Ver Recibo Oficial</Text>
                                                    <ChevronRight size={16} color="var(--gold)" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
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
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 14 },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0, marginRight: 16 },
    detailLabel: { color: 'var(--text-secondary)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    detailValue: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
    monoText: { fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: 'var(--gold)', letterSpacing: 1, flex: 1, textAlign: 'right' },
    divider: { height: 1, backgroundColor: 'var(--glass-border)', marginVertical: 8 },
    totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1, borderColor: 'var(--glass-border)' },
    totalLabel: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    totalValue: { color: 'var(--gold)', fontSize: 28, fontWeight: '900' },
    stripeCardBox: {
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    stripeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.1)',
        marginBottom: 16,
    },
    stripeCardTitle: {
        color: 'var(--gold)',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    metaLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 20,
    },
    metaLoadingText: {
        color: 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: '600',
    },
    metaContent: {
        gap: 16,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaLabel: {
        color: 'var(--text-secondary)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    metaValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right'
    },
    cardBrandChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
    },
    cardBrandText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    receiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        paddingVertical: 12,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    receiptButtonText: {
        color: 'var(--gold)',
        fontSize: 13,
        fontWeight: '700',
    }
});

export default AppointmentDetail;
