import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit, getDocs, setDoc, doc, Unsubscribe } from 'firebase/firestore';
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
    if (!currentUser) {
      setAppointments([]);
      setBarbers([]);
      setServices([]);
      setBranches([]);
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
        const b = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
        setBarbers(b);
      },
      () => { /* Ignore permission errors */ }
    );

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
      try {
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
            { id: '1', name: 'CORTE FADE/ LAVADO', price: 300, duration: 60, branch: 'Ambas' },
            { id: '2', name: 'CORTE FADE', price: 229, duration: 45, branch: 'Ambas' },
            { id: '3', name: 'CORTE CLASICO', price: 159, duration: 45, branch: 'Ambas' },
            { id: '4', name: 'CORTE A TIJERA', price: 229, duration: 60, branch: 'Ambas' },
            { id: '5', name: 'GRECAS', price: 50, duration: 20, branch: 'Ambas' },
            { id: '6', name: 'ARREGLO DE BARBA', price: 180, duration: 30, branch: 'Ambas' },
            { id: '7', name: 'DESVANECIDO DE BARBA', price: 210, duration: 45, branch: 'Ambas' },
            { id: '8', name: 'TOALLAS CALIENTES', price: 180, duration: 30, branch: 'Ambas' },
            { id: '9', name: 'EXFOLIACION FACIAL', price: 129, duration: 30, branch: 'Ambas' },
            { id: '10', name: 'MASCARILLA NEGRA', price: 129, duration: 30, branch: 'Ambas' },
            { id: '11', name: 'PERFILACION DE CEJAS', price: 30, duration: 15, branch: 'Ambas' },
            { id: '12', name: 'LAVADO', price: 80, duration: 20, branch: 'Ambas' },
            { id: '13', name: 'WAX FACIAL, OREJAS/ NARIZ', price: 0, duration: 20, branch: 'Ambas', status: 'Prox..' },
            { id: '14', name: 'COLORIMETRIA', price: 0, duration: 60, branch: 'Ambas', status: 'Prox..' },
            { id: '15', name: 'ONDULACION PERMANENTE', price: 0, duration: 90, branch: 'Ambas', status: 'Prox..' },
            { id: '16', name: 'ALACIADO PERMANENTE', price: 0, duration: 90, branch: 'Ambas', status: 'Prox..' }
          ];
          for (const s of initialServices) {
            await setDoc(doc(db, 'services', s.id), s);
          }
        }

        const barbersSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', [3, 'barber'])));
        if (barbersSnap.empty) {
          console.log("Seeding initial barbers...");
          const initialBarbers = [
            { uid: 'barber1', name: 'Alex Bernal', email: 'alex@barber.com', role: 'barber', branch: 'Centro', rating: 4.9 },
            { uid: 'barber2', name: 'Juan Perez', email: 'juan@barber.com', role: 'barber', branch: 'Lomas', rating: 4.8 },
            { uid: 'barber3', name: 'Carlos Ruiz', email: 'carlos@barber.com', role: 'barber', branch: 'Ambas', rating: 5.0 }
          ];
          for (const b of initialBarbers) {
            await setDoc(doc(db, 'users', b.uid), b);
          }
        }
      } catch (e) {
        console.error("Error seeding data:", e);
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
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
