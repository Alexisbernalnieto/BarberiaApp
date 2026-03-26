import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { logActivity } from '../../services/activityLogs';

export default function AdminCashRegister({ appointments, onClose, COLORS, currentUser }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  const [currentDateObj, setCurrentDateObj] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState('Todas'); // 'Todas', 'Centro', 'Lomas'

  const dateStr = currentDateObj.toISOString().split('T')[0];

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
      if (typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm("No hay ingresos registrados para hoy. ¿Cerrar caja de todos modos?")) return;
      } else {
        // Fallback or React Native Alert
        Alert.alert("Corte en Cero", "¿No hay ingresos para hoy. Cerrar caja de todos modos?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar", onPress: executeCorte }
        ]);
        return;
      }
    } else {
      if (typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm(`¿Confirmar cierre de caja por un total de $${totalRevenue}?`)) return;
      } else {
        Alert.alert("Confirmar Cierre", `¿Confirmar cierre de caja por un total de $${totalRevenue}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Confirmar", onPress: executeCorte }
        ]);
        return;
      }
    }
    executeCorte();
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
      if (typeof window !== 'undefined' && window.alert) {
         window.alert("Corte de caja registrado exitosamente en el Historial.");
      } else {
         Alert.alert("Éxito", "Corte de caja registrado en el historial.");
      }
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
        <Text style={styles.currentDateText}>{dateStr}</Text>
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
  }
});
