import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';

export default function QueueDisplay({ appointments, onClose, COLORS }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Responsive Grid Config
  const containerPadding = 40; 
  const gap = 20;
  const numColumns = width > 1400 ? 3 : width > 900 ? 2 : 1; 
  const itemWidth = (width - containerPadding - ((numColumns - 1) * gap)) / numColumns;

  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  // Filtrar citas de hoy y ordenarlas por hora
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  // 1. Filtrar citas de hoy y de la sucursal seleccionada
  const branchAppointments = appointments
    .filter(app => app.date === today && (app.branch === selectedBranch || (!app.branch && selectedBranch === 'Centro')))
    .sort((a, b) => a.time.localeCompare(b.time));

  // 2. Identificar barberos activos (que tienen citas hoy)
  const activeBarbers = [...new Set(branchAppointments.map(app => app.barberName))];

  // 3. Agrupar citas por barbero
  const barberQueues = activeBarbers.map(barber => {
      const apps = branchAppointments.filter(app => app.barberName === barber);
      // Asumimos que la primera en la lista ordenada es la "Actual" (o la más próxima)
      return {
          name: barber,
          current: apps[0] || null,
          next: apps[1] || null,
          remaining: apps.length - 2
      };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <Text style={styles.title}>TURNO ACTUAL</Text>
            <View style={styles.branchSwitch}>
                <TouchableOpacity onPress={() => setSelectedBranch('Centro')}>
                    <Text style={[styles.branchTab, selectedBranch === 'Centro' && styles.branchActive]}>CENTRO</Text>
                </TouchableOpacity>
                <Text style={{color: COLORS.textSecondary}}>|</Text>
                <TouchableOpacity onPress={() => setSelectedBranch('Lomas')}>
                    <Text style={[styles.branchTab, selectedBranch === 'Lomas' && styles.branchActive]}>LOMAS</Text>
                </TouchableOpacity>
            </View>
        </View>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>Cerrar</Text></TouchableOpacity>
      </View>

      {barberQueues.length > 0 ? (
          <FlatList
            data={barberQueues}
            keyExtractor={(item) => item.name}
            horizontal={!isMobile} // En PC mostrar columnas lado a lado
            numColumns={isMobile ? 1 : 0} // En móvil lista vertical
            contentContainerStyle={{ gap: 20, paddingBottom: 20, alignItems: isMobile ? 'stretch' : 'flex-start' }}
            renderItem={({ item }) => (
                <View style={[styles.barberColumn, !isMobile && { width: 350 }]}>
                    <View style={styles.barberHeader}>
                        <Text style={styles.barberNameTitle}>{item.name}</Text>
                    </View>

                    {/* Turno Actual */}
                    <View style={styles.currentCard}>
                        <Text style={styles.label}>AHORA ATENDIENDO:</Text>
                        {item.current ? (
                            <>
                                <Text style={styles.bigName}>{item.current.userName}</Text>
                                <Text style={styles.subInfo}>{item.current.serviceName}</Text>
                                <Text style={styles.timeTag}>{item.current.time}</Text>
                            </>
                        ) : (
                            <Text style={{color: COLORS.textSecondary, fontStyle: 'italic'}}>Disponible</Text>
                        )}
                    </View>

                    {/* Turno Próximo */}
                    <View style={styles.nextCard}>
                        <Text style={styles.labelSmall}>SIGUIENTE:</Text>
                        {item.next ? (
                            <View style={styles.nextRow}>
                                <View>
                                    <Text style={styles.nextName}>{item.next.userName}</Text>
                                    <Text style={styles.nextService}>{item.next.serviceName}</Text>
                                </View>
                                <Text style={styles.nextTime}>{item.next.time}</Text>
                            </View>
                        ) : (
                            <Text style={{color: COLORS.textSecondary, fontSize: 14}}>No hay más citas por hoy</Text>
                        )}
                    </View>
                    
                    {item.remaining > 0 && (
                        <Text style={{textAlign: 'center', marginTop: 10, color: COLORS.textSecondary}}>
                            + {item.remaining} citas más en espera
                        </Text>
                    )}
                </View>
            )}
          />
      ) : (
        <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay barberos activos en esta sucursal hoy</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: isMobile ? 10 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  branchSwitch: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 10,
  },
  branchTab: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  branchActive: {
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  title: {
    fontSize: isMobile ? 24 : 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  close: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New Styles for Barber Columns
  barberColumn: {
      backgroundColor: COLORS.surface,
      borderRadius: 15,
      padding: 15,
      marginRight: isMobile ? 0 : 20,
      marginBottom: isMobile ? 20 : 0,
      borderWidth: 1,
      borderColor: COLORS.border,
      elevation: 4,
  },
  barberHeader: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingBottom: 10,
      marginBottom: 15,
      alignItems: 'center'
  },
  barberNameTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.primary,
      textTransform: 'uppercase'
  },
  currentCard: {
      backgroundColor: COLORS.background,
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      marginBottom: 15,
      borderLeftWidth: 5,
      borderLeftColor: COLORS.success
  },
  label: {
      fontSize: 10,
      color: COLORS.textSecondary,
      marginBottom: 5,
      fontWeight: 'bold',
      letterSpacing: 1
  },
  bigName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 5
  },
  subInfo: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginBottom: 5
  },
  timeTag: {
      backgroundColor: COLORS.primary,
      color: COLORS.white,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 5,
      fontWeight: 'bold',
      fontSize: 12,
      overflow: 'hidden'
  },
  nextCard: {
      backgroundColor: COLORS.surfaceHighlight,
      borderRadius: 10,
      padding: 10,
  },
  labelSmall: {
      fontSize: 10,
      color: COLORS.textSecondary,
      marginBottom: 8,
      fontWeight: 'bold'
  },
  nextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  nextName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.text
  },
  nextService: {
      fontSize: 12,
      color: COLORS.textSecondary
  },
  nextTime: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.text
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  }
});
