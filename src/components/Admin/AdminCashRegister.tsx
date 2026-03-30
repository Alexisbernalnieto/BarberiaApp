import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Alert, Modal } from 'react-native';
import { AlertTriangle, CheckCircle2, Check } from 'lucide-react';
import { logActivity } from '../../services/activityLogs';

export default function AdminCashRegister({ appointments, onClose, COLORS, currentUser }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  const [currentDateObj, setCurrentDateObj] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState('Todas'); // 'Todas', 'Centro', 'Lomas'
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  } | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null);

  const dateStr = currentDateObj.toISOString().split('T')[0];

  // Helper arrays for Spanish date formatting
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Formats to: "Viernes 27 de Marzo 2026"
  const displayDateStr = `${diasSemana[currentDateObj.getDay()]} ${currentDateObj.getDate()} de ${meses[currentDateObj.getMonth()]} ${currentDateObj.getFullYear()}`;

  const goPrevDay = () => {
    const prev = new Date(currentDateObj);
    prev.setDate(prev.getDate() - 1);
    setCurrentDateObj(prev);
  };

  const goNextDay = () => {
    const next = new Date(currentDateObj);
    next.setDate(next.getDate() + 1);
    setCurrentDateObj(next);
  };

  // Filter appointments for the selected date and branch
  const filteredApps = appointments.filter((app: any) => {
    if (app.date !== dateStr) return false;
    
    // Check branch
    if (selectedBranch !== 'Todas') {
      const appBranch = app.branch || 'Centro';
      if (appBranch !== selectedBranch) return false;
    }

    // Only count completed/paid appointments for revenue
    return app.paid === true || app.status === 'completed';
  });

  const totalServices = filteredApps.length;
  
  // Breakdown by generic categories
  let totalRevenue = 0;
  let totalCash = 0;
  let totalCard = 0;
  
  // Breakdown by Barber
  const barberStats: Record<string, { earnings: number, services: number }> = {};

  filteredApps.forEach((app: any) => {
    const price = app.price || 0;
    totalRevenue += price;

    if (app.paymentMethod === 'Cash' || app.paymentMethod === 'Efectivo') {
      totalCash += price;
    } else if (app.paymentMethod === 'Card' || app.paymentMethod === 'Tarjeta') {
      totalCard += price;
    } else {
      // Default to cash if unknown but marked as paid
      totalCash += price;
    }

    const bName = app.barberName || 'Desconocido';
    if (!barberStats[bName]) {
      barberStats[bName] = { earnings: 0, services: 0 };
    }
    barberStats[bName].earnings += price;
    barberStats[bName].services += 1;
  });

  const handleCerrarCaja = () => {
    if (totalRevenue === 0) {
      setConfirmModal({
        visible: true,
        title: "Corte en Cero",
        message: "No hay ingresos registrados para hoy.\n¿Cerrar caja de todos modos?"
      });
    } else {
      setConfirmModal({
        visible: true,
        title: "Confirmar Cierre",
        message: `¿Confirmar cierre de caja por un total de $${totalRevenue.toLocaleString()}?`
      });
    }
  };

  const executeCorte = async () => {
    try {
      await logActivity({
        adminId: currentUser?.uid || 'admin',
        adminEmail: currentUser?.email || 'admin@barberia.com',
        adminRole: currentUser?.role || 'admin',
        action: 'Corte de Caja',
        details: `Corte de Caja (${selectedBranch}): Total $${totalRevenue} | Efectivo $${totalCash} | Tarjeta $${totalCard} | Fecha: ${dateStr}.`,
      });
      setSuccessModal("Corte de caja registrado exitosamente en el Historial.");
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined' && window.alert) window.alert("Error al registrar el corte.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CORTE DE CAJA</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>Cerrar</Text></TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateBtn} onPress={goPrevDay}>
            <Text style={styles.dateBtnText}>{'< Anterior'}</Text>
        </TouchableOpacity>
        <Text style={styles.currentDateText}>{displayDateStr}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={goNextDay}>
            <Text style={styles.dateBtnText}>{'Siguiente >'}</Text>
        </TouchableOpacity>
      </View>

      {/* Branch Filter */}
      <View style={styles.branchFilter}>
        {['Todas', 'Centro', 'Lomas'].map(branch => (
            <TouchableOpacity 
                key={branch}
                style={[styles.branchBtn, selectedBranch === branch && styles.activeBranchBtn]}
                onPress={() => setSelectedBranch(branch)}
            >
                <Text style={[styles.branchText, selectedBranch === branch && styles.activeBranchText]}>
                    {branch}
                </Text>
            </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.cardContainer}>
            {/* Total Revenue */}
            <View style={styles.mainCard}>
                <Text style={styles.cardLabel}>INGRESOS TOTALES</Text>
                <Text style={styles.bigMoney}>${totalRevenue}</Text>
                <Text style={styles.cardSub}>{totalServices} servicios realizados</Text>
            </View>

            {/* Split */}
            <View style={styles.splitCards}>
                <View style={styles.subCard}>
                    <Text style={styles.cardLabel}>EFECTIVO</Text>
                    <Text style={styles.moneyCash}>${totalCash}</Text>
                </View>
                <View style={styles.subCard}>
                    <Text style={styles.cardLabel}>TARJETA</Text>
                    <Text style={styles.moneyCard}>${totalCard}</Text>
                </View>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Ingresos por Barbero</Text>
        <View style={!isMobile && styles.gridContainer}>
            {Object.keys(barberStats).length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, fontStyle: 'italic', padding: 10 }}>No hay servicios registrados hoy.</Text>
            ) : (
                Object.entries(barberStats).map(([name, stats], index) => (
                    <View key={index} style={[styles.barberRow, !isMobile && { width: '48%', marginRight: '2%' }]}>
                        <View>
                            <Text style={styles.barberRowTitle}>{name}</Text>
                            <Text style={styles.barberRowSub}>{stats.services} servicios</Text>
                        </View>
                        <Text style={styles.barberRowPrice}>${stats.earnings}</Text>
                    </View>
                ))
            )}
        </View>

        <TouchableOpacity style={styles.cerrarCajaBtn} onPress={handleCerrarCaja}>
            <Text style={styles.cerrarCajaText}>EFECTUAR CORTE DE CAJA</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* CONFIRM MODAL */}
      <Modal
        visible={!!confirmModal?.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
            <View style={[styles.modalIconContainer, confirmModal?.title === "Corte en Cero" ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' } : { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
              {confirmModal?.title === "Corte en Cero" ? <AlertTriangle size={32} color="#EF4444" /> : <CheckCircle2 size={32} color="var(--gold)" />}
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>{confirmModal?.title}</Text>
            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>{confirmModal?.message}</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} 
                onPress={() => setConfirmModal(null)}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>CANCELAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmModalBtn, confirmModal?.title === "Corte en Cero" ? { backgroundColor: '#EF4444' } : { backgroundColor: 'var(--gold)' }]} 
                onPress={() => {
                  setConfirmModal(null);
                  executeCorte();
                }}
              >
                <Text style={[styles.modalBtnText, { color: confirmModal?.title === "Corte en Cero" ? '#FFF' : '#000' }]}>SÍ, CERRAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal
        visible={!!successModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Check size={32} color="#10B981" />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>¡Éxito!</Text>
            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>{successModal}</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#10B981', flex: 1 }]} 
                onPress={() => setSuccessModal(null)}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>ENTENDIDO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS: any, isMobile: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  close: {
    color: COLORS.text,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  dateBtn: {
    padding: 8,
  },
  dateBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  currentDateText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  branchFilter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  branchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  activeBranchBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  branchText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  activeBranchText: {
    color: '#000',
    fontWeight: 'bold',
  },
  cardContainer: {
    marginBottom: 30,
    gap: 15,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  splitCards: {
    flexDirection: 'row',
    gap: 15,
  },
  subCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  bigMoney: {
    color: COLORS.success || '#10B981',
    fontSize: 48,
    fontWeight: 'bold',
  },
  moneyCash: {
    color: '#10B981', // Green for cash
    fontSize: 32,
    fontWeight: 'bold',
  },
  moneyCard: {
    color: '#3B82F6', // Blue for card
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardSub: {
    color: COLORS.textSecondary,
    marginTop: 5,
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
    paddingBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  barberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 15,
    marginBottom: 8,
    borderRadius: 4,
  },
  barberRowTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  barberRowSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  barberRowPrice: {
    color: COLORS.success || '#10B981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cerrarCajaBtn: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  cerrarCajaText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 20000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgb(20, 20, 20)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
  modalIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confirmModalBtn: {
    backgroundColor: 'var(--gold)',
  },
  modalBtnText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 14,
  },
});
