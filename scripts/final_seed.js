
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Try to find service account or use default
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let config = {};

if (fs.existsSync(serviceAccountPath)) {
    config = { credential: admin.credential.cert(require(serviceAccountPath)) };
} else {
    // Rely on GOOGLE_APPLICATION_CREDENTIALS or CLI login
    console.log("No serviceAccountKey.json found, relying on environment/CLI...");
}

if (!admin.apps.length) {
    admin.initializeApp(config);
}

const db = admin.firestore();

const services = [
  { name: 'CORTE FADE/ LAVADO', price: 300, duration: 60, branch: 'Ambas' },
  { name: 'CORTE FADE', price: 229, duration: 45, branch: 'Ambas' },
  { name: 'CORTE CLASICO', price: 159, duration: 45, branch: 'Ambas' },
  { name: 'CORTE A TIJERA', price: 229, duration: 60, branch: 'Ambas' },
  { name: 'GRECAS', price: 50, duration: 20, branch: 'Ambas' },
  { name: 'ARREGLO DE BARBA', price: 180, duration: 30, branch: 'Ambas' },
  { name: 'DESVANECIDO DE BARBA', price: 210, duration: 45, branch: 'Ambas' },
  { name: 'TOALLAS CALIENTES', price: 180, duration: 30, branch: 'Ambas' },
  { name: 'EXFOLIACION FACIAL', price: 129, duration: 30, branch: 'Ambas' },
  { name: 'MASCARILLA NEGRA', price: 129, duration: 30, branch: 'Ambas' },
  { name: 'PERFILACION DE CEJAS', price: 30, duration: 15, branch: 'Ambas' },
  { name: 'LAVADO', price: 80, duration: 20, branch: 'Ambas' },
  { name: 'WAX FACIAL, OREJAS/ NARIZ', price: 0, duration: 20, branch: 'Ambas', status: 'Prox..' },
  { name: 'COLORMETRIA', price: 0, duration: 60, branch: 'Ambas', status: 'Prox' },
  { name: 'ONDULACION PERMANENTE', price: 0, duration: 90, branch: 'Ambas', status: 'Prox..' },
  { name: 'ALACIADO PERMANENTE', price: 0, duration: 90, branch: 'Ambas', status: 'Prox..' }
];

const barbers = [
  { name: 'Alex Bernal', email: 'alex@barber.com', role: 'barber', branch: 'Centro', rating: 4.9, bio: 'Maestro del Fade' },
  { name: 'Juan Perez', email: 'juan@barber.com', role: 'barber', branch: 'Lomas', rating: 4.8, bio: 'Especialista en Barba' },
  { name: 'Carlos Ruiz', email: 'carlos@barber.com', role: 'barber', branch: 'Ambas', rating: 5.0, bio: 'Cortes Clásicos' }
];

async function seed() {
    console.log("Starting seed...");
    
    // Clear old services slowly
    const servicesSnap = await db.collection('services').get();
    for (const doc of servicesSnap.docs) {
        await doc.ref.delete();
    }
    console.log("Cleared old services.");

    for (let i = 0; i < services.length; i++) {
        await db.collection('services').add(services[i]);
    }
    console.log(`Inserted ${services.length} services.`);

    // Seed barbers in 'barbers' collection too just in case
    const barbersSnap = await db.collection('barbers').get();
    for (const doc of barbersSnap.docs) {
        await doc.ref.delete();
    }
    for (let i = 0; i < barbers.length; i++) {
        await db.collection('barbers').doc(`barber${i+1}`).set(barbers[i]);
    }
    console.log(`Inserted ${barbers.length} barbers into 'barbers' collection.`);
    
    // Also ensure they are in 'users' collection with role
    for (let i = 0; i < barbers.length; i++) {
        await db.collection('users').doc(`barber${i+1}`).set({
            ...barbers[i],
            role: 3,
            uid: `barber${i+1}`
        });
    }
    console.log(`Inserted ${barbers.length} barbers into 'users' collection.`);
    
    // Ensure at least one branch exists
    await db.collection('branches').doc('centro').set({ name: 'Centro', address: 'Mariano Abasolo 59 B' });
    await db.collection('branches').doc('lomas').set({ name: 'Lomas', address: 'Av. Lomas de San Juan 1129' });
    console.log("Branches seeded.");
}

seed().then(() => {
    console.log("Seed completed successfully!");
    process.exit(0);
}).catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
