import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  Alert 
} from 'react-native';
import { X, Lock, CreditCard } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Web Imports (Only if on web)
let CardElement: any;
let useStripe: any;
let useElements: any;

if (Platform.OS === 'web') {
  const stripeJs = require('@stripe/react-stripe-js');
  CardElement = stripeJs.CardElement;
  useStripe = stripeJs.useStripe;
  useElements = stripeJs.useElements;
}

export default function AddCardModal({ visible, onClose, onSuccess, COLORS }: any) {
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();
  
  // Stripe hooks (Web)
  const stripe = Platform.OS === 'web' ? useStripe() : null;
  const elements = Platform.OS === 'web' ? useElements() : null;

  const handleAddCard = async () => {
    try {
      setLoading(true);

      // 1. Create SetupIntent on Backend
      const createSI = httpsCallable(functions, 'createSetupIntent');
      const siResult: any = await createSI();
      const clientSecret = siResult.data.clientSecret;

      if (Platform.OS === 'web') {
        if (!stripe || !elements) return;

        const cardElement = elements.getElement(CardElement);
        const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (setupIntent.status === 'succeeded') {
          onSuccess();
          onClose();
        }
      } else {
        // Native (stripe-react-native)
        // Here we would call confirmSetup from @stripe/stripe-react-native
        // For now, we Alert that it's web-only or implement the placeholder
        Alert.alert("Native Support", "Esta función está siendo optimizada para dispositivos móviles.");
      }
    } catch (error: any) {
      console.error("Add card error:", error);
      Alert.alert("Error", error.message || "No se pudo guardar la tarjeta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: COLORS.text }]}>Añadir Tarjeta</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: COLORS.textSecondary }]}>DATOS DE LA TARJETA</Text>
            <View style={[styles.stripeContainer, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212, 175, 55, 0.1)' }]}>
              {Platform.OS === 'web' ? (
                <CardElement 
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: COLORS.text,
                        '::placeholder': { color: COLORS.disabled },
                        backgroundColor: 'transparent',
                      },
                      invalid: { color: COLORS.error },
                    },
                  }}
                />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CreditCard size={20} color={COLORS.textSecondary} />
                  <Text style={{ color: COLORS.textSecondary }}>Formulario Nativo de Stripe</Text>
                </View>
              )}
            </View>

            <View style={styles.securityInfo}>
              <Lock size={14} color={COLORS.textSecondary} />
              <Text style={[styles.securityText, { color: COLORS.textSecondary }]}>
                Encriptación de nivel bancario. Tus datos nunca tocan nuestros servidores.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: COLORS.primary }]} 
            onPress={handleAddCard}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>GUARDAR TARJETA SEGURA</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 450, borderRadius: 24, borderWidth: 1, padding: 24, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  form: { gap: 16 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  stripeContainer: { padding: 16, borderRadius: 12, borderWidth: 1, height: 56, justifyContent: 'center' },
  securityInfo: { flexDirection: 'row', gap: 8, alignItems: 'center', opacity: 0.7 },
  securityText: { fontSize: 12, flex: 1 },
  submitBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#000', fontWeight: '900', fontSize: 14 }
});
