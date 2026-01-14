import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#222',
  text: '#fff',
  secondaryText: '#888',
};

export default function QueueDisplay({ appointments, onClose }) {
  // Filtrar citas de hoy y ordenarlas por hora
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments
    .filter(app => app.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TURNO ACTUAL</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>Cerrar</Text></TouchableOpacity>
      </View>

      {todaysAppointments.length > 0 ? (
        <>
          <View style={styles.currentTurn}>
            <Text style={styles.label}>AHORA ATENDIENDO A:</Text>
            <Text style={styles.bigName}>{todaysAppointments[0].userName}</Text>
            <Text style={styles.subInfo}>{todaysAppointments[0].barberName} - {todaysAppointments[0].serviceName}</Text>
          </View>

          <Text style={styles.listTitle}>Próximos en espera:</Text>
          <FlatList
            data={todaysAppointments.slice(1)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.queueItem}>
                <Text style={styles.time}>{item.time}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.userName}</Text>
                  <Text style={styles.details}>{item.barberName}</Text>
                </View>
                <Text style={styles.status}>{item.type === 'Walk-in' ? '🚶' : '📱'}</Text>
              </View>
            )}
          />
        </>
      ) : (
        <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay citas activas por hoy</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  close: {
    color: '#fff',
    fontSize: 16,
  },
  currentTurn: {
    backgroundColor: COLORS.surface,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  label: {
    color: COLORS.secondaryText,
    fontSize: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  bigName: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subInfo: {
    color: COLORS.primary,
    fontSize: 18,
    marginTop: 10,
  },
  listTitle: {
    color: '#888',
    fontSize: 18,
    marginBottom: 15,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  time: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    color: '#888',
  },
  status: {
    fontSize: 20,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 20,
  }
});
