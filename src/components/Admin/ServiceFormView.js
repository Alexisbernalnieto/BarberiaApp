import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BARBERS } from '../../data/mockData';

export default function ServiceFormView({
  styles,
  editingService,
  setEditingService,
  handleDelete,
  handleSave,
  setViewMode,
}) {
  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.formContentContainer}
    >
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
        </Text>

        <Text style={styles.label}>Sucursal Disponible</Text>
        <View style={styles.rowInputs}>
          {['Ambas', 'Centro', 'Lomas'].map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.branchOption,
                (editingService.branch || 'Ambas') === option &&
                  styles.branchOptionActive,
              ]}
              onPress={() =>
                setEditingService({ ...editingService, branch: option })
              }
            >
              <Text
                style={[
                  styles.branchText,
                  (editingService.branch || 'Ambas') === option &&
                    styles.branchTextActive,
                ]}
              >
                {option}
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
          onChangeText={text =>
            setEditingService({ ...editingService, name: text })
          }
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
              onChangeText={text =>
                setEditingService({
                  ...editingService,
                  price: Number(text) || '',
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
              onChangeText={text =>
                setEditingService({
                  ...editingService,
                  duration: Number(text) || '',
                })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Buffer (min)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Limpieza"
              placeholderTextColor="#666"
              value={String(editingService.bufferTime || '')}
              onChangeText={text =>
                setEditingService({
                  ...editingService,
                  bufferTime: Number(text) || '',
                })
              }
            />
          </View>
        </View>

        {/* ✅ TIMELINE VISUAL: Duración + Buffer */}
        {editingService.duration && (
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineLabel}>Tiempo Total Requerido</Text>
            <View style={styles.timeline}>
              <View style={[
                styles.timelineSegment,
                { 
                  flex: editingService.duration,
                  backgroundColor: styles.timelineServiceColor.backgroundColor
                }
              ]}>
                <Text style={styles.timelineSegmentText}>
                  {editingService.duration}Min (Servicio)
                </Text>
              </View>
              <View style={[
                styles.timelineSegment,
                { 
                  flex: (editingService.bufferTime || 5),
                  backgroundColor: styles.timelineBufferColor.backgroundColor
                }
              ]}>
                <Text style={styles.timelineSegmentText}>
                  {editingService.bufferTime || 5}Min (Limpieza)
                </Text>
              </View>
            </View>
            <View style={styles.timelineInfo}>
              <Text style={styles.timelineTotal}>
                Total: {(editingService.duration || 0) + (editingService.bufferTime || 5)} Min
              </Text>
              <Text style={styles.timelineSubtext}>
                Próxima cita disponible en: {(editingService.duration || 0) + (editingService.bufferTime || 5)} Min
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.label}>Asignar a Barberos</Text>
        <View style={styles.barberCheckboxContainer}>
          {BARBERS.map(barber => (
            <TouchableOpacity
              key={barber.id}
              style={styles.checkboxRow}
              onPress={() => {
                const currentBarbers = editingService.assignedBarbers || [];
                const isChecked = currentBarbers.includes(barber.name);
                if (isChecked) {
                  setEditingService({
                    ...editingService,
                    assignedBarbers: currentBarbers.filter(
                      name => name !== barber.name,
                    ),
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
                  (editingService.assignedBarbers || []).includes(
                    barber.name,
                  ) && styles.checkboxActive,
                ]}
              >
                {(editingService.assignedBarbers || []).includes(
                  barber.name,
                ) && <MaterialCommunityIcons name="check" size={16} color="#000" />}
              </View>
              <Text style={styles.checkboxLabel}>{barber.name}</Text>
              <Text style={styles.checkboxSpecialty}>{barber.specialty}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setViewMode('list')}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          {editingService.id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

