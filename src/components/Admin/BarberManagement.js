import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import BarberList from './BarberList';
import BarberForm from './BarberForm';
import BarberDetails from './BarberDetails';

export default function BarberManagement({ appointments, onClose, COLORS, barbers, setBarbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Configuración de Grid Responsivo
  const containerPadding = 40; // 20 paddingHorizontal * 2
  const gap = 20;
  const numColumns = width > 1400 ? 4 : width > 1000 ? 3 : width > 700 ? 2 : 1;
  // Calcular ancho exacto para cada tarjeta restando el espacio de los gaps
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'details'
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [editingBarber, setEditingBarber] = useState(null); // Used for form
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('Todos'); // 'Todos', 'Centro', 'Lomas'
  const [selectedDay, setSelectedDay] = useState(1); // 0=Domingo, 1=Lunes, etc.

  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const DEFAULT_SCHEDULE = {
      0: { start: '10:00', end: '15:00', active: true },
      1: { start: '10:00', end: '19:00', active: true },
      2: { start: '10:00', end: '19:00', active: true },
      3: { start: '10:00', end: '19:00', active: true },
      4: { start: '10:00', end: '19:00', active: true },
      5: { start: '10:00', end: '19:00', active: true },
      6: { start: '10:00', end: '19:00', active: true },
  };

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
        // Ensure schedule exists
        const barberToSave = {
            ...editingBarber,
            schedule: editingBarber.schedule || DEFAULT_SCHEDULE
        };

        if (editingBarber.id) {
            // Edit existing
            setBarbers(barbers.map(b => b.id === editingBarber.id ? barberToSave : b));
        } else {
            // Add new
            setBarbers([...barbers, { 
                id: barbers.length + 1, 
                ...barberToSave, 
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
        services: currentServices.filter(s => s !== serviceName),
      });
    } else {
      setEditingBarber({
        ...editingBarber,
        services: [...currentServices, serviceName],
      });
    }
  };

  const updateSchedule = (dayIndex, field, value) => {
    const currentSchedule = editingBarber.schedule || DEFAULT_SCHEDULE;
    setEditingBarber({
      ...editingBarber,
      schedule: {
        ...currentSchedule,
        [dayIndex]: {
          ...currentSchedule[dayIndex],
          [field]: value,
        },
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Barberos</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'list' && (
        <BarberList
          styles={styles}
          barbers={barbers}
          numColumns={numColumns}
          itemWidth={itemWidth}
          getBarberStats={getBarberStats}
          selectedBranchFilter={selectedBranchFilter}
          setSelectedBranchFilter={setSelectedBranchFilter}
          onAddNew={() => {
            setEditingBarber({ name: '', role: '', services: [], branch: 'Centro' });
            setViewMode('form');
          }}
          onSelectBarber={barber => {
            setSelectedBarber(barber);
            setViewMode('details');
          }}
        />
      )}
      {viewMode === 'form' && editingBarber && (
        <BarberForm
          styles={styles}
          DAYS={DAYS}
          editingBarber={editingBarber}
          setEditingBarber={setEditingBarber}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          defaultSchedule={DEFAULT_SCHEDULE}
          updateSchedule={updateSchedule}
          toggleServiceSelection={toggleServiceSelection}
          onCancel={() => {
            setViewMode('list');
          }}
          onSave={handleSave}
        />
      )}
      {viewMode === 'details' && selectedBarber && (
        <BarberDetails
          styles={styles}
          DAYS={DAYS}
          selectedBarber={selectedBarber}
          defaultSchedule={DEFAULT_SCHEDULE}
          onBack={() => setViewMode('list')}
          onEdit={() => {
            setEditingBarber({ ...selectedBarber });
            setViewMode('form');
          }}
          onDelete={() => handleDelete(selectedBarber.id)}
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
    textTransform: 'uppercase',
  },
  filterTextActive: {
    color: '#000',
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
  // Schedule Styles
  scheduleContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    overflow: 'hidden',
  },
  daysScroll: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  dayTab: {
    padding: 15,
    alignItems: 'center',
    minWidth: 80,
    borderRightWidth: 1,
    borderRightColor: COLORS.secondary,
  },
  dayTabActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  dayTabText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
  },
  dayTabTextActive: {
    color: COLORS.primary,
  },
  dayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayIndicatorActive: {
    backgroundColor: COLORS.success,
  },
  dayIndicatorInactive: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.3,
  },
  scheduleEditor: {
    padding: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedDayTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeToggle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeToggleOn: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: COLORS.success,
  },
  activeToggleOff: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: COLORS.danger,
  },
  activeToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeToggleTextOn: {
    color: COLORS.success,
  },
  activeToggleTextOff: {
    color: COLORS.danger,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  timeSeparator: {
    color: COLORS.textSecondary,
    fontSize: 20,
    marginTop: 10,
  },
  scheduleSummary: {
    marginTop: 10,
    gap: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  scheduleDay: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scheduleTime: {
    color: COLORS.text,
    fontWeight: '500',
  },
  scheduleTimeInactive: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
