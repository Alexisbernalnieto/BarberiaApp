// src/services/payments.ts
import { functions } from '@/firebaseClient';
import { httpsCallable } from 'firebase/functions';

const PAYMENT_ENDPOINT = "https://us-central1-barberia-app-c4c2b.cloudfunctions.net/createPaymentIntentWeb";

interface PaymentIntentResponse {
    clientSecret: string;
}

/**
 * Crea un PaymentIntent en Stripe para el monto dado.
 * @param price — Precio en MXN (ej: 300 para $300 MXN)
 * @param serviceId — ID del servicio para verificación en servidor
 * @param idToken — Token de Firebase para autenticación
 * @returns {Promise<PaymentIntentResponse>} — El client secret del PaymentIntent
 */
export const createPaymentIntentWeb = async (
    price: number, 
    serviceId: string, 
    idToken: string
): Promise<PaymentIntentResponse> => {
    const res = await fetch(PAYMENT_ENDPOINT, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ amount: price, serviceId }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor: ${res.status}`);
    }

    const json = await res.json();

    if (!json.clientSecret) {
        throw new Error("No se recibió el clientSecret del servidor");
    }

    return json;
};

export interface PaymentMetadata {
    amount: number;
    currency: string;
    status: string;
    brand: string | null;
    last4: string | null;
    receipt_url: string | null;
}

/**
 * Llama a la Cloud Function para extraer metadatos de un pago validado.
 * @param paymentIntentId ID del PaymentIntent de Stripe
 */
export const getPaymentMetadata = async (paymentIntentId: string): Promise<PaymentMetadata> => {
    try {
        const getMetadata = httpsCallable(functions, 'getPaymentMetadata');
        const result = await getMetadata({ paymentIntentId });
        return result.data as PaymentMetadata;
    } catch (error: any) {
        console.error("Error from getPaymentMetadata frontend:", error);
        throw error;
    }
};

export interface FinancialMetrics {
    balance: {
        available: number;
        pending: number;
        currency: string;
    } | null;
    grossVolume: number;
    netVolume: number;
    transactionCount: number;
    currency: string;
}

/**
 * Llama a la Cloud Function para obtener las métricas financieras de Stripe.
 */
export const getFinancialMetrics = async (): Promise<FinancialMetrics> => {
    try {
        const getMetrics = httpsCallable(functions, 'getFinancialMetrics');
        const result = await getMetrics();
        return result.data as FinancialMetrics;
    } catch (error: any) {
        console.error("Error from getFinancialMetrics frontend:", error);
        throw error;
    }
};
