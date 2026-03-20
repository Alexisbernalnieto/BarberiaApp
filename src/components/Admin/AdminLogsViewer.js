import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeToLogs } from '../../services/logs';

export default function AdminLogsViewer({ COLORS, isMobile }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLogs((fetchedLogs) => {
      setLogs(fetchedLogs);
      setLoading(false);
    }, 100);

    return () => unsubscribe();
  }, []);

  const getRoleLabel = (role) => {
    switch(role) {
      case 0: return 'Admin';
      case 1: return 'Cliente';
      case 2: return 'Recepción';
      case 3: return 'Barbero';
      default: return 'Sistema';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 0: return '#e74c3c'; // Rojo
      case 1: return '#3498db'; // Azul
      case 2: return '#9b59b6'; // Morado
      case 3: return '#2ecc71'; // Verde
      default: return '#95a5a6'; // Gris
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderLogItem = ({ item }) => (
    <View style={[styles.logCard, { backgroundColor: COLORS.surface }]}>
      <View style={styles.logHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.userRole) }]}>
            <Text style={styles.roleText}>{getRoleLabel(item.userRole)}</Text>
          </View>
          <Text style={[styles.userEmail, { color: COLORS.text }]}>{item.userEmail}</Text>
        </View>
        <Text style={[styles.timeText, { color: COLORS.text + '80' }]}>
          {formatTime(item.createdAt)}
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
      ) : (
        <FlatList
          data={logs}
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
