import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { 
  ArrowLeft, 
  DollarSign, 
  Scissors, 
  Calendar, 
  MapPin, 
  User, 
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

export default function BarberDetailsView({
  styles,
  selectedBarber,
  setViewMode,
  DAYS,
  DEFAULT_SCHEDULE,
  handleDelete,
  setEditingBarber,
  COLORS,
}) {
  const schedule = selectedBarber.schedule || DEFAULT_SCHEDULE;
  const history = selectedBarber.history || [];
  
  // Calculate some stats just in case they aren't in selectedBarber
  const totalEarnings = selectedBarber.totalEarnings || history.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalServices = selectedBarber.totalServices || history.length;

  const renderHistoryItem = ({ item }) => {
    let StatusIcon = CheckCircle2;
    let statusColor = COLORS.success;
    let statusLabel = 'Completado';

    if (item.status === 'cancelled') {
      StatusIcon = XCircle;
      statusColor = '#FF5252'; // Vibrant Red
      statusLabel = 'Cancelado';
    } else if (item.status === 'no_show') {
      StatusIcon = AlertCircle;
      statusColor = '#FFA000'; // Amber
      statusLabel = 'No Asistió';
    } else {
      // Default / Completed
      StatusIcon = CheckCircle2;
      statusColor = '#FFA000'; // Match No Asistió color as requested for visibility
      statusLabel = 'Completado';
    }

    return (
      <View style={styles.historyCard}>
        <View style={[styles.historyIcon, { backgroundColor: `${statusColor}15` }]}>
          <StatusIcon size={20} color={statusColor} />
        </View>
        <View style={styles.historyInfo}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyServiceName}>{item.serviceName}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 10, opacity: 0.6 }}>ID: {(item.id || 'N/A').toUpperCase().substring(0, 8)}</Text>
            </View>
            <View style={[styles.historyStatusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.historyStatusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.historyFooter}>
            <Text style={styles.historyTime}>
              {formatFullDate(item.date).split(',')[0]} • {formatTime12h(item.time)}
            </Text>
            <Text style={styles.historyPriceText}>+${item.price}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.detailsHeader, { justifyContent: 'space-between' }]}>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={[styles.infoIconContainer, { marginRight: 10, width: 32, height: 32 }]}>
            <ArrowLeft size={18} color={COLORS.primary} />
          </View>
          <Text style={[styles.backText, { color: COLORS.textSecondary }]}>Volver</Text>
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.deleteButton, { height: 36, justifyContent: 'center' }]}
            onPress={() => handleDelete(selectedBarber.id)}
          >
            <Text style={styles.deleteButtonText}>ELIMINAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, { height: 36, justifyContent: 'center' }]}
            onPress={() => {
              setEditingBarber({ ...selectedBarber });
              setViewMode('form');
            }}
          >
            <Text style={styles.editButtonText}>EDITAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.detailsTitle, { marginTop: 10, marginBottom: 20 }]}>{selectedBarber.name}</Text>

      {/* Metrics Grid */}
      <View style={styles.metricGrid}>
        <View style={[styles.metricCard, { borderColor: `${COLORS.success}30` }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: `${COLORS.primary}10`, marginBottom: 10 }]}>
            <DollarSign size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.metricValue, { color: COLORS.primary }]}>${totalEarnings}</Text>
          <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Ingresos Totales</Text>
        </View>
        
        <View style={[styles.metricCard, { borderColor: `${COLORS.primary}30` }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: `${COLORS.primary}10`, marginBottom: 10 }]}>
            <Scissors size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.metricValue, { color: COLORS.primary }]}>{totalServices}</Text>
          <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Servicios</Text>
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.premiumCard}>
        <Text style={[styles.infoLabel, { marginBottom: 15 }]}>Información del Perfil</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Briefcase size={18} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{selectedBarber.role || 'Barbero'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <MapPin size={18} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Sucursal</Text>
            <Text style={styles.infoValue}>{selectedBarber.branch || 'Centro'}</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { marginBottom: 0 }]}>
          <View style={styles.infoIconContainer}>
            <Clock size={18} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Última Actividad</Text>
            <Text style={styles.infoValue}>{selectedBarber.lastActive || 'Sin registros'}</Text>
          </View>
        </View>
      </View>

      {/* Schedule Section */}
      <Text style={styles.sectionTitle}>Horario de Trabajo</Text>
      <View style={styles.compactSchedule}>
        {DAYS.map((day, index) => {
          const daySchedule = schedule[index];
          const isActive = daySchedule?.active;
          return (
            <View key={index} style={[styles.dayPill, isActive && styles.dayPillActive]}>
              <Text style={[styles.dayPillText, isActive && { color: COLORS.primary }]}>{day.substring(0, 3).toUpperCase()}</Text>
              <Text style={styles.dayPillTime}>
                {isActive ? `${daySchedule.start} - ${daySchedule.end}` : 'Descanso'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Services Section */}
      <Text style={styles.sectionTitle}>Servicios Habilitados</Text>
      <View style={[styles.servicesGrid, { marginBottom: 30 }]}>
        {(selectedBarber.services || []).map((service, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{service}</Text>
          </View>
        ))}
        {(!selectedBarber.services || selectedBarber.services.length === 0) && (
          <Text style={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>No hay servicios asignados</Text>
        )}
      </View>

      {/* History Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Historial de Citas</Text>
        <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12 }}>{history.length} TOTAL</Text>
      </View>
      
      {history.length > 0 ? (
        history.slice().reverse().map((item, index) => (
          <View key={index}>
            {renderHistoryItem({ item })}
          </View>
        ))
      ) : (
        <View style={[styles.premiumCard, { alignItems: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.01)' }]}>
          <Calendar size={48} color={COLORS.textSecondary} style={{ opacity: 0.2, marginBottom: 16 }} />
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>No hay citas registradas en el historial.</Text>
        </View>
      )}
      
      {/* Spacer for bottom */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
