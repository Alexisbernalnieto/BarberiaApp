import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { SERVICES } from '../../data/mockData';

export default function BarberManagement({ appointments, onClose, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Configuración de Grid Responsivo
  const containerPadding = 40; // 20 paddingHorizontal * 2
  const gap = 20;
  const numColumns = width > 1400 ? 4 : width > 1000 ? 3 : width > 700 ? 2 : 1;
  // Calcular ancho exacto para cada tarjeta restando el espacio de los gaps
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  // Mock initial data based on user requirements
  const [barbers, setBarbers] = useState([
    { id: 1, name: 'Carlos', role: 'Master Barber', services: ['Fade', 'Barba', 'Tijera'], active: true },
    { id: 2, name: 'Ana', role: 'Stylist', services: ['Corte Regular', 'Faciales'], active: true },
    { id: 3, name: 'Luis', role: 'Junior', services: ['Corte Regular'], active: true },
  ]);

  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'details'
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [editingBarber, setEditingBarber] = useState(null); // Used for form
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('Todos'); // 'Todos', 'Centro', 'Lomas'

  // Calculate stats for a barber
  const getBarberStats = (barberName) => {
    const barberApps = appointments.filter(app => app.barberName === barberName);
    const totalServices = barberApps.length;
    const totalEarnings = barberApps.reduce((acc, curr) => acc + (curr.price || 0), 0);
    // Mock hours/dates for demo
    const lastActive = barberApps.length > 0 ? barberApps[barberApps.length - 1].date : 'N/A';
    
    return { totalServices, totalEarnings, lastActive, history: barberApps };
  };

  const handleSave = () => {
    if (editingBarber.name && editingBarber.role) {
        if (editingBarber.id) {
            // Edit existing
            setBarbers(barbers.map(b => b.id === editingBarber.id ? editingBarber : b));
        } else {
            // Add new
            setBarbers([...barbers, { 
                id: barbers.length + 1, 
                ...editingBarber, 
                active: true 
            }]);
        }
        setEditingBarber(null);
        setViewMode('list');
    }
  };

  const handleDelete = (barberId) => {
      Alert.alert(
          'Eliminar Barbero',
          '¿Estás seguro de que quieres eliminar este barbero?',
          [
              { text: 'Cancelar', style: 'cancel' },
              { 
                  text: 'Eliminar', 
                  style: 'destructive',
                  onPress: () => {
                      setBarbers(barbers.filter(b => b.id !== barberId));
                      setViewMode('list');
                  }
              }
          ]
      );
  };

  const toggleServiceSelection = (serviceName) => {
      const currentServices = editingBarber.services || [];
      if (currentServices.includes(serviceName)) {
          setEditingBarber({
              ...editingBarber,
              services: currentServices.filter(s => s !== serviceName)
          });
      } else {
          setEditingBarber({
              ...editingBarber,
              services: [...currentServices, serviceName]
          });
      }
  };

  const renderList = () => {
    const filteredBarbers = barbers.filter(b => 
        selectedBranchFilter === 'Todos' || (b.branch || 'Centro') === selectedBranchFilter
    );

    return (
    <View style={styles.content}>
      <View style={styles.filterContainer}>
        {['Todos', 'Centro', 'Lomas'].map(filter => (
            <TouchableOpacity 
                key={filter}
                style={[styles.filterButton, selectedBranchFilter === filter && styles.filterButtonActive]}
                onPress={() => setSelectedBranchFilter(filter)}
            >
                <Text style={[styles.filterText, selectedBranchFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => {
            setEditingBarber({ name: '', role: '', services: [], branch: 'Centro' });
            setViewMode('form');
        }}
      >
        <Text style={styles.addButtonText}>+ REGISTRAR NUEVO BARBERO</Text>
      </TouchableOpacity>
      
      <FlatList
        key={`grid-${numColumns}`}
        data={filteredBarbers}
        numColumns={numColumns}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
        columnWrapperStyle={numColumns > 1 ? { gap: 20 } : undefined}
        renderItem={({ item }) => {
          const stats = getBarberStats(item.name);
          return (
            <TouchableOpacity 
              style={[styles.card, { width: itemWidth, marginBottom: 0 }]} 
              onPress={() => {
                setSelectedBarber({ ...item, ...stats });
                setViewMode('details');
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.role}</Text>
                    <Text style={styles.branchTag}>{item.branch || 'Centro'}</Text>
                </View>
                <View style={[styles.statusBadge, item.active ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>{item.active ? 'ACTIVO' : 'INACTIVO'}</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalServices}</Text>
                    <Text style={styles.statLabel}>SERVICIOS</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>${stats.totalEarnings}</Text>
                    <Text style={styles.statLabel}>GENERADO</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
  };

  const renderForm = () => {
    const availableServices = SERVICES.filter(s => 
        !s.branch || s.branch === 'Ambas' || s.branch === editingBarber.branch
    );

    return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.formContentContainer}
    >
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>{editingBarber.id ? 'Editar Barbero' : 'Registrar Barbero'}</Text>
        
        <Text style={styles.label}>Nombre</Text>
        <TextInput 
          style={styles.input} 
          value={editingBarber.name}
          onChangeText={t => setEditingBarber({...editingBarber, name: t})}
          placeholder="Ej. Juan Pérez"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Rol</Text>
        <TextInput 
          style={styles.input} 
          value={editingBarber.role}
          onChangeText={t => setEditingBarber({...editingBarber, role: t})}
          placeholder="Ej. Master Barber"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Sucursal</Text>
        <View style={styles.rowInputs}>
          <TouchableOpacity 
              style={[styles.branchOption, editingBarber.branch === 'Centro' && styles.branchOptionActive]}
              onPress={() => setEditingBarber({...editingBarber, branch: 'Centro'})}
          >
              <Text style={[styles.branchText, editingBarber.branch === 'Centro' && styles.branchTextActive]}>Centro</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.branchOption, editingBarber.branch === 'Lomas' && styles.branchOptionActive]}
              onPress={() => setEditingBarber({...editingBarber, branch: 'Lomas'})}
          >
              <Text style={[styles.branchText, editingBarber.branch === 'Lomas' && styles.branchTextActive]}>Lomas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Servicios Habilitados ({editingBarber.services?.length || 0})</Text>
        <View style={styles.servicesGrid}>
            {availableServices.map(service => {
                const isSelected = editingBarber.services?.includes(service.name);
                return (
                    <TouchableOpacity 
                        key={service.id}
                        style={[styles.serviceChip, isSelected && styles.serviceChipActive]}
                        onPress={() => toggleServiceSelection(service.name)}
                    >
                        <Text style={[styles.serviceChipText, isSelected && styles.serviceChipTextActive]}>
                            {service.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setViewMode('list')}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    );
  };

  const renderDetails = () => (
    <View style={styles.content}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => setViewMode('list')} style={styles.backButton}>
            <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>{selectedBarber.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View>
                <Text style={styles.detailLabel}>Rol:</Text>
                <Text style={styles.detailValue}>{selectedBarber.role}</Text>
                <Text style={[styles.detailLabel, {marginTop: 5}]}>Sucursal:</Text>
                <Text style={styles.detailValue}>{selectedBarber.branch || 'Centro'}</Text>
            </View>
            <View style={styles.detailsActions}>
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                        setEditingBarber({...selectedBarber});
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
        
        <Text style={[styles.detailLabel, {marginTop: 10}]}>Servicios Habilitados:</Text>
        <View style={styles.tagsContainer}>
            {selectedBarber.services.map((s, i) => (
                <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{s}</Text>
                </View>
            ))}
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
                <Text style={styles.historyDate}>{item.date} {item.time}</Text>
                <Text style={styles.historyService}>{item.serviceName}</Text>
                <Text style={styles.historyPrice}>+${item.price}</Text>
            </View>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Barberos</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'list' && renderList()}
      {viewMode === 'form' && renderForm()}
      {viewMode === 'details' && renderDetails()}
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
    borderBottomColor: COLORS.secondary,
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  branchOption: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  branchOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  branchText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  branchTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  activeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: COLORS.danger,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Form Styles
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
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
    borderColor: COLORS.secondary,
  },
  rowInputs: {
    flexDirection: isMobile ? 'column' : 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
    gap: 10,
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
    borderColor: COLORS.secondary,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
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
  // Details Styles
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  tag: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  bigStatBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  bigStatValue: {
    color: COLORS.success,
    fontSize: 24,
    fontWeight: 'bold',
  },
  bigStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyDate: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 12,
  },
  historyService: {
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  historyPrice: {
    color: COLORS.primary,
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    padding: 5,
    borderRadius: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: COLORS.black,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  serviceChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: 'transparent',
  },
  serviceChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  serviceChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  serviceChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsActions: {
    flexDirection: 'column',
    gap: 10,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  branchTag: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
