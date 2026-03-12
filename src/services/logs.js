// src/services/logs.js
import { db, auth } from '../firebaseClient';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

/**
 * Registra una acción en el historial (logs).
 * 
 * @param {string} action - Acción realizada (ej. 'Creó una cita', 'Eliminó un barbero')
 * @param {string} details - Detalles adicionales de la acción (ej. 'Cliente: Juan, Barbero: Pedro')
 * @param {string} userEmail - (Opcional) Si no se pasa, intenta obtenerlo de auth.currentUser
 * @param {number} userRole - Rol del usuario (0: Admin, 1: Cliente, 2: Recepción, etc)
 */
export const logActivity = async (action, details, userEmail, userRole) => {
  try {
    const currentUserEmail = userEmail || auth.currentUser?.email || 'Sistema';
    const logsRef = collection(db, 'logs');
    
    await addDoc(logsRef, {
      action,
      details,
      userEmail: currentUserEmail,
      userRole: userRole !== undefined ? userRole : -1,
      createdAt: serverTimestamp()
    });
    console.log(`[Log Activity] Guardado: ${action}`);
  } catch (error) {
    console.error(`[Error] Fallo al guardar logActivity (${action}):`, error);
  }
};

/**
 * Se suscribe a los logs más recientes.
 * 
 * @param {function} callback - Función a ejecutar cuando cambian los logs
 * @param {number} maxLogs - Límite de logs a traer (default 100)
 * @returns {function} Función para desuscribirse
 */
export const subscribeToLogs = (callback, maxLogs = 100) => {
  const q = query(
    collection(db, 'logs'),
    orderBy('createdAt', 'desc'),
    limit(maxLogs)
  );

  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    callback(logs);
  }, (error) => {
    console.error("Error al escuchar logs:", error);
    callback([]);
  });
};
