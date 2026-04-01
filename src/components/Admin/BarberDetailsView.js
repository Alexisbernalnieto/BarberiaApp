import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

export default function BarberDetailsView({
  styles,
  selectedBarber,
  setViewMode,
  DAYS,
  DEFAULT_SCHEDULE,
  handleDelete,
  setEditingBarber,
}) {
  return (
    <View style={styles.content}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>{selectedBarber.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <View>
            <Text style={styles.detailLabel}>Rol:</Text>
            <Text style={styles.detailValue}>{selectedBarber.role}</Text>
            <Text style={[styles.detailLabel, { marginTop: 5 }]}>
              Sucursal:
            </Text>
            <Text style={styles.detailValue}>
              {selectedBarber.branch || 'Centro'}
            </Text>
          </View>
          <View style={styles.detailsActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingBarber({ ...selectedBarber });
                setViewMode('form');
              }}
            >
              <Text style={styles.editButtonText}>EDITAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(selectedBarber.id)}
            >
              <Text style={styles.deleteButtonText}>ELIMINAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.detailLabel, { marginTop: 10 }]}>
          Servicios Habilitados:
        </Text>
        <View style={styles.tagsContainer}>
          {(selectedBarber.services || []).map((service, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{service}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.detailLabel, { marginTop: 15 }]}>
          Horario Semanal:
        </Text>
        <View style={styles.scheduleSummary}>
          {DAYS.map((day, index) => {
            const schedule = selectedBarber.schedule
              ? selectedBarber.schedule[index]
              : DEFAULT_SCHEDULE[index];
            return (
              <View key={index} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{day}</Text>
                <Text
                  style={[
                    styles.scheduleTime,
                    !schedule?.active && styles.scheduleTimeInactive,
                  ]}
                >
                  {schedule?.active
                    ? `${schedule.start} - ${schedule.end}`
                    : 'Descanso'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Rendimiento Histórico</Text>
      <View style={styles.statsGrid}>
        <View style={styles.bigStatBox}>
          <Text style={styles.bigStatValue}>
            ${selectedBarber.totalEarnings || 0}
          </Text>
          <Text style={styles.bigStatLabel}>Ingresos Totales</Text>
        </View>
        <View style={styles.bigStatBox}>
          <Text style={styles.bigStatValue}>{selectedBarber.totalServices || 0}</Text>
          <Text style={styles.bigStatLabel}>Cortes Realizados</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historial de Citas</Text>
      <FlatList
        data={selectedBarber.history || []}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <Text style={styles.historyDate}>
              {item.date} {item.time}
            </Text>
            <Text style={styles.historyService}>{item.serviceName}</Text>
            <Text style={styles.historyPrice}>+${item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

