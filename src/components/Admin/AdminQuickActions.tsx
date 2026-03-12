import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, Scissors, Tag, PlusCircle } from 'lucide-react';

interface AdminQuickActionsProps {
  setViewMode: (mode: string) => void;
  COLORS: any;
  isMobile: boolean;
}

export default function AdminQuickActions({ setViewMode, COLORS, isMobile }: AdminQuickActionsProps) {
  const actions = [
    { id: 'finance', label: 'Caja y Finanzas', icon: CreditCard, color: 'var(--gold)' },
    { id: 'barbers', label: 'Gestión Barberos', icon: Scissors, color: '#3B82F6' },
    { id: 'services', label: 'Servicios', icon: Tag, color: '#10B981' },
    { id: 'walkin', label: 'Nueva Cita', icon: PlusCircle, color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => setViewMode(action.id)}
              data-btn="true"
            >
              <View style={[styles.iconWrapper, { backgroundColor: `${action.color}15` }]}>
                <Icon size={24} color={action.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionLabel: {
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: '600',
  },
});
