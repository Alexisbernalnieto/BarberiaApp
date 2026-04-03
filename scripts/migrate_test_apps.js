const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyADg6K4QdEm08oSTvlU05hrtFEo3vq0oZ8",
  authDomain: "barberia-app-c4c2b.firebaseapp.com",
  projectId: "barberia-app-c4c2b",
  storageBucket: "barberia-app-c4c2b.firebasestorage.app",
  messagingSenderId: "398150919752",
  appId: "1:398150919752:web:f78319899b12cbc7a09a7d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateAppointmentId(branchName, type = 'Online') {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const branchLower = (branchName || '').toLowerCase();
  const isCentro = branchLower.includes('centro') || branchLower.includes('matriz');
  const isLomas = branchLower.includes('loma');
  const isWalkIn = type === 'Walk-in';

  let prefix;
  if (isLomas) {
    prefix = isWalkIn ? 'LMW' : 'LM';
  } else if (isCentro) {
    prefix = isWalkIn ? 'CTW' : 'CT';
  } else {
    prefix = isWalkIn ? 'GNW' : 'GN';
  }

  return `${prefix}-${suffix}`;
}

async function migrate() {
  const appointmentsRef = collection(db, 'appointments');
  const querySnapshot = await getDocs(appointmentsRef);
  
  console.log(`Found ${querySnapshot.size} total appointments.`);
  
  const migrated = [];
  
  for (const docSnapshot of querySnapshot.docs) {
    const id = docSnapshot.id;
    if (id.startsWith('TEST_APP_')) {
      const data = docSnapshot.data();
      const newId = generateAppointmentId(data.branch, data.type);
      console.log(`Migrating ${id} to ${newId}...`);
      
      const newDocRef = doc(db, 'appointments', newId);
      await setDoc(newDocRef, data);
      await deleteDoc(doc(db, 'appointments', id));
      migrated.push({ oldId: id, newId });
      console.log(`Successfully migrated ${id} to ${newId}`);
    }
  }
  
  if (migrated.length === 0) {
    console.log("No appointments starting with TEST_APP_ found.");
  } else {
    console.log(`Successfully migrated ${migrated.length} appointments.`);
  }
  
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
