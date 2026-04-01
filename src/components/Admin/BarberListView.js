import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

export default function BarberListView({
  styles,
  barbers,
  selectedBranchFilter,
  setSelectedBranchFilter,
  setEditingBarber,
  setViewMode,
  numColumns,
  itemWidth,
  getBarberStats,
  setSelectedBarber,
}) {
  const filteredBarbers = barbers.filter(
    barber =>
      selectedBranchFilter === 'Todos' ||
      (barber.branch || 'Centro') === selectedBranchFilter,
  );

  return (
    <View style={styles.content}>
      <View style={styles.filterContainer}>
        {['Todos', 'Centro', 'Lomas'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedBranchFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedBranchFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedBranchFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingBarber({ 
            name: '', 
            role: '', 
            services: [], 
            branch: 'Centro', 
            active: true, 
            email: '', 
            password: '' 
          });
          setViewMode('form');
        }}
      >
        <Text style={styles.addButtonText}>+ REGISTRAR NUEVO BARBERO</Text>
      </TouchableOpacity>

      <FlatList
        key={`grid-${numColumns}`}
        data={filteredBarbers}
        numColumns={numColumns}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
        columnWrapperStyle={numColumns > 1 ? { gap: 20 } : undefined}
        renderItem={({ item }) => {
          const stats = getBarberStats(item.name);
          return (
            <TouchableOpacity
              style={[styles.card, { width: itemWidth, marginBottom: 0 }]}
              onPress={() => {
                setSelectedBarber({ ...item, ...stats });
                setViewMode('details');
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>{item.role}</Text>
                  <Text style={styles.branchTag}>{item.branch || 'Centro'}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.active !== false ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.active !== false ? 'ACTIVO' : 'INACTIVO'}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalServices}</Text>
                  <Text style={styles.statLabel}>SERVICIOS</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>${stats.totalEarnings}</Text>
                  <Text style={styles.statLabel}>GENERADO</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

