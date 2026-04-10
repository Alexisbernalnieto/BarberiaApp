import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { Search, Plus, ChevronDown, ChevronRight, Tag, Store, DollarSign, X, Save, Clock, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '../../firebaseClient';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Service } from '../../types';

const AdminServices = ({ COLORS, isMobile, onBack }: any) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('AMBAS');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({}); // Inicia colapsado por defecto
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Feedback modal state (replaces Alert.alert for cross-platform)
  const [feedbackModal, setFeedbackModal] = useState<{visible: boolean, type: 'success' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void}>({
    visible: false, type: 'success', title: '', message: ''
  });

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form State
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    category: 'CORTES',
    branch: 'AMBAS',
  });

  const categories = [
    { id: 'BARBAS', label: 'BARBAS', icon: '✂️' },
    { id: 'CORTES', label: 'CORTES', icon: '💇‍♂️' },
    { id: 'FACIALES', label: 'FACIALES', icon: '💆‍♂️' },
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'services'));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      console.log(`[ADMIN SERVICES] Se cargaron ${fetched.length} servicios.`);
      setServices(fetched);
    } catch (error) {
      console.error("[ADMIN SERVICES] Error al obtener servicios:", error);
      showFeedback('error', 'Error de Red', 'No se pudieron cargar los servicios de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Migración automática de datos existentes a MAYÚSCULAS
  useEffect(() => {
    if (services.length > 0) {
      const needsMigration = services.some(s => 
        (s.category && s.category !== s.category.toUpperCase()) || 
        (s.branch && s.branch !== s.branch.toUpperCase())
      );

      if (needsMigration) {
        console.log("[ADMIN] Iniciando migración de normalización de servicios...");
        services.forEach(async (service) => {
          if (service.id) {
            const upCat = service.category?.toUpperCase() || 'CORTES';
            const upBranch = service.branch?.toUpperCase() || 'AMBAS';
            if (service.category !== upCat || service.branch !== upBranch) {
              try {
                await updateDoc(doc(db, 'services', String(service.id)), {
                  category: upCat,
                  branch: upBranch
                });
              } catch (e) {
                console.error("Error migrando servicio:", service.id, e);
              }
            }
          }
        });
      }
    }
  }, [services]);

  // Dynamically group services to avoid missing categories not in the hardcoded list
  const getServicesByCategory = (catId: string) => {
    return filteredServices.filter(s => (s.category || 'OTROS').toUpperCase() === catId.toUpperCase());
  };

  // Get unique categories from current services + formal categories
  const allCategoryIds = Array.from(new Set([
    ...categories.map(c => c.id),
    ...services.map(s => (s.category || 'OTROS').toUpperCase())
  ]));

  const showFeedback = (type: 'success' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
    setFeedbackModal({ visible: true, type, title, message, onConfirm });
  };

  const handleCreateService = async () => {
    const name = newService.name.trim();
    const priceStr = String(newService.price).trim();
    const durationStr = String(newService.duration).trim();

    if (!name || !priceStr || !durationStr) {
      showFeedback('error', 'Campos Incompletos', 'Por favor completa el nombre, el precio y la duración.');
      return;
    }

    const price = parseFloat(priceStr);
    const duration = parseInt(durationStr);

    if (isNaN(price) || isNaN(duration)) {
      showFeedback('error', 'Error de Formato', 'El precio y la duración deben ser números válidos.');
      return;
    }

    if (price <= 0) {
      showFeedback('error', 'Precio Inválido', 'El precio debe ser un monto positivo.');
      return;
    }

    if (duration <= 0) {
      showFeedback('error', 'Duración Inválida', 'La duración debe ser al menos de 1 minuto.');
      return;
    }

    try {
      setSaving(true);
      const catUpper = newService.category.toUpperCase();
      const branchUpper = newService.branch.toUpperCase();

      console.log("[ADMIN SERVICES] Intentando guardar nuevo servicio:", {
        name,
        price,
        duration,
        category: catUpper,
        branch: branchUpper
      });

      const docRef = await addDoc(collection(db, 'services'), {
        name,
        price,
        duration,
        category: catUpper,
        branch: branchUpper,
        active: true,
        createdAt: new Date().toISOString()
      });
      
      console.log("[ADMIN SERVICES] ¡Éxito! Servicio creado con ID:", docRef.id);
      
      setShowCreateModal(false);
      
      setNewService({
        name: '',
        price: '',
        duration: '',
        category: 'CORTES',
        branch: 'AMBAS',
      });
      
      // Expand target category to show the new item
      setExpandedCategories(prev => ({ ...prev, [catUpper]: true }));
      
      await fetchServices();
      
      showFeedback('success', '¡Servicio Guardado!', `"${name}" se ha registrado correctamente.`);
    } catch (error: any) {
      console.error("[ADMIN SERVICES] Error fatal al crear servicio:", error);
      let errorMsg = 'No se pudo registrar el servicio. Revisa tu conexión a internet o permisos.';
      if (error.code === 'permission-denied') errorMsg = 'Error de Permisos: No tienes autorización para realizar esta acción.';
      
      showFeedback('error', 'Fallo al Guardar', errorMsg + '\n\n' + (error.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = search.trim() === '' || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = selectedBranch === 'AMBAS' || s.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const confirmDelete = (id: string) => {
    setDeleteTarget(id);
    showFeedback('confirm', 'Eliminar Servicio', '¿Estás seguro de que deseas eliminar este servicio definitivamente?', async () => {
      try {
        await deleteDoc(doc(db, 'services', id));
        await fetchServices();
        setFeedbackModal(prev => ({ ...prev, visible: false }));
        setDeleteTarget(null);
      } catch (error: any) {
        showFeedback('error', 'Error al Eliminar', 'No se pudo procesar la eliminación: ' + (error.message || 'Error desconocido'));
      }
    });
  };

  // Cross-platform feedback modal (replaces Alert.alert)
  const renderFeedbackModal = () => (
    <Modal
      visible={feedbackModal.visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.feedbackContent, { backgroundColor: COLORS.surface, borderColor: COLORS.primary }]}>
          <View style={[styles.feedbackIconBox, { 
            backgroundColor: feedbackModal.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                             feedbackModal.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                             'rgba(245, 158, 11, 0.1)'
          }]}>
            {feedbackModal.type === 'success' ? (
              <CheckCircle size={32} color="#10B981" />
            ) : feedbackModal.type === 'error' ? (
              <AlertTriangle size={32} color="#EF4444" />
            ) : (
              <Trash2 size={32} color="#F59E0B" />
            )}
          </View>
          <Text style={[styles.feedbackTitle, { color: COLORS.text }]}>{feedbackModal.title}</Text>
          <Text style={[styles.feedbackMessage, { color: COLORS.textSecondary }]}>{feedbackModal.message}</Text>
          
          {feedbackModal.type === 'confirm' ? (
            <View style={styles.feedbackActions}>
              <TouchableOpacity 
                style={[styles.feedbackBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => {
                  setFeedbackModal(prev => ({ ...prev, visible: false }));
                  setDeleteTarget(null);
                }}
              >
                <Text style={[styles.feedbackBtnText, { color: COLORS.text }]}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.feedbackBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => feedbackModal.onConfirm?.()}
              >
                <Text style={[styles.feedbackBtnText, { color: '#FFF' }]}>SÍ, ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.feedbackBtn, { backgroundColor: COLORS.primary, width: '100%' }]}
              onPress={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            >
              <Text style={[styles.feedbackBtnText, { color: '#000' }]}>ENTENDIDO</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: COLORS.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>NUEVO SERVICIO</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>NOMBRE DEL SERVICIO</Text>
              <TextInput
                style={[styles.input, { color: COLORS.text, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                placeholder="Ej. Corte Clásico"
                placeholderTextColor={COLORS.textSecondary + '80'}
                value={newService.name}
                onChangeText={(val) => setNewService({...newService, name: val})}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>PRECIO ($)</Text>
                <TextInput
                  style={[styles.input, { color: COLORS.text, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                  placeholder="300"
                  placeholderTextColor={COLORS.textSecondary + '80'}
                  keyboardType="numeric"
                  value={String(newService.price)}
                  onChangeText={(val) => setNewService({...newService, price: val})}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>DURACIÓN (MIN)</Text>
                <TextInput
                  style={[styles.input, { color: COLORS.text, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                  placeholder="30"
                  placeholderTextColor={COLORS.textSecondary + '80'}
                  keyboardType="numeric"
                  value={String(newService.duration)}
                  onChangeText={(val) => setNewService({...newService, duration: val})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>CATEGORÍA</Text>
              <View style={styles.categoryPicker}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pickerItem,
                      newService.category === cat.id && { backgroundColor: COLORS.primary }
                    ]}
                    onPress={() => setNewService({...newService, category: cat.id})}
                  >
                    <Text style={[
                      styles.pickerText,
                      { color: newService.category === cat.id ? '#000' : COLORS.textSecondary }
                    ]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>SUCURSAL</Text>
              <View style={styles.categoryPicker}>
                {['AMBAS', 'CENTRO', 'LOMAS'].map(branch => (
                  <TouchableOpacity
                    key={branch}
                    style={[
                      styles.pickerItem,
                      newService.branch === branch && { backgroundColor: COLORS.primary }
                    ]}
                    onPress={() => setNewService({...newService, branch: branch})}
                  >
                    <Text style={[
                      styles.pickerText,
                      { color: newService.branch === branch ? '#000' : COLORS.textSecondary }
                    ]}>{branch}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: COLORS.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleCreateService}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Plus size={20} color="#000" />
                <Text style={styles.saveBtnText}>GUARDAR SERVICIO</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.primary }]}>GESTIÓN DE SERVICIOS</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.closeBtn, { color: COLORS.text }]}>Cerrar</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.filterCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)' }]}>
        <View style={[styles.searchBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput 
            placeholder="Buscar servicio..."
            placeholderTextColor={COLORS.textSecondary + '80'}
            style={[styles.searchInput, { color: COLORS.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterSection}>
           <Text style={[styles.filterLabel, { color: COLORS.textSecondary }]}>SUCURSAL:</Text>
           <View style={styles.branchRow}>
             {['AMBAS', 'CENTRO', 'LOMAS'].map(b => (
                <TouchableOpacity 
                   key={b}
                   style={[styles.branchBtn, selectedBranch === b && { backgroundColor: COLORS.primary }]}
                   onPress={() => setSelectedBranch(b)}
                >
                   <Text style={[styles.branchBtnText, { color: selectedBranch === b ? '#000' : COLORS.textSecondary }]}>{b}</Text>
                </TouchableOpacity>
             ))}
           </View>
        </View>

        <View style={styles.divider} />
        <Text style={[styles.resultsCount, { color: COLORS.primary }]}>{filteredServices.length} SERVICIOS ENCONTRADOS</Text>
      </View>

      <TouchableOpacity 
        style={[styles.createBtn, { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.createBtnText, { color: COLORS.primary }]}>NUEVO SERVICIO</Text>
      </TouchableOpacity>

      {renderCreateModal()}
      {renderFeedbackModal()}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.categoryList} showsVerticalScrollIndicator={false}>
          {allCategoryIds.map(catId => {
            const catInfo = categories.find(c => c.id === catId);
            const label = catInfo ? catInfo.label : catId;
            const icon = catInfo ? catInfo.icon : '📌';
            const catServices = getServicesByCategory(catId);
            
            if (catServices.length === 0 && search.trim() !== '') return null;

            return (
              <View key={catId} style={styles.categoryGroup}>
                <TouchableOpacity 
                  style={[
                    styles.categoryHeader, 
                    { 
                      backgroundColor: COLORS.surface,
                      borderColor: expandedCategories[catId] ? COLORS.primary : 'rgba(255,255,255,0.05)',
                    }
                  ]} 
                  onPress={() => toggleCategory(catId)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.categoryIcon, { backgroundColor: expandedCategories[catId] ? COLORS.primary : COLORS.primary + '10' }]}>
                      <Text style={{ fontSize: 18, color: expandedCategories[catId] ? '#000' : '#FFF' }}>{icon}</Text>
                    </View>
                    <View>
                      <Text style={[styles.categoryTitle, { color: expandedCategories[catId] ? COLORS.primary : COLORS.text }]}>{label}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '800' }}>
                        {catServices.length} SERVICIOS DISPONIBLES
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.chevronBadge, { backgroundColor: expandedCategories[catId] ? COLORS.primary + '20' : 'rgba(255,255,255,0.05)' }]}>
                    <ChevronDown 
                      size={16} 
                      color={expandedCategories[catId] ? COLORS.primary : COLORS.textSecondary} 
                      style={{ transform: [{ rotate: expandedCategories[catId] ? '180deg' : '0deg' }] }}
                    />
                  </View>
                </TouchableOpacity>

                {expandedCategories[catId] && (
                  <View style={styles.serviceItems}>
                    {catServices.map(service => (
                      <View key={service.id} style={[styles.serviceCard, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 }]}>
                          <View style={styles.serviceInfo}>
                              <Text style={[styles.serviceName, { color: COLORS.text }]}>{service.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Clock size={12} color={COLORS.textSecondary} />
                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{service.duration} min</Text>
                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>•</Text>
                                <Store size={12} color={COLORS.textSecondary} />
                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{service.branch || 'AMBAS'}</Text>
                              </View>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 10 }}>
                            <Text style={[styles.servicePrice, { color: COLORS.primary }]}>${Number(service.price).toLocaleString()}</Text>
                            <TouchableOpacity 
                              onPress={() => confirmDelete(String(service.id))}
                              style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                gap: 4,
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8
                              }}
                            >
                              <Trash2 size={12} color="#EF4444" />
                              <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '900' }}>ELIMINAR</Text>
                            </TouchableOpacity>
                          </View>
                      </View>
                    ))}
                    {catServices.length === 0 && (
                      <View style={[styles.emptyCategory, { backgroundColor: 'rgba(255,255,255,0.01)' }]}>
                        <Text style={[styles.emptyCategoryText, { color: COLORS.textSecondary }]}>No hay servicios en esta categoría.</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { fontSize: 16, fontWeight: '700' },
  filterCard: { padding: 24, borderRadius: 28, borderWidth: 1, gap: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 14, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  filterSection: { gap: 10 },
  filterLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  branchRow: { flexDirection: 'row', gap: 8 },
  branchBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  branchBtnText: { fontSize: 12, fontWeight: '800' },
  priceRange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resetBtn: { padding: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  resultsCount: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  createBtn: { height: 56, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  createBtnText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  categoryList: { gap: 16, paddingBottom: 60, paddingTop: 10 },
  categoryGroup: { marginBottom: 4 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  chevronBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  serviceItems: { gap: 12, paddingHorizontal: 4, marginTop: 16, marginBottom: 24 },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 22 },
  serviceInfo: { gap: 6, flex: 1 },
  serviceName: { fontSize: 17, fontWeight: '800' },
  servicePrice: { fontSize: 20, fontWeight: '900' },
  actionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  emptyCategory: { padding: 40, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyCategoryText: { fontSize: 14, fontStyle: 'italic', fontWeight: '500' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, borderRadius: 32, borderWidth: 1, padding: 30, gap: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  modalForm: { maxHeight: 500 },
  inputGroup: { gap: 8, marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  row: { flexDirection: 'row', gap: 12 },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerItem: { paddingHorizontal: 16, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pickerText: { fontSize: 12, fontWeight: '700' },
  saveBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: '#000' },
  
  // Feedback Modal Styles
  feedbackContent: { width: '100%', maxWidth: 400, borderRadius: 28, borderWidth: 1, padding: 32, gap: 16, alignItems: 'center' },
  feedbackIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  feedbackTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  feedbackMessage: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  feedbackActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  feedbackBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  feedbackBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});

export default AdminServices;
