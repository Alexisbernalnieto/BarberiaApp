import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { useAuth } from './AuthContext';
import { Appointment, AppUser, Service, Branch } from '../types';

interface DataContextType {
  appointments: Appointment[];
  barbers: AppUser[];
  setBarbers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  services: Service[];
  branches: Branch[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<AppUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

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

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
        const s = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(s);
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
        const br = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
        setBranches(br);
    });

    return () => {
      unsubAppointments();
      unsubBarbers();
      unsubServices();
      unsubBranches();
    };
  }, [currentUser]);

  // Seeding logic for full functionality out of the box
  useEffect(() => {
    if (!currentUser) return;

    const seedData = async () => {
      const branchesSnap = await getDocs(collection(db, 'branches'));
      if (branchesSnap.empty) {
        console.log("Seeding initial branches...");
        const initialBranches = [
          { id: 'centro', name: 'Centro', address: 'Mariano Abasolo 59 B San Juan del Rio, Qro' },
          { id: 'lomas', name: 'Lomas', address: 'Av. Lomas de San Juan 1129 San Juan del Rio, Qro' }
        ];
        for (const b of initialBranches) {
          await setDoc(doc(db, 'branches', b.id), b);
        }
      }

      const servicesSnap = await getDocs(collection(db, 'services'));
      if (servicesSnap.empty) {
        console.log("Seeding initial services...");
        const initialServices = [
          { id: '1', name: 'Corte Fade/Lavado', price: 300, duration: 60, branch: 'Ambas' },
          { id: '2', name: 'Corte Fade', price: 229, duration: 45, branch: 'Ambas' },
          { id: '6', name: 'Arreglo de Barba', price: 180, duration: 30, branch: 'Ambas' }
        ];
        for (const s of initialServices) {
          await setDoc(doc(db, 'services', s.id), s);
        }
      }
    };

    seedData();
  }, [currentUser]);

  return (
    <DataContext.Provider value={{ appointments, barbers, setBarbers, services, branches }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
