import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { SERVICES as INITIAL_SERVICES, BARBERS } from '../../data/mockData';
import ServiceListView from './ServiceListView';
import ServiceFormView from './ServiceFormView';
import { CATEGORIES, getServiceManagementStyles } from './ServiceManagementStyles';

export default function ServiceManagement({ onClose, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const containerPadding = 40; 
  const gap = 20;
  const numColumns = width > 1400 ? 4 : width > 1000 ? 3 : width > 700 ? 2 : 1;
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(
    () => getServiceManagementStyles(COLORS, isMobile),
    [COLORS, isMobile],
  );
  // Load services from mockData
  const [services, setServices] = useState(INITIAL_SERVICES);

  const [viewMode, setViewMode] = useState('list'); // 'list', 'edit'
  const [editingService, setEditingService] = useState(null);
  
  const [searchText, setSearchText] = useState('');
  const [filterBranch, setFilterBranch] = useState('Ambas');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [expandedCategory, setExpandedCategory] = useState('Todos');

  const getCategoryForService = (serviceName) => {
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      if (keywords.some(keyword => serviceName.toLowerCase().includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    return 'Otros';
  };

  const getFilteredServices = () => {
    return services
      .filter(service => {
        // Filtro por búsqueda
        if (searchText && !service.name.toLowerCase().includes(searchText.toLowerCase())) {
          return false;
        }
        // Filtro por sucursal
        if (service.branch !== filterBranch) {
          return false;
        }
        // Filtro por precio
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

  // ✅ NUEVA FUNCIÓN: Detectar barberos sin servicios
  const getBarbersWithoutServices = () => {
    return BARBERS.filter(barber => {
      return !services.some(service => {
        const barberList = service.assignedBarbers || 
                          (service.assignedTo === 'Todos' ? BARBERS.map(b => b.name) : service.assignedTo?.split(', ') || []);
        return barberList.includes(barber.name);
      });
    });
  };

  // ✅ NUEVA FUNCIÓN: Obtener servicios populares
  const getPopularServices = () => {
    return services
      .sort((a, b) => {
        const aCount = (a.assignedBarbers || []).length;
        const bCount = (b.assignedBarbers || []).length;
        return bCount - aCount;
      })
      .slice(0, 5);
  };

  // ✅ NUEVA FUNCIÓN: Obtener servicios recomendados por barbero
  const getRecommendedServicesForBarber = (barberName) => {
    const barberBranch = BARBERS.find(b => b.name === barberName)?.branch;
    return getPopularServices()
      .filter(s => s.branch === 'Ambas' || s.branch === barberBranch)
      .slice(0, 3);
  };

  const handleSave = () => {
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
        // Edit existing
        setServices(services.map(s => s.id === editingService.id ? editingService : s));
        Alert.alert('Éxito', 'Servicio actualizado correctamente');
    } else {
        // Add new
        const newService = { 
            ...editingService, 
            id: Math.max(...services.map(s => s.id), 0) + 1
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Servicios</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'list' && (
        <ServiceListView
          styles={styles}
          COLORS={COLORS}
          searchText={searchText}
          setSearchText={setSearchText}
          filterBranch={filterBranch}
          setFilterBranch={setFilterBranch}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          expandedCategory={expandedCategory}
          setExpandedCategory={setExpandedCategory}
          setEditingService={setEditingService}
          setViewMode={setViewMode}
          getFilteredServices={getFilteredServices}
          getServicesByCategory={getServicesByCategory}
          getBarbersWithoutServices={getBarbersWithoutServices}
          getRecommendedServicesForBarber={getRecommendedServicesForBarber}
          services={services}
          setServices={setServices}
        />
      )}
      {viewMode === 'edit' && editingService && (
        <ServiceFormView
          styles={styles}
          editingService={editingService}
          setEditingService={setEditingService}
          handleDelete={handleDelete}
          handleSave={handleSave}
          setViewMode={setViewMode}
        />
      )}
    </View>
  );
}
