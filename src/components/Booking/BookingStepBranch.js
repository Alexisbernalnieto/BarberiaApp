import React from 'react';
import { ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRANCHES } from '../../data/mockData';

export function BookingStepBranch({
  styles,
  COLORS,
  selectedBranch,
  setSelectedBranch,
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepHeader}>SELECCIONA TU SUCURSAL</Text>
      <View style={styles.gridContainer}>
        {BRANCHES.map((branch) => (
          <TouchableOpacity
            key={branch.id}
            style={[
              styles.branchCard,
              selectedBranch === branch.name && styles.activeBranchCard,
            ]}
            onPress={() => setSelectedBranch(branch.name)}
          >
            <View
              style={[
                styles.branchIcon,
                selectedBranch === branch.name && styles.activeIconBg,
              ]}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={40}
                color={
                  selectedBranch === branch.name
                    ? COLORS.primary
                    : COLORS.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.branchName,
                selectedBranch === branch.name && styles.activeText,
              ]}
            >
              {branch.name}
            </Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>
            {selectedBranch === branch.name && (
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={COLORS.textInverse}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

