// src/services/payments.ts
const PAYMENT_ENDPOINT = "https://us-central1-barberia-app-c4c2b.cloudfunctions.net/createPaymentIntentWeb";

interface PaymentIntentResponse {
    clientSecret: string;
}

/**
 * Crea un PaymentIntent en Stripe para el monto dado.
 * @param price — Precio en MXN (ej: 300 para $300 MXN)
 * @returns {Promise<PaymentIntentResponse>} — El client secret del PaymentIntent
 */
export const createPaymentIntentWeb = async (price: number): Promise<PaymentIntentResponse> => {
    const res = await fetch(PAYMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price }), // Enviar precio en pesos, la Cloud Function convierte a centavos
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
