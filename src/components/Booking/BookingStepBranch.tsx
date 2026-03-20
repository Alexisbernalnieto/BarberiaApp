import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Check } from 'lucide-react';

interface BookingStepBranchProps {
  styles: any;
  COLORS: any;
  BRANCHES: any[];
  selectedBranch: string | null;
  setSelectedBranch: (branch: string) => void;
}

export default function BookingStepBranch({
  styles,
  BRANCHES,
  selectedBranch,
  setSelectedBranch,
}: BookingStepBranchProps) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>Selecciona una Sucursal</Text>
      <Text style={styles.subLabel}>¿Dónde prefieres tu corte hoy?</Text>

      <View style={styles.gridContainer}>
        {BRANCHES.map((branch) => (
          <TouchableOpacity
            key={branch.name}
            style={[
              styles.branchCard,
              selectedBranch === branch.name && styles.activeBranchCard
            ]}
            onPress={() => setSelectedBranch(branch.name)}
          >
            <View style={[styles.branchIcon, selectedBranch === branch.name && styles.activeIconBg]}>
              <MapPin size={32} color={selectedBranch === branch.name ? "var(--gold)" : "var(--text-muted)"} />
            </View>
            <Text style={styles.branchName}>{branch.name}</Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>

            {selectedBranch === branch.name && (
              <View style={styles.checkBadge}>
                <Check size={14} color="#000" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
