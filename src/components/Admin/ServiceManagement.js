import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, useWindowDimensions } from 'react-native';

export default function ServiceManagement({ onClose, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Responsive Grid Config
  const containerPadding = 40; 
  const gap = 20;
  const numColumns = width > 1400 ? 4 : width > 1000 ? 3 : width > 700 ? 2 : 1;
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);
  // Initial services as requested by user
  const [services, setServices] = useState([
    { id: 1, name: 'Corte Fade', price: 229, duration: 45, assignedTo: 'Todos' },
    { id: 2, name: 'Corte + Barba', price: 409, duration: 60, assignedTo: 'Todos' },
    { id: 3, name: 'Corte a Tijera', price: 229, duration: 45, assignedTo: 'Carlos, Ana' },
    { id: 4, name: 'Corte Regular', price: 159, duration: 30, assignedTo: 'Todos' },
    { id: 5, name: 'Faciales / Extras', price: 129, duration: 20, assignedTo: 'Ana' },
  ]);

  const [viewMode, setViewMode] = useState('list'); // 'list', 'edit'
  const [editingService, setEditingService] = useState(null);

  const handleSave = () => {
    if (editingService.id) {
        setServices(services.map(s => s.id === editingService.id ? editingService : s));
    } else {
        setServices([...services, { ...editingService, id: services.length + 1 }]);
    }
    setViewMode('list');
  };

  const renderList = () => (
    <View style={styles.content}>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => {
            setEditingService({ name: '', price: '', duration: '', assignedTo: 'Todos' });
            setViewMode('edit');
        }}
      >
        <Text style={styles.addButtonText}>+ Crear Nuevo Servicio</Text>
      </TouchableOpacity>
      
      <FlatList
        key={`grid-${numColumns}`}
        data={services}
        numColumns={numColumns}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
        columnWrapperStyle={numColumns > 1 ? { gap: 20 } : undefined}
        renderItem={({ item }) => (
            <TouchableOpacity 
                style={[styles.card, { width: itemWidth }]}
                onPress={() => {
                    setEditingService(item);
                    setViewMode('edit');
                }}
            >
                <View style={styles.cardRow}>
                    <View style={styles.mainInfo}>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.serviceDetails}>{item.duration} min • {item.assignedTo}</Text>
                    </View>
                    <Text style={styles.priceTag}>${item.price}</Text>
                </View>
            </TouchableOpacity>
        )}
      />
    </View>
  );

  const handleDelete = () => {
    setServices(services.filter(s => s.id !== editingService.id));
    setViewMode('list');
  };

  const renderEditForm = () => (
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
          {['Ambas', 'Centro', 'Lomas'].map(opt => (
              <TouchableOpacity 
                  key={opt}
                  style={[styles.branchOption, (editingService.branch || 'Ambas') === opt && styles.branchOptionActive]}
                  onPress={() => setEditingService({...editingService, branch: opt})}
              >
                  <Text style={[styles.branchText, (editingService.branch || 'Ambas') === opt && styles.branchTextActive]}>{opt}</Text>
              </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nombre del Servicio</Text>
        <TextInput 
          style={styles.input}
          value={editingService.name}
          onChangeText={t => setEditingService({...editingService, name: t})}
        />

        <View style={styles.rowInputs}>
          <View style={{flex: 1}}>
              <Text style={styles.label}>Precio ($)</Text>
              <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editingService.price)}
                  onChangeText={t => setEditingService({...editingService, price: Number(t)})}
              />
          </View>
          <View style={{flex: 1}}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editingService.duration)}
                  onChangeText={t => setEditingService({...editingService, duration: Number(t)})}
              />
          </View>
        </View>

        <Text style={styles.label}>Asignar a Barberos</Text>
        <TextInput 
          style={styles.input}
          value={editingService.assignedTo}
          onChangeText={t => setEditingService({...editingService, assignedTo: t})}
          placeholder="Ej. Todos, Carlos, Ana"
          placeholderTextColor="#666"
        />

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setViewMode('list')}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          {editingService.id && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Servicios</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'list' && renderList()}
      {viewMode === 'edit' && renderEditForm()}
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: COLORS.text,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContentContainer: {
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: isMobile ? '100%' : 700,
    alignSelf: 'center',
  },
  addButton: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  serviceDetails: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  branchTag: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  priceTag: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  branchOption: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  branchOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  branchText: {
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  branchTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  // Form
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: '#fff',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  rowInputs: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
