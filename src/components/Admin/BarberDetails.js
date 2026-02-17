import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

export default function BarberDetails({
  styles,
  DAYS,
  selectedBarber,
  defaultSchedule,
  onBack,
  onEdit,
  onDelete,
}) {
  const scheduleForDay = index =>
    selectedBarber.schedule ? selectedBarber.schedule[index] : defaultSchedule[index];

  return (
    <View style={styles.content}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>{selectedBarber.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.detailLabel}>Rol:</Text>
            <Text style={styles.detailValue}>{selectedBarber.role}</Text>
            <Text style={[styles.detailLabel, { marginTop: 5 }]}>Sucursal:</Text>
            <Text style={styles.detailValue}>{selectedBarber.branch || 'Centro'}</Text>
          </View>
          <View style={styles.detailsActions}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>EDITAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>ELIMINAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.detailLabel, { marginTop: 10 }]}>Servicios Habilitados:</Text>
        <View style={styles.tagsContainer}>
          {selectedBarber.services.map((s, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.detailLabel, { marginTop: 15 }]}>Horario Semanal:</Text>
        <View style={styles.scheduleSummary}>
          {DAYS.map((day, index) => {
            const schedule = scheduleForDay(index);
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
          <Text style={styles.bigStatValue}>${selectedBarber.totalEarnings}</Text>
          <Text style={styles.bigStatLabel}>Ingresos Totales</Text>
        </View>
        <View style={styles.bigStatBox}>
          <Text style={styles.bigStatValue}>{selectedBarber.totalServices}</Text>
          <Text style={styles.bigStatLabel}>Cortes Realizados</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historial de Citas</Text>
      <FlatList
        data={selectedBarber.history}
        keyExtractor={(item, index) => index.toString()}
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

