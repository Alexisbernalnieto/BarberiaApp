import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function FinancialEmployeesRanking({ styles, isMobile, ranking }) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.rankingHeader}>
        <Text style={styles.rankingTitle}>Rendimiento del Mes</Text>
        <Text style={styles.rankingSubtitle}>Ranking por ingresos generados</Text>
      </View>
      <View style={!isMobile && styles.gridContainer}>
        {ranking.map((barber, index) => (
          <View
            key={index}
            style={[
              styles.rankingCard,
              !isMobile && { width: '48%' },
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.barberName}>{barber.name}</Text>
              <Text style={styles.barberServices}>
                {barber.services} servicios
              </Text>
            </View>
            <Text style={styles.barberEarnings}>${barber.earnings}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

