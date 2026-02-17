import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function FinancialSummary({
  styles,
  isMobile,
  filter,
  totalEarnings,
  totalServices,
  timeFilteredApps,
}) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Ganancias Totales ({filter === 'day' ? 'Hoy' : 'Mes'})
        </Text>
        <Text style={styles.bigMoney}>${totalEarnings}</Text>
        <Text style={styles.cardSub}>{totalServices} servicios realizados</Text>
      </View>

      <Text style={styles.sectionTitle}>Desglose de Citas</Text>
      <View style={!isMobile && styles.gridContainer}>
        {timeFilteredApps.map((app, index) => (
          <View
            key={index}
            style={[
              styles.row,
              !isMobile && { width: '48%', marginRight: '2%' },
            ]}
          >
            <View>
              <Text style={styles.rowTitle}>{app.serviceName}</Text>
              <Text style={styles.rowSub}>
                {app.date} - {app.barberName}
              </Text>
            </View>
            <Text style={styles.rowPrice}>+${app.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

