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
