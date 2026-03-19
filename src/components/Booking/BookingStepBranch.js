import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookingStepBranch({
  styles,
  COLORS,
  BRANCHES,
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
        {BRANCHES.map(branch => (
          <TouchableOpacity
            key={branch.id}
            style={[
              styles.branchCard,
              selectedBranch?.name === branch.name && styles.activeBranchCard,
            ]}
            onPress={() => setSelectedBranch(branch)}
            dataSet={{ bookingCard: 'true', cardActive: selectedBranch?.name === branch.name ? 'true' : undefined }}
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
                  selectedBranch?.name === branch.name
                    ? COLORS.primary
                    : COLORS.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.branchName,
                selectedBranch?.name === branch.name && styles.activeText,
              ]}
            >
              {branch.name}
            </Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>
            {selectedBranch?.name === branch.name && (
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

