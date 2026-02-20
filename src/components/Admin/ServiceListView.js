import React from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BARBERS } from '../../data/mockData';

export default function ServiceListView({
  styles,
  COLORS,
  searchText,
  setSearchText,
  filterBranch,
  setFilterBranch,
  priceRange,
  setPriceRange,
  expandedCategory,
  setExpandedCategory,
  setEditingService,
  setViewMode,
  getFilteredServices,
  getServicesByCategory,
  getBarbersWithoutServices,
  getRecommendedServicesForBarber,
  services,
  setServices,
}) {
  const filteredServices = getFilteredServices();
  const servicesByCategory = getServicesByCategory(filteredServices);
  const barbersWithoutServices = getBarbersWithoutServices();

  // ✅ Función para asignar servicio rápidamente a un barbero
  const handleQuickAssignService = (barberName, service) => {
    const currentBarbers = service.assignedBarbers || [];
    if (!currentBarbers.includes(barberName)) {
      const updatedService = {
        ...service,
        assignedBarbers: [...currentBarbers, barberName],
      };
      setServices(services.map(s => s.id === service.id ? updatedService : s));
    }
  };

  return (
    <View style={styles.content}>
      <View style={styles.filterPanel}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={COLORS.primary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicio..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Sucursal:</Text>
          <View style={styles.filterOptions}>
            {['Ambas', 'Centro', 'Lomas'].map(branch => (
              <TouchableOpacity
                key={branch}
                style={[
                  styles.filterBadge,
                  filterBranch === branch && styles.filterBadgeActive,
                ]}
                onPress={() => setFilterBranch(branch)}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    filterBranch === branch && styles.filterBadgeTextActive,
                  ]}
                >
                  {branch}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Precio:</Text>
          <View style={styles.priceFilterContainer}>
            <View style={styles.priceInput}>
              <Text style={styles.pricePrefix}>$</Text>
              <TextInput
                style={styles.priceField}
                placeholder="Mín"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={String(priceRange.min)}
                onChangeText={val =>
                  setPriceRange({ ...priceRange, min: Number(val) || 0 })
                }
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceField}
                placeholder="Máx"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={String(priceRange.max)}
                onChangeText={val =>
                  setPriceRange({ ...priceRange, max: Number(val) || 1000 })
                }
              />
              <Text style={styles.pricePrefix}>$</Text>
            </View>
            <TouchableOpacity
              style={styles.resetPriceButton}
              onPress={() => setPriceRange({ min: 0, max: 1000 })}
            >
              <Text style={styles.resetPriceText}>Restablecer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSummary}>
          <Text style={styles.filterSummaryText}>
            {filteredServices.length} servicio
            {filteredServices.length !== 1 ? 's' : ''} encontrado
            {filteredServices.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* ✅ ALERTA: Barberos sin servicios */}
      {barbersWithoutServices.length > 0 && (
        <View style={styles.warningPanel}>
          <View style={styles.warningHeader}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={24}
              color="#FFA500"
            />
            <Text style={styles.warningTitle}>
              {barbersWithoutServices.length} Barbero{barbersWithoutServices.length !== 1 ? 's' : ''} sin Servicios
            </Text>
          </View>
          <Text style={styles.warningDescription}>
            Asigna servicios a estos barberos para que puedan recibir citas
          </Text>
          
          <FlatList
            data={barbersWithoutServices}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item: barber }) => {
              const recommendedServices = getRecommendedServicesForBarber(barber.name);
              return (
                <View style={styles.barberWarningItem}>
                  <View style={styles.barberWarningInfo}>
                    <Text style={styles.barberWarningName}>{barber.name}</Text>
                    <Text style={styles.barberWarningSpecialty}>{barber.specialty}</Text>
                  </View>
                  <View style={styles.barberWarningActions}>
                    <Text style={styles.suggestionsLabel}>Sugerencias:</Text>
                    <View style={styles.suggestedServices}>
                      {recommendedServices.map((service, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.suggestedServiceBadge}
                          onPress={() => handleQuickAssignService(barber.name, service)}
                        >
                          <MaterialCommunityIcons
                            name="plus-circle"
                            size={14}
                            color={COLORS.primary}
                          />
                          <Text style={styles.suggestedServiceText}>{service.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingService({
            name: '',
            price: '',
            duration: '',
            branch: 'Ambas',
            assignedBarbers: [],
          });
          setViewMode('edit');
        }}
      >
        <Text style={styles.addButtonText}>+ Crear Nuevo Servicio</Text>
      </TouchableOpacity>

      {filteredServices.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="magnify"
            size={40}
            color={COLORS.primary}
            opacity={0.5}
          />
          <Text style={styles.emptyStateText}>
            No hay servicios que coincidan con tu búsqueda
          </Text>
        </View>
      ) : (
        <FlatList
          data={Object.keys(servicesByCategory).sort()}
          keyExtractor={category => category}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item: category }) => (
            <View style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() =>
                  setExpandedCategory(
                    expandedCategory === category ? null : category,
                  )
                }
              >
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons
                    name={
                      expandedCategory === category
                        ? 'chevron-down'
                        : 'chevron-right'
                    }
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {servicesByCategory[category].length}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {expandedCategory === category && (
                <View style={styles.categoryServices}>
                  {servicesByCategory[category].map((service, index) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.card,
                        index === servicesByCategory[category].length - 1 &&
                          styles.cardLast,
                      ]}
                      onPress={() => {
                        setEditingService({
                          ...service,
                          assignedBarbers:
                            service.assignedTo === 'Todos'
                              ? []
                              : service.assignedTo?.split(', ') || [],
                        });
                        setViewMode('edit');
                      }}
                    >
                      <View style={styles.cardRow}>
                        <View style={styles.mainInfo}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <View style={styles.durationRow}>
                            <MaterialCommunityIcons
                              name="clock-outline"
                              size={14}
                              color={COLORS.primary}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.durationText}>
                              {service.duration}m
                            </Text>
                            <MaterialCommunityIcons
                              name="plus"
                              size={12}
                              color={COLORS.textSecondary}
                              style={{ marginHorizontal: 4 }}
                            />
                            <Text style={styles.bufferText}>
                              {service.bufferTime || 5}m limpieza
                            </Text>
                            <Text style={styles.totalTimeText}>
                              = {(service.duration || 0) + (service.bufferTime || 5)}m total
                            </Text>
                          </View>
                          <View style={styles.branchBadge}>
                            <MaterialCommunityIcons
                              name="office-building"
                              size={12}
                              color={COLORS.primary}
                            />
                            <Text style={styles.branchBadgeText}>
                              {' '}
                              {service.branch}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.priceTag}>${service.price}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

