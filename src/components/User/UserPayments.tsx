import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { CreditCard, Plus, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

import AddCardModal from './AddCardModal';

export default function UserPayments({ user, COLORS, isMobile }: any) {
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const functions = getFunctions();

  const fetchCards = async () => {
    try {
      setLoading(true);
      const listPMs = httpsCallable(functions, 'listPaymentMethods');
      const result: any = await listPMs();
      setSavedCards(result.data.paymentMethods || []);
    } catch (error: any) {
      console.error("Error fetching cards:", error);
      // Solo mostrar error si no es el primer mount silencioso o si falló catastróficamente
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDeleteCard = async (paymentMethodId: string) => {
    Alert.alert(
      "Eliminar Tarjeta",
      "¿Estás seguro de que deseas eliminar esta tarjeta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(paymentMethodId);
              const detachPM = httpsCallable(functions, 'detachPaymentMethod');
              await detachPM({ paymentMethodId });
              setSavedCards(prev => prev.filter(c => c.id !== paymentMethodId));
            } catch (error: any) {
              Alert.alert("Error", "No se pudo eliminar la tarjeta: " + error.message);
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Cargando tus tarjetas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
                <Text style={[styles.title, { color: COLORS.text }]}>Métodos de Pago</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Gestiona tus tarjetas guardadas para reservas rápidas</Text>
            </View>
            <TouchableOpacity onPress={fetchCards} style={styles.refreshBtn}>
                <RefreshCw size={20} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardsGrid}>
        {savedCards.length > 0 ? (
          savedCards.map(card => (
            <View key={card.id} style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={styles.cardTop}>
                  <CreditCard size={24} color={COLORS.primary} />
                  <View style={[styles.brandBadge, { backgroundColor: COLORS.primary + '15' }]}>
                    <Text style={[styles.brandText, { color: COLORS.primary }]}>{card.card.brand.toUpperCase()}</Text>
                  </View>
              </View>
              <View style={styles.cardInfo}>
                 <Text style={[styles.cardNumber, { color: COLORS.text }]}>•••• •••• •••• {card.card.last4}</Text>
                 <Text style={[styles.cardExp, { color: COLORS.textSecondary }]}>Expira: {card.card.exp_month}/{card.card.exp_year % 100}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => handleDeleteCard(card.id)}
                disabled={deletingId === card.id}
              >
                {deletingId === card.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Trash2 size={18} color="#EF4444" />
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: COLORS.surface }]}>
              <CreditCard size={48} color={COLORS.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>No tienes tarjetas guardadas.</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.addCardBtn, { borderColor: COLORS.primary, borderStyle: 'dashed' }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Plus size={24} color={COLORS.primary} />
          <Text style={[styles.addCardText, { color: COLORS.primary }]}>Añadir Nueva Tarjeta</Text>
        </TouchableOpacity>
      </View>

      <AddCardModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={fetchCards}
        COLORS={COLORS}
      />
      <View style={[styles.securityNote, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(0,0,0,0.03)' }]}>
        <ShieldCheck size={20} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.securityTitle, { color: COLORS.text }]}>Tus datos están protegidos</Text>
          <Text style={[styles.securityDesc, { color: COLORS.textSecondary }]}>No guardamos los números de tu tarjeta en nuestros servidores. Todo se procesa de forma segura a través de Stripe.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 32, paddingBottom: 40 },
  header: { gap: 8 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, opacity: 0.8 },
  cardsGrid: { gap: 16 },
  card: { padding: 24, borderRadius: 20, borderWidth: 1, gap: 20, position: 'relative' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  brandText: { fontSize: 11, fontWeight: '700' },
  cardInfo: { gap: 4 },
  cardNumber: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  cardExp: { fontSize: 14, fontWeight: '500' },
  deleteBtn: { position: 'absolute', bottom: 20, right: 20, padding: 8 },
  addCardBtn: { height: 120, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 12 },
  addCardText: { fontWeight: '700', fontSize: 15 },
  emptyState: { height: 160, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderStyle: 'dotted', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  securityNote: { flexDirection: 'row', padding: 20, borderRadius: 16, gap: 16, alignItems: 'center', marginTop: 8 },
  securityTitle: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  securityDesc: { fontSize: 12, lineHeight: 18 }
});
