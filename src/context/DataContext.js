import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
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

    let qAppointments;

    // 🔥 Filtrado profesional según rol
    if (currentUser.role === 'admin' || currentUser.role === 'reception') {
      // Admin y Recepción → pueden ver TODAS las citas
      qAppointments = query(collection(db, 'appointments'));
    }
    else if (currentUser.role === 'barber') {
      // Barbero → solo sus citas
      qAppointments = query(
        collection(db, 'appointments'),
        where('barberId', '==', currentUser.id || currentUser.email)
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
    <DataContext.Provider value={{ appointments, barbers }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
