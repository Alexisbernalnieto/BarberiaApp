import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeToActivityLogs } from '../../services/activityLogs';

export default function AdminLogsViewer({ COLORS, isMobile }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const FILTERS = ['Todos', 'Admin', 'Recepción', 'Cliente', 'Barbero'];

  useEffect(() => {
    const unsubscribe = subscribeToActivityLogs((fetchedLogs) => {
      setLogs(fetchedLogs);
      setLoading(false);
    }, 100);

    return () => unsubscribe();
  }, []);

  const getRoleLabel = (role) => {
    if (typeof role === 'number') {
        switch(role) {
            case 0: return 'Admin';
            case 1: return 'Cliente';
            case 2: return 'Recepción';
            case 3: return 'Barbero';
            default: return 'Sistema';
        }
    }
    const r = String(role || '').toLowerCase();
    if (r === 'admin' || r === '0') return 'Admin';
    if (r === 'cliente' || r === 'client' || r === '1') return 'Cliente';
    if (r === 'recepcion' || r === 'recepción' || r === 'reception' || r === '2') return 'Recepción';
    if (r === 'barbero' || r === 'barber' || r === '3') return 'Barbero';
    return String(role || 'Sistema').toUpperCase();
  };

  const filteredLogs = logs.filter(log => {
      if (selectedFilter === 'Todos') return true;
      return getRoleLabel(log.adminRole) === selectedFilter;
  });

  const getRoleColor = (role) => {
    const r = String(role).toLowerCase();
    if (r === '0' || r === 'admin') return '#e74c3c'; // Rojo
    if (r === '1' || r === 'client' || r === 'cliente') return '#3498db'; // Azul
    if (r === '2' || r === 'reception' || r === 'recepción') return '#9b59b6'; // Morado
    if (r === '3' || r === 'barber' || r === 'barbero') return '#2ecc71'; // Verde
    return '#95a5a6'; // Gris
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-MX', { 
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return 'N/A';
    }
  };

  const renderLogItem = ({ item }) => (
    <View style={[styles.logCard, { backgroundColor: COLORS.surface }]}>
      <View style={styles.logHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.adminRole) }]}>
            <Text style={styles.roleText}>{getRoleLabel(item.adminRole)}</Text>
          </View>
          <Text style={[styles.userEmail, { color: COLORS.text }]}>{item.adminEmail || 'N/A'}</Text>
        </View>
        <Text style={[styles.timeText, { color: COLORS.text + '80' }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      <View style={styles.logBody}>
        <Text style={[styles.actionText, { color: COLORS.primary }]}>{item.action}</Text>
        {item.details ? (
          <Text style={[styles.detailsText, { color: COLORS.text }]}>{item.details}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <Text style={[styles.title, { color: COLORS.text, fontSize: isMobile ? 24 : 28 }]}>
        Historial de Actividades
      </Text>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterBtn,
                { borderColor: COLORS.primary },
                selectedFilter === filter && { backgroundColor: COLORS.primary }
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text 
                style={[
                  styles.filterText, 
                  { color: selectedFilter === filter ? '#000' : COLORS.text }
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.text }]}>Cargando historial...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="text-box-search-outline" size={64} color={COLORS.text + '50'} />
          <Text style={[styles.emptyText, { color: COLORS.text + '80' }]}>No hay actividades registradas aún.</Text>
        </View>
      ) : filteredLogs.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="text-box-search-outline" size={64} color={COLORS.text + '50'} />
          <Text style={[styles.emptyText, { color: COLORS.text + '80' }]}>No hay actividades para este filtro.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: isMobile ? 80 : 40 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContent: {
    gap: 12,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
  },
  logBody: {
    marginTop: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
