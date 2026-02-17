import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function FinancialHeader({
  styles,
  title,
  onClose,
  selectedBranch,
  setSelectedBranch,
  filter,
  setFilter,
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.branchFilter}>
        {['All', 'Centro', 'Lomas'].map(branch => (
          <TouchableOpacity
            key={branch}
            style={[
              styles.branchBtn,
              selectedBranch === branch && styles.activeBranchBtn,
            ]}
            onPress={() => setSelectedBranch(branch)}
          >
            <Text
              style={[
                styles.branchText,
                selectedBranch === branch && styles.activeBranchText,
              ]}
            >
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
          <Text
            style={[
              styles.tabText,
              filter === 'day' && styles.activeTabText,
            ]}
          >
            HOY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'month' && styles.activeTab]}
          onPress={() => setFilter('month')}
        >
          <Text
            style={[
              styles.tabText,
              filter === 'month' && styles.activeTabText,
            ]}
          >
            ESTE MES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'employees' && styles.activeTab]}
          onPress={() => setFilter('employees')}
        >
          <Text
            style={[
              styles.tabText,
              filter === 'employees' && styles.activeTabText,
            ]}
          >
            BARBEROS
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

