import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Clock, Shield, User, History } from 'lucide-react';
import { getActivityLogs } from '../../services/activityLogs';
import { formatFullDate, formatTime12h } from '../../utils/formatters';
import { ActivityLog } from '../../types';

const AdminHistory = ({ COLORS, isMobile, onBack }: any) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={[styles.backText, { color: COLORS.primary }]}>Volver al Panel</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: COLORS.text }]}>Historial de Actividades</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.logsList}>
          {logs.length > 0 ? (
            logs.map(log => (
              <View key={log.id} style={[styles.logCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <View style={styles.logHeader}>
                  <View style={[styles.roleTag, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.roleTagText}>{(log.adminRole || 'admin').toUpperCase()}</Text>
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
});

export default AdminHistory;
