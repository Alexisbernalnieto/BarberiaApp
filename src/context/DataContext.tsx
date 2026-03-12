import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { useAuth } from './AuthContext';
import { Appointment, AppUser } from '../types';

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
    if (!currentUser) return;

    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        setAppointments(apps);
    });

    const unsubBarbers = onSnapshot(query(collection(db, 'users'), where('role', 'in', [3, 'barber'])), (snapshot) => {
        const b = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
        setBarbers(b);
    });

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
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
