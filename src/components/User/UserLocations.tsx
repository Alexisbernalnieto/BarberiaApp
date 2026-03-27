import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { MapPin, Navigation, Phone, ExternalLink, Info } from 'lucide-react';

export default function UserLocations({ COLORS }: any) {
  const locations = [
    {
      id: 'centro',
      name: 'El Coronel - Centro',
      address: 'Mariano Abasolo 59 B, Centro, San Juan del Río, Qro.',
      phone: '+52 427 123 4567',
      coords: '20.3889,-99.9961',
      color: '#D4AF37'
    },
    {
      id: 'lomas',
      name: 'El Coronel - Lomas',
      address: 'Av. Lomas de San Juan 1129, Lomas de San Juan, San Juan del Río, Qro.',
      phone: '+52 427 987 6543',
      coords: '20.3754,-99.9823',
      color: '#8B5CF6'
    }
  ];

  const handleOpenMap = (address: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
      default: `https://www.google.com/maps/search/?api=1&query=${address}`
    });
    Linking.openURL(url);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Nuestras Ubicaciones</Text>
        <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Encuentra tu sucursal más cercana</Text>
      </View>

      <View style={styles.grid}>
        {locations.map((loc) => (
          <View key={loc.id} style={[styles.card, { backgroundColor: COLORS.surface, borderColor: loc.color + '20' }]}>
            {/* Map Placeholder */}
            <View style={[styles.mapPlaceholder, { backgroundColor: COLORS.mode === 'dark' ? '#111' : '#EEE' }]}>
                <View style={styles.mapDecoration}>
                   {/* Abstract city grid lines */}
                   <View style={[styles.gridLine, { top: '30%', width: '100%', backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                   <View style={[styles.gridLine, { top: '60%', width: '100%', backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                   <View style={[styles.gridLine, { left: '40%', height: '100%', backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                   <View style={[styles.gridLine, { left: '70%', height: '100%', backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                   
                   <View style={[styles.pinWrapper, { shadowColor: loc.color }]}>
                      <MapPin size={32} color={loc.color} fill={loc.color + '30'} />
                      <View style={[styles.pinShadow, { backgroundColor: loc.color }]} />
                   </View>
                </View>
                <TouchableOpacity 
                    style={styles.expandBtn}
                    onPress={() => handleOpenMap(loc.address)}
                >
                    <ExternalLink size={16} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardInfo}>
              <Text style={[styles.branchName, { color: COLORS.text }]}>{loc.name}</Text>
              
              <View style={styles.addressRow}>
                 <MapPin size={16} color={loc.color} style={{ marginTop: 2 }} />
                 <Text style={[styles.addressText, { color: COLORS.textSecondary }]}>{loc.address}</Text>
              </View>

              <View style={styles.actionRow}>
                 <TouchableOpacity 
                    style={[styles.primaryAction, { backgroundColor: loc.color }]}
                    onPress={() => handleOpenMap(loc.address)}
                 >
                    <Navigation size={18} color="#000" />
                    <Text style={styles.primaryActionText}>CÓMO LLEGAR</Text>
                 </TouchableOpacity>

                 <TouchableOpacity style={[styles.secondaryAction, { borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Phone size={18} color={COLORS.textSecondary} />
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.footerInfo, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
          <Info size={16} color={COLORS.primary} />
          <Text style={[styles.footerText, { color: COLORS.textSecondary }]}>
              Atendemos de acuerdo al orden de llegada o previa cita. ¡Te esperamos!
          </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 32, gap: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.8 },
  grid: { gap: 24 },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  mapPlaceholder: {
    height: 160,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  mapDecoration: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridLine: { position: 'absolute', height: 1 },
  pinWrapper: {
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  pinShadow: { 
    width: 8, 
    height: 3, 
    borderRadius: 4, 
    opacity: 0.4, 
    marginTop: -2 
  },
  expandBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardInfo: { padding: 24, gap: 16 },
  branchName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  addressRow: { flexDirection: 'row', gap: 10, paddingRight: 20 },
  addressText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  primaryAction: { 
    flex: 1, 
    height: 52, 
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  primaryActionText: { color: '#000', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  secondaryAction: { 
    width: 52, 
    height: 52, 
    borderRadius: 14, 
    borderWidth: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  footerInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 40, 
    padding: 20, 
    borderRadius: 20,
    marginBottom: 40
  },
  footerText: { fontSize: 12, flex: 1, lineHeight: 18, fontStyle: 'italic' }
});
