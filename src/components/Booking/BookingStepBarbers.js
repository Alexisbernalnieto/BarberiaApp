import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookingStepBarbers({
  styles,
  COLORS,
  BARBERS,
  selectedBranch,
  selectedBarber,
  setSelectedBarber,
}) {
  const filteredBarbers = BARBERS.filter(b => b.branch === selectedBranch);

  return (
    <ScrollView
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepHeader}>
        TU EXPERTO EN {selectedBranch.toUpperCase()}
      </Text>
      <View style={styles.barbersGrid}>
        {filteredBarbers.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.barberCard,
              selectedBarber?.id === item.id && styles.activeBarberCard,
            ]}
            onPress={() => setSelectedBarber(item)}
          >
            <View
              style={[
                styles.avatarBig,
                selectedBarber?.id === item.id && styles.activeAvatarBig,
              ]}
            >
              <Text
                style={[
                  styles.avatarTextBig,
                  selectedBarber?.id === item.id && {
                    color: COLORS.textInverse,
                  },
                ]}
              >
                {item.name[0]}
              </Text>
            </View>
            <Text
              style={[
                styles.barberName,
                selectedBarber?.id === item.id && styles.activeText,
              ]}
            >
              {item.name}
            </Text>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons
                name="star"
                size={12}
                color={COLORS.primary}
                style={{ marginRight: 2 }}
              />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

