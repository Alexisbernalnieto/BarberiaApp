import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, Scissors, Tag, History } from 'lucide-react';

const AdminQuickActions = ({ setViewMode, COLORS, isMobile }: any) => {
  const actions = [
    { id: 'finances', label: 'Finanzas', icon: TrendingUp },
    { id: 'barbers', label: 'Barberos', icon: Scissors },
    { id: 'services', label: 'Servicios', icon: Tag },
    { id: 'history', label: 'Historial', icon: History },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <TouchableOpacity 
            key={action.id} 
            style={[styles.actionCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}
            onPress={() => setViewMode(action.id)}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
              <Icon size={24} color={COLORS.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: COLORS.text }]}>{action.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%', // Approx half for 2x2 grid
    aspectRatio: 1, // Square cards
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AdminQuickActions;
