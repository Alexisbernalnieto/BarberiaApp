import React, { useState, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import FinancialHeader from './FinancialHeader';
import FinancialSummary from './FinancialSummary';
import FinancialEmployeesRanking from './FinancialEmployeesRanking';

export default function FinancialReport({ appointments, onClose, COLORS }) {
  const [filter, setFilter] = useState('day');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  const timeFilteredApps = appointments.filter(app => {
    if (selectedBranch !== 'All') {
      if (app.branch !== selectedBranch && (app.branch || selectedBranch !== 'Centro')) {
        const appBranch = app.branch || 'Centro';
        if (appBranch !== selectedBranch) return false;
      }
    }

    if (filter === 'day') return app.date === today;
    if (filter === 'month' || filter === 'employees') return app.date.startsWith(currentMonth);
    return true;
  });

  const totalEarnings = timeFilteredApps.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalServices = timeFilteredApps.length;

  const getBarberRanking = () => {
    const ranking = {};
    timeFilteredApps.forEach(app => {
      if (!ranking[app.barberName]) {
        ranking[app.barberName] = { name: app.barberName, earnings: 0, services: 0 };
      }
      ranking[app.barberName].earnings += app.price || 0;
      ranking[app.barberName].services += 1;
    });
    return Object.values(ranking).sort((a, b) => b.earnings - a.earnings);
  };

  return (
    <View style={styles.container}>
      <FinancialHeader
        styles={styles}
        title="FINANZAS"
        onClose={onClose}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        filter={filter}
        setFilter={setFilter}
      />
      {filter === 'employees' ? (
        <FinancialEmployeesRanking
          styles={styles}
          isMobile={isMobile}
          ranking={getBarberRanking()}
        />
      ) : (
        <FinancialSummary
          styles={styles}
          isMobile={isMobile}
          filter={filter}
          totalEarnings={totalEarnings}
          totalServices={totalServices}
          timeFilteredApps={timeFilteredApps}
        />
      )}
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
