import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BARBERS } from '../../data/mockData';

export default function ServiceForm({
  styles,
  COLORS,
  editingService,
  setEditingService,
  onCancel,
  onDelete,
  onSave,
}) {
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.formContentContainer}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
        </Text>

        <Text style={styles.label}>Sucursal Disponible</Text>
        <View style={styles.rowInputs}>
          {['Ambas', 'Centro', 'Lomas'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.branchOption,
                (editingService.branch || 'Ambas') === opt && styles.branchOptionActive,
              ]}
              onPress={() => setEditingService({ ...editingService, branch: opt })}
            >
              <Text
                style={[
                  styles.branchText,
                  (editingService.branch || 'Ambas') === opt && styles.branchTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nombre del Servicio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Corte Fade"
          placeholderTextColor="#666"
          value={editingService.name}
          onChangeText={t => setEditingService({ ...editingService, name: t })}
        />

        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Precio ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#666"
              value={String(editingService.price || '')}
              onChangeText={t =>
                setEditingService({
                  ...editingService,
                  price: Number(t) || '',
                })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Duración (min)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#666"
              value={String(editingService.duration || '')}
              onChangeText={t =>
                setEditingService({
                  ...editingService,
                  duration: Number(t) || '',
                })
              }
            />
          </View>
        </View>

        <Text style={styles.label}>Asignar a Barberos</Text>
        <View style={styles.barberCheckboxContainer}>
          {BARBERS.map(barber => {
            const currentBarbers = editingService.assignedBarbers || [];
            const isChecked = currentBarbers.includes(barber.name);

            return (
              <TouchableOpacity
                key={barber.id}
                style={styles.checkboxRow}
                onPress={() => {
                  if (isChecked) {
                    setEditingService({
                      ...editingService,
                      assignedBarbers: currentBarbers.filter(b => b !== barber.name),
                    });
                  } else {
                    setEditingService({
                      ...editingService,
                      assignedBarbers: [...currentBarbers, barber.name],
                    });
                  }
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked && styles.checkboxActive,
                  ]}
                >
                  {isChecked && (
                    <MaterialCommunityIcons name="check" size={16} color="#000" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{barber.name}</Text>
                <Text style={styles.checkboxSpecialty}>{barber.specialty}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          {editingService.id && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

