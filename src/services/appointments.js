// src/services/appointments.js
import { db } from '../firebaseClient';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export const createAppointment = async ({
  userId,
  userName,
  branch,
  barberId,
  barberName,
  date,
  time,
  serviceId,
  serviceName,
  price,
  duration,
  type,
  paymentIntentId,
}) => {
  const payload = {
    userId,
    userName,
    branch,
    barberId,
    barberName,
    date,
    time,
    serviceId,
    serviceName,
    price,
    duration,
    type: type || 'Online',

    paid: true,
    paymentIntentId,
    status: 'confirmed',

    createdAt: Timestamp.now(),
  };

  return await addDoc(collection(db, 'appointments'), payload);
};

// TODO: Implementar cancelación de citas con reembolso Stripe
// Se necesita:
// 1. Una Cloud Function que llame a stripe.refunds.create({ payment_intent: paymentIntentId })
// 2. Un método cancelAppointment() aquí que actualice el status a 'cancelled' en Firestore
// 3. UI en UserDashboard/AdminDashboard para permitir cancelaciones

