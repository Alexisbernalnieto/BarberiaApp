import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlusCircle, MonitorPlay, Users, Settings, Scissors } from 'lucide-react';

const AdminQuickActions = ({ setViewMode, COLORS, isMobile }: any) => {
  const actions = [
    { id: 'walkin', label: 'Nuevo Walk-in', icon: PlusCircle, color: 'var(--gold)' },
    { id: 'queue', label: 'Monitor de Turnos', icon: MonitorPlay, color: '#10B981' },
    { id: 'barbers', label: 'Gestionar Barberos', icon: Scissors, color: '#3B82F6' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acciones Rápidas</Text>
      <View style={styles.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionCard}
              onPress={() => setViewMode(action.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: `${action.color}15` }]}>
                <Icon size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  grid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AdminQuickActions;
