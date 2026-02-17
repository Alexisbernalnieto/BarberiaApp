import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BRANCH_FILTERS = ['Todas', 'Ambas', 'Centro', 'Lomas'];

export default function ServiceList({
  styles,
  COLORS,
  filteredServices,
  servicesByCategory,
  searchText,
  setSearchText,
  filterBranch,
  setFilterBranch,
  priceRange,
  setPriceRange,
  expandedCategory,
  setExpandedCategory,
  onCreateNew,
  onSelectService,
}) {
  return (
    <View style={styles.content}>
      <View style={styles.filterPanel}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicio..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Sucursal:</Text>
          <View style={styles.filterOptions}>
            {BRANCH_FILTERS.map(branch => (
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

      <TouchableOpacity style={styles.addButton} onPress={onCreateNew}>
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
                  setExpandedCategory(expandedCategory === category ? null : category)
                }
              >
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons
                    name={expandedCategory === category ? 'chevron-down' : 'chevron-right'}
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
                  {servicesByCategory[category].map((service, idx) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.card,
                        idx === servicesByCategory[category].length - 1 &&
                          styles.cardLast,
                      ]}
                      onPress={() => onSelectService(service)}
                    >
                      <View style={styles.cardRow}>
                        <View style={styles.mainInfo}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.serviceDetails}>
                            {service.duration} min • {service.assignedTo}
                          </Text>
                          <View style={styles.branchBadge}>
                            <MaterialCommunityIcons
                              name="office-building"
                              size={12}
                              color={COLORS.primary}
                            />
                            <Text style={styles.branchBadgeText}> {service.branch}</Text>
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

