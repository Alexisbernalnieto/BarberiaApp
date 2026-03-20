import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';

export default function FinancialReport({ appointments, onClose, COLORS }) {
  const [filter, setFilter] = useState('day'); // 'day', 'month', 'employees'
  const [selectedBranch, setSelectedBranch] = useState('All'); // 'All', 'Centro', 'Lomas'
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  // Filter appointments based on time period AND branch
  const timeFilteredApps = appointments.filter(app => {
    // Branch Filter
    if (selectedBranch !== 'All') {
        if (app.branch !== selectedBranch && (app.branch || selectedBranch !== 'Centro')) { // Handle legacy missing branch as Centro? Or just strict?
            // Let's assume missing branch = Centro for legacy
            const appBranch = app.branch || 'Centro';
            if (appBranch !== selectedBranch) return false;
        }
    }

    // Time Filter
    if (filter === 'day') return app.date === today;
    if (filter === 'month' || filter === 'employees') return app.date.startsWith(currentMonth);
    return true;
  });

  const totalEarnings = timeFilteredApps.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalServices = timeFilteredApps.length;

  // Group by barber for employee view
  const getBarberRanking = () => {
    const ranking = {};
    timeFilteredApps.forEach(app => {
        if (!ranking[app.barberName]) {
            ranking[app.barberName] = { name: app.barberName, earnings: 0, services: 0 };
        }
        ranking[app.barberName].earnings += (app.price || 0);
        ranking[app.barberName].services += 1;
    });
    return Object.values(ranking).sort((a, b) => b.earnings - a.earnings);
  };

  const renderContent = () => {
    if (filter === 'employees') {
        const ranking = getBarberRanking();
        return (
            <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                <View style={styles.rankingHeader}>
                    <Text style={styles.rankingTitle}>Rendimiento del Mes</Text>
                    <Text style={styles.rankingSubtitle}>Ranking por ingresos generados</Text>
                </View>
                <View style={!isMobile && styles.gridContainer}>
                    {ranking.map((barber, index) => (
                        <View key={index} style={[styles.rankingCard, !isMobile && { width: '48%' }]}>
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>#{index + 1}</Text>
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.barberName}>{barber.name}</Text>
                                <Text style={styles.barberServices}>{barber.services} servicios</Text>
                            </View>
                            <Text style={styles.barberEarnings}>${barber.earnings}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={styles.card}>
                <Text style={styles.cardLabel}>Ganancias Totales ({filter === 'day' ? 'Hoy' : 'Mes'})</Text>
                <Text style={styles.bigMoney}>${totalEarnings}</Text>
                <Text style={styles.cardSub}>{totalServices} servicios realizados</Text>
            </View>

            <Text style={styles.sectionTitle}>Desglose de Citas</Text>
            <View style={!isMobile && styles.gridContainer}>
                {timeFilteredApps.map((app, index) => (
                    <View key={index} style={[styles.row, !isMobile && { width: '48%', marginRight: '2%' }]}>
                        <View>
                            <Text style={styles.rowTitle}>{app.serviceName}</Text>
                            <Text style={styles.rowSub}>{app.date} - {app.barberName}</Text>
                        </View>
                        <Text style={styles.rowPrice}>+${app.price}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FINANZAS</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>Cerrar</Text></TouchableOpacity>
      </View>

      {/* Branch Filter */}
      <View style={styles.branchFilter}>
        {['All', 'Centro', 'Lomas'].map(branch => (
            <TouchableOpacity 
                key={branch}
                style={[styles.branchBtn, selectedBranch === branch && styles.activeBranchBtn]}
                onPress={() => setSelectedBranch(branch)}
            >
                <Text style={[styles.branchText, selectedBranch === branch && styles.activeBranchText]}>
                    {branch === 'All' ? 'Todas' : branch}
                </Text>
            </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
            style={[styles.tab, filter === 'day' && styles.activeTab]} 
            onPress={() => setFilter('day')}
        >
            <Text style={[styles.tabText, filter === 'day' && styles.activeTabText]}>HOY</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, filter === 'month' && styles.activeTab]} 
            onPress={() => setFilter('month')}
        >
            <Text style={[styles.tabText, filter === 'month' && styles.activeTabText]}>ESTE MES</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, filter === 'employees' && styles.activeTab]} 
            onPress={() => setFilter('employees')}
        >
            <Text style={[styles.tabText, filter === 'employees' && styles.activeTabText]}>BARBEROS</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
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
    marginBottom: 20,
    marginTop: 20,
  },
  branchFilter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
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
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeTabText: {
    color: '#000',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  bigMoney: {
    color: COLORS.success,
    fontSize: 48,
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
  row: {
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
  rowTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  rowPrice: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Ranking Styles
  rankingHeader: {
    marginBottom: 20,
  },
  rankingTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rankingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  rankingCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: '#000',
    fontWeight: 'bold',
  },
  barberName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  barberServices: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  barberEarnings: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
