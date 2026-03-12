import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { useAuth } from './AuthContext';
import { Appointment, User as AppUser } from '../types';

interface DataContextType {
  appointments: Appointment[];
  barbers: AppUser[];
  setBarbers: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      setBarbers([]);
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Role check helper
    const r = currentUser.role;
    const isAdminOrRecep = r === 0 || r === 2 || r === 'admin' || r === 'reception';
    const isBarber = r === 3 || r === 'barber';

    let qAppointments;

    if (isAdminOrRecep) {
      qAppointments = query(
        collection(db, 'appointments'),
        where('date', '>=', thirtyDaysAgoStr),
        orderBy('date', 'desc'),
        limit(500)
      );
    } else if (isBarber) {
      qAppointments = query(
        collection(db, 'appointments'),
        where('barberId', '==', currentUser.uid || currentUser.email),
        where('date', '>=', thirtyDaysAgoStr),
        orderBy('date', 'desc')
      );
    } else {
      qAppointments = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.email)
      );
    }

    const unsubAppointments = onSnapshot(
      qAppointments,
      (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        setAppointments(apps);
      },
      (error) => {
        console.error("Error fetching appointments:", error);
      }
    );

    const qBarbers = query(collection(db, 'users'), where('role', 'in', [3, 'barber']));
    const unsubBarbers = onSnapshot(
      qBarbers,
      (snapshot) => {
        const b = snapshot.docs.map(doc => {
          const data = doc.data();
          return { uid: doc.id, ...data } as AppUser;
        });
        setBarbers(b);
      },
      () => {
        // Ignore permission errors
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

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
