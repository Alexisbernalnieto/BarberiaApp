// scripts/migrate_data.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Since I don't have a service account file, I'll use the environment variables if possible,
// but for this environment, I'll just provide the data and a script that uses the 'firebase' package
// instead of 'firebase-admin' if i can run it with the web config.

const BRANCHES = [
  { id: 'centro', name: 'Centro', address: 'Mariano Abasolo 59 B San Juan del Rio, Qro' },
  { id: 'lomas', name: 'Lomas', address: 'Av. Lomas de San Juan 1129 San Juan del Rio, Qro' }
];

const SERVICES = [
  { id: '1', name: 'Corte Fade/Lavado', price: 300, duration: 60, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '2', name: 'Corte Fade', price: 229, duration: 45, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '3', name: 'Corte Clásico', price: 229, duration: 45, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '4', name: 'Corte a Tijera', price: 229, duration: 45, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '5', name: 'Grecas', price: 50, duration: 15, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '6', name: 'Arreglo de Barba', price: 180, duration: 30, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '7', name: 'Desvanecido de Barba', price: 210, duration: 35, bufferTime: 5, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '8', name: 'Toallas Calientes', price: 180, duration: 20, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '9', name: 'Exfoliación Facial', price: 129, duration: 20, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '10', name: 'Mascarilla Negra', price: 129, duration: 20, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '11', name: 'Perfilación de Cejas', price: 30, duration: 10, bufferTime: 2, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '12', name: 'Wax Facial (Orejas/Nariz)', price: 80, duration: 15, bufferTime: 2, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '13', name: 'Lavado', price: 80, duration: 15, bufferTime: 3, assignedTo: 'Todos', branch: 'Ambas' },
  { id: '14', name: 'Colormetría', price: 500, duration: 90, bufferTime: 10, assignedTo: 'Ana', branch: 'Ambas' },
];

async function migrate() {
    console.log("Migration script started. Please run this in an environment with Firebase access.");
    // This is a placeholder since I cannot run it directly without credentials.
    // I will instead implement an "auto-migration" ifFirestoreEmpty check in the App.
}

migrate();
