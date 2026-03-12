import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      setBarbers([]);
      return;
    }

    // Calcular fecha de hace 30 días para limitar carga inicial en Admin
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    let qAppointments;

    // Helper for role comparison (supports numeric and string roles)
    const r = currentUser.role;
    const isAdminOrRecep = r === 0 || r === 2 || r === 'admin' || r === 'reception';
    const isBarber = r === 3 || r === 'barber';

    // 🔥 Filtrado profesional según rol
    if (isAdminOrRecep) {
      // Admin y Recepción → Ver citas recientes (últimos 30 días + futuras)
      qAppointments = query(
        collection(db, 'appointments'),
        where('date', '>=', thirtyDaysAgoStr),
        orderBy('date', 'desc'),
        limit(500) // Límite de seguridad para evitar crashes en móviles
      );
    }
    else if (isBarber) {
      // Barbero → solo sus citas recientes
      qAppointments = query(
        collection(db, 'appointments'),
        where('barberId', '==', currentUser.uid || currentUser.email),
        where('date', '>=', thirtyDaysAgoStr),
        orderBy('date', 'desc')
      );
    }
    else {
      // Cliente → solo sus citas
      qAppointments = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.email)
      );
    }

    const unsubAppointments = onSnapshot(
      qAppointments,
      (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(apps);
      },
      (error) => {
        console.error("Error fetching appointments:", error);
      }
    );

    // 🔥 Cargar barberos — buscar por role numérico (3) o string ('barber')
    const qBarbers = query(collection(db, 'users'), where('role', 'in', [3, 'barber']));
    const unsubBarbers = onSnapshot(
      qBarbers,
      (snapshot) => {
        const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBarbers(b);
      },
      () => {
        // Si no tiene permisos, ignoramos
      }
    );

    return () => {
      unsubAppointments();
      unsubBarbers();
    };
  }, [currentUser]);

  return (
    <DataContext.Provider value={{ appointments, barbers, setBarbers }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
