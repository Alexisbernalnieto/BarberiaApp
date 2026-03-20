import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SERVICES } from '../../data/mockData';

export default function BarberFormView({
  styles,
  editingBarber,
  setEditingBarber,
  DAYS,
  selectedDay,
  setSelectedDay,
  updateSchedule,
  toggleServiceSelection,
  setViewMode,
  handleSave,
  DEFAULT_SCHEDULE,
}) {
  const availableServices = SERVICES.filter(
    service =>
      !service.branch ||
      service.branch === 'Ambas' ||
      service.branch === editingBarber.branch,
  );

  const currentSchedule = editingBarber.schedule || DEFAULT_SCHEDULE;
  const daySchedule = currentSchedule[selectedDay];

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.formContentContainer}
    >
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          {editingBarber.id ? 'Editar Barbero' : 'Registrar Barbero'}
        </Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={editingBarber.name}
          onChangeText={text => setEditingBarber({ ...editingBarber, name: text })}
          placeholder="Ej. Juan Pérez"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Rol</Text>
        <TextInput
          style={styles.input}
          value={editingBarber.role}
          onChangeText={text => setEditingBarber({ ...editingBarber, role: text })}
          placeholder="Ej. Master Barber"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Estatus</Text>
        <TouchableOpacity 
            onPress={() => setEditingBarber({...editingBarber, active: !editingBarber.active})}
            style={{
                backgroundColor: editingBarber.active ? '#10B981' : '#EF4444',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                alignSelf: 'flex-start',
                marginBottom: 15
            }}
        >
            <Text style={{color: 'white', fontWeight: 'bold'}}>
                {editingBarber.active ? 'ACTIVO' : 'INACTIVO'}
            </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Sucursal</Text>
        <View style={styles.rowInputs}>
          <TouchableOpacity
            style={[
              styles.branchOption,
              editingBarber.branch === 'Centro' && styles.branchOptionActive,
            ]}
            onPress={() => setEditingBarber({ ...editingBarber, branch: 'Centro' })}
          >
            <Text
              style={[
                styles.branchText,
                editingBarber.branch === 'Centro' && styles.branchTextActive,
              ]}
            >
              Centro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.branchOption,
              editingBarber.branch === 'Lomas' && styles.branchOptionActive,
            ]}
            onPress={() => setEditingBarber({ ...editingBarber, branch: 'Lomas' })}
          >
            <Text
              style={[
                styles.branchText,
                editingBarber.branch === 'Lomas' && styles.branchTextActive,
              ]}
            >
              Lomas
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Horarios de Atención</Text>
        <View style={styles.scheduleContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daysScroll}
          >
            {DAYS.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayTab,
                  selectedDay === index && styles.dayTabActive,
                ]}
                onPress={() => setSelectedDay(index)}
              >
                <Text
                  style={[
                    styles.dayTabText,
                    selectedDay === index && styles.dayTabTextActive,
                  ]}
                >
                  {day.slice(0, 3)}
                </Text>
                <View
                  style={[
                    styles.dayIndicator,
                    currentSchedule[index]?.active
                      ? styles.dayIndicatorActive
                      : styles.dayIndicatorInactive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.scheduleEditor}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.selectedDayTitle}>{DAYS[selectedDay]}</Text>
              <TouchableOpacity
                style={[
                  styles.activeToggle,
                  daySchedule.active
                    ? styles.activeToggleOn
                    : styles.activeToggleOff,
                ]}
                onPress={() =>
                  updateSchedule(selectedDay, 'active', !daySchedule.active)
                }
              >
                <Text
                  style={[
                    styles.activeToggleText,
                    daySchedule.active
                      ? styles.activeToggleTextOn
                      : styles.activeToggleTextOff,
                  ]}
                >
                  {daySchedule.active ? 'LABORABLE' : 'NO LABORABLE'}
                </Text>
              </TouchableOpacity>
            </View>

            {daySchedule.active && (
              <View style={styles.timeInputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Entrada</Text>
                  <TextInput
                    style={styles.input}
                    value={daySchedule.start}
                    onChangeText={text =>
                      updateSchedule(selectedDay, 'start', text)
                    }
                    placeholder="HH:MM"
                    placeholderTextColor="#666"
                    maxLength={5}
                  />
                </View>
                <Text style={styles.timeSeparator}>-</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Salida</Text>
                  <TextInput
                    style={styles.input}
                    value={daySchedule.end}
                    onChangeText={text =>
                      updateSchedule(selectedDay, 'end', text)
                    }
                    placeholder="HH:MM"
                    placeholderTextColor="#666"
                    maxLength={5}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.label}>
          Servicios Habilitados {editingBarber.services?.length || 0}
        </Text>
        <View style={styles.servicesGrid}>
          {availableServices.map(service => {
            const isSelected =
              editingBarber.services?.includes(service.name) || false;
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceChip,
                  isSelected && styles.serviceChipActive,
                ]}
                onPress={() => toggleServiceSelection(service.name)}
              >
                <Text
                  style={[
                    styles.serviceChipText,
                    isSelected && styles.serviceChipTextActive,
                  ]}
                >
                  {service.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setViewMode('list')}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

