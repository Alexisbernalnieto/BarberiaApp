import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntentWeb } from '../../services/payments';
import { auth } from '../../firebaseClient';
import { CreditCard, ShieldCheck, Lock } from 'lucide-react';

interface BookingStepPaymentProps {
  styles: any;
  COLORS: any;
  selectedService: any;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

const BookingStepPayment: React.FC<BookingStepPaymentProps> = ({
  styles,
  COLORS,
  selectedService,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Debes estar autenticado para proceder al pago");

      const { clientSecret } = await createPaymentIntentWeb(selectedService.price, selectedService.id, token);
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("No se encontró el elemento de tarjeta");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        onPaymentSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      onPaymentError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={paymentStyles.container}>
      <View style={paymentStyles.headerContainer}>
        <View style={paymentStyles.iconCircle}>
            <ShieldCheck size={32} color="#D4AF37" />
        </View>
        <Text style={styles.stepHeader}>PAGO SEGURO</Text>
        <Text style={paymentStyles.subHeader}>Tu pasarela blindada de reserva</Text>
      </View>
      
      <View style={paymentStyles.summaryCard}>
        <View style={paymentStyles.glassOverlay} />
        <Text style={paymentStyles.summaryLabel}>TOTAL A PAGAR</Text>
        <View style={paymentStyles.divider} />
        <Text style={paymentStyles.summaryPrice}>${selectedService.price} <Text style={{fontSize: 16, color: 'var(--text-secondary)'}}>MXN</Text></Text>
        <Text style={paymentStyles.serviceTag}>{selectedService.name}</Text>
      </View>

      <View style={paymentStyles.cardWrapper}>
          <Text style={paymentStyles.inputLabel}>DETALLES DE TARJETA</Text>
          <View style={[paymentStyles.cardContainer, { borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)' }]}>
            <CardElement options={{
              style: {
                base: {
                  fontSize: '18px',
                  color: COLORS.mode === 'dark' ? '#FFFFFF' : '#000000',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  '::placeholder': {
                    color: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.4)' : '#6B7280',
                  },
                },
                invalid: {
                  color: '#FF4D4D',
                },
              },
            }} />
          </View>
      </View>

      {error ? (
        <View style={paymentStyles.errorContainer}>
            <Text style={paymentStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        style={[styles.actionBtn, styles.nextBtn, (loading || !stripe) && styles.disabledBtn]} 
        onPress={handleSubmit}
        disabled={loading || !stripe}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Lock size={18} color="#000" />
              <Text style={styles.nextBtnText}>PAGAR Y AGENDAR</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={paymentStyles.securityFooter}>
          <CreditCard size={14} color="var(--text-secondary)" />
          <Text style={paymentStyles.secureNote}>Procesado por Stripe • Encriptación SSL 256-bit</Text>
      </View>
    </View>
  );
};

const paymentStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  subHeader: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 4,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
        web: {
            backdropFilter: 'blur(10px)',
        }
    })
  },
  glassOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(212, 175, 55, 0.02)',
  },
  summaryLabel: {
    color: 'var(--text-secondary)',
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '800',
    marginBottom: 12,
  },
  divider: {
      height: 1,
      width: 40,
      backgroundColor: 'rgba(212, 175, 55, 0.3)',
      marginBottom: 12,
  },
  summaryPrice: {
    color: 'var(--gold)',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  serviceTag: {
      marginTop: 8,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      color: 'var(--gold)',
      fontSize: 13,
      fontWeight: '600',
  },
  cardWrapper: {
      gap: 12,
  },
  inputLabel: {
    color: 'var(--text-secondary)',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
        web: {
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
        }
    })
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  secureNote: {
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: '500',
  }
});

export default BookingStepPayment;
