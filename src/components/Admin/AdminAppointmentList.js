import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminAppointmentList({ appointments, numColumns, itemWidth, COLORS }) {
  
  const renderItem = ({ item }) => (
    <View style={[
        styles.card, 
        { width: itemWidth, backgroundColor: COLORS.surface }, 
        item.type === 'Walk-in' && { borderLeftColor: COLORS.success, borderLeftWidth: 4 }
    ]}>
        <View style={styles.cardHeader}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                <Text style={[styles.clientName, { color: COLORS.text }]}>{item.userName}</Text>
            </View>
            <View style={[styles.timeTag, { backgroundColor: COLORS.primary }]}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" style={{marginRight: 4}} />
                <Text style={styles.timeTagText}>{item.time}</Text>
            </View>
        </View>
        
        <View style={styles.cardRow}>
            <MaterialCommunityIcons name="content-cut" size={16} color={COLORS.textSecondary} style={{marginRight: 8}} />
            <Text style={[styles.detail, { color: COLORS.textSecondary }]}>{item.serviceName} - ${item.price}</Text>
        </View>
        
        <View style={styles.cardRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textSecondary} style={{marginRight: 8}} />
            <Text style={[styles.detail, { color: COLORS.textSecondary }]}>{item.date}</Text>
        </View>

        <View style={styles.cardRow}>
            <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textSecondary} style={{marginRight: 8}} />
            <Text style={[styles.detail, { color: COLORS.textSecondary }]}>{item.barberName}</Text>
        </View>
        
        <View style={styles.typeTagContainer}>
            <Text style={[styles.typeTag, {color: item.type === 'Walk-in' ? COLORS.success : COLORS.primary}]}>
                {item.type}
            </Text>
        </View>
    </View>
  );

  return (
    <View style={{flex: 1}}>
        <Text style={[styles.subtitle, { color: COLORS.text }]}>Agenda Global</Text>
        <FlatList
            key={`grid-${numColumns}`}
            data={appointments}
            numColumns={numColumns}
            keyExtractor={(item, index) => index.toString()}
            columnWrapperStyle={numColumns > 1 ? { gap: 20 } : undefined}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
  },
  typeTagContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  typeTag: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
