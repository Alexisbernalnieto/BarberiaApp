import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { SERVICES as INITIAL_SERVICES } from '../../data/mockData';
import ServiceList from './ServiceList';
import ServiceForm from './ServiceForm';

export default function ServiceManagement({ onClose, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Responsive Grid Config
  const containerPadding = 40; 
  const gap = 20;
  const numColumns = width > 1400 ? 4 : width > 1000 ? 3 : width > 700 ? 2 : 1;
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);
  // Load services from mockData
  const [services, setServices] = useState(INITIAL_SERVICES);

  const [viewMode, setViewMode] = useState('list'); // 'list', 'edit'
  const [editingService, setEditingService] = useState(null);
  
  // Filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [filterBranch, setFilterBranch] = useState('Todas');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [expandedCategory, setExpandedCategory] = useState('Todos');

  // Categorizar servicios
  const CATEGORIES = {
    'Cortes': ['Corte', 'Fade', 'Tijera'],
    'Barbas': ['Barba', 'Desvanecido'],
    'Faciales': ['Exfoliación', 'Mascarilla', 'Facial', 'Cejas', 'Wax'],
    'Otros': ['Lavado', 'Toallas', 'Colormetría'],
  };

  const getCategoryForService = (serviceName) => {
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      if (keywords.some(keyword => serviceName.toLowerCase().includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    return 'Otros';
  };

  const getFilteredServices = () => {
    return services.filter(service => {
      if (searchText && !service.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (filterBranch !== 'Todas' && service.branch !== filterBranch) {
        return false;
      }
      if (service.price < priceRange.min || service.price > priceRange.max) {
        return false;
      }
      return true;
    });
  };

  const getServicesByCategory = (filteredServices) => {
    const grouped = {};
    filteredServices.forEach(service => {
      const category = getCategoryForService(service.name);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });
    return grouped;
  };

  const handleSave = () => {
    // Validaciones
    if (!editingService.name || editingService.name.trim() === '') {
      Alert.alert('Error', 'El nombre del servicio es requerido');
      return;
    }
    
    if (!editingService.price || editingService.price <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }
    
    if (!editingService.duration || editingService.duration <= 0) {
      Alert.alert('Error', 'La duración debe ser mayor a 0');
      return;
    }

    const assignedBarbers = editingService.assignedBarbers || [];
    if (assignedBarbers.length === 0) {
      Alert.alert('Error', 'Debe asignar al menos un barbero');
      return;
    }

    if (editingService.id) {
      setServices(services.map(s => (s.id === editingService.id ? editingService : s)));
      Alert.alert('Éxito', 'Servicio actualizado correctamente');
    } else {
      const newService = {
        ...editingService,
        id: Math.max(...services.map(s => s.id), 0) + 1,
      };
      setServices([...services, newService]);
      Alert.alert('Éxito', 'Servicio creado correctamente');
    }
    setViewMode('list');
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Servicio',
      `¿Estás seguro de que quieres eliminar "${editingService.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setServices(services.filter(s => s.id !== editingService.id));
            Alert.alert('Éxito', 'Servicio eliminado correctamente');
            setViewMode('list');
          }
        }
      ]
    );
  };

  const filteredServices = getFilteredServices();
  const servicesByCategory = getServicesByCategory(filteredServices);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Servicios</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'list' && (
        <ServiceList
          styles={styles}
          COLORS={COLORS}
          filteredServices={filteredServices}
          servicesByCategory={servicesByCategory}
          searchText={searchText}
          setSearchText={setSearchText}
          filterBranch={filterBranch}
          setFilterBranch={setFilterBranch}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          expandedCategory={expandedCategory}
          setExpandedCategory={setExpandedCategory}
          onCreateNew={() => {
            setEditingService({
              name: '',
              price: '',
              duration: '',
              branch: 'Ambas',
              assignedBarbers: [],
            });
            setViewMode('edit');
          }}
          onSelectService={service => {
            setEditingService({
              ...service,
              assignedBarbers:
                service.assignedTo === 'Todos'
                  ? []
                  : service.assignedTo?.split(', ') || [],
            });
            setViewMode('edit');
          }}
        />
      )}
      {viewMode === 'edit' && editingService && (
        <ServiceForm
          styles={styles}
          COLORS={COLORS}
          editingService={editingService}
          setEditingService={setEditingService}
          onCancel={() => setViewMode('list')}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      )}
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
  filterPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    padding: 12,
    fontSize: 14,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    backgroundColor: 'transparent',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  filterBadgeTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  priceFilterContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    paddingHorizontal: 8,
  },
  priceField: {
    flex: 1,
    color: COLORS.text,
    padding: 8,
    fontSize: 12,
  },
  priceSeparator: {
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  pricePrefix: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  resetPriceButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  resetPriceText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.textSecondary,
  },
  filterSummaryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  categoryHeader: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryServices: {
    backgroundColor: COLORS.background,
    padding: 12,
  },
  cardLast: {
    marginBottom: 0,
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
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 4,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  branchBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
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
  barberCheckboxContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    overflow: 'hidden',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxSpecialty: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
