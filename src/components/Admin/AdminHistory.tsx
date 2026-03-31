import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Clock, Shield, User, History } from 'lucide-react';
import { getActivityLogs } from '../../services/activityLogs';
import { formatFullDate, formatTime12h } from '../../utils/formatters';
import { ActivityLog } from '../../types';

const AdminHistory = ({ COLORS, isMobile, onBack }: any) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const FILTERS = ['Todos', 'Admin', 'Recepción', 'Cliente', 'Barbero'];

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const fetchedLogs = await getActivityLogs();
      setLogs(fetchedLogs);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return `${formatFullDate(date)}, ${formatTime12h(date)}`;
  };

  const getRoleLabel = (role: any) => {
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

  const getRoleColor = (role: any) => {
    const label = getRoleLabel(role);
    if (label === 'Admin') return '#EF4444'; // Red
    if (label === 'Cliente') return '#3B82F6'; // Blue
    if (label === 'Recepción') return '#8B5CF6'; // Purple
    if (label === 'Barbero') return '#10B981'; // Green
    return '#6B7280'; // Gray
  };

  const filteredLogs = logs.filter(log => {
      if (selectedFilter === 'Todos') return true;
      return getRoleLabel(log.adminRole) === selectedFilter;
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={[styles.backText, { color: COLORS.primary }]}>Volver al Panel</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: COLORS.text }]}>Historial de Actividades</Text>

      <View style={{ marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
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
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.logsList}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <View key={log.id} style={[styles.logCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <View style={styles.logHeader}>
                  <View style={[styles.roleTag, { backgroundColor: getRoleColor(log.adminRole) }]}>
                    <Text style={styles.roleTagText}>{getRoleLabel(log.adminRole).toUpperCase()}</Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={[styles.adminEmail, { color: COLORS.text }]}>{log.adminEmail}</Text>
                    <Text style={[styles.timestamp, { color: COLORS.textSecondary }]}>{formatDate(log.timestamp)}</Text>
                  </View>
                </View>

                <View style={styles.logContent}>
                  <Text style={[styles.actionText, { color: COLORS.primary }]}>{log.action}</Text>
                  <Text style={[styles.details, { color: COLORS.text }]}>
                    {log.targetUserEmail && <Text style={{ color: COLORS.textSecondary }}>Usuario: </Text>}
                    {log.targetUserEmail}
                  </Text>
                  <Text style={[styles.details, { color: COLORS.text }]}>
                    {log.details}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <History size={48} color={COLORS.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>No hay registros de actividad aún.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontWeight: '700', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  logsList: { gap: 16, paddingBottom: 40 },
  logCard: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 16 },
  logHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  headerInfo: { flex: 1 },
  adminEmail: { fontSize: 14, fontWeight: '700' },
  timestamp: { fontSize: 11, marginTop: 2 },
  logContent: { gap: 4 },
  actionText: { fontSize: 16, fontWeight: '700' },
  details: { fontSize: 14, marginTop: 4 },
  emptyState: { padding: 60, alignItems: 'center' },
  filtersContainer: { gap: 10, paddingVertical: 4 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 14, fontWeight: 'bold' },
});

export default AdminHistory;
