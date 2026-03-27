import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Check } from 'lucide-react';

interface BookingStepBranchProps {
  styles: any;
  COLORS: any;
  BRANCHES: any[];
  selectedBranch: any;
  setSelectedBranch: (branch: any) => void;
}

export default function BookingStepBranch({
  styles,
  COLORS,
  BRANCHES,
  selectedBranch,
  setSelectedBranch,
}: BookingStepBranchProps) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={true}>
      <Text style={styles.stepHeader}>Selecciona una Sucursal</Text>
      <Text style={styles.subLabel}>¿Dónde prefieres tu corte hoy?</Text>

      <View style={styles.gridContainer}>
        {BRANCHES.map((branch) => (
          <TouchableOpacity
            key={branch.name}
            style={[
              styles.branchCard,
              selectedBranch?.name === branch.name && styles.activeBranchCard
            ]}
            onPress={() => setSelectedBranch(branch)}
          >
            <View style={[styles.branchIcon, selectedBranch?.name === branch.name && styles.activeIconBg]}>
              <MapPin size={32} color={selectedBranch?.name === branch.name ? COLORS.primary : COLORS.textMuted} />
            </View>
            <Text style={styles.branchName}>{branch.name}</Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>

            {selectedBranch?.name === branch.name && (
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
