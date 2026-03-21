
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Need to check if this exists or use default

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkBarbers() {
    console.log("Checking users collection...");
    const snapshot = await db.collection('users').get();
    console.log(`Total users found: ${snapshot.size}`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`User: ${doc.id}, Name: ${data.name}, Role: ${data.role}, Branch: ${data.branch}`);
    });

    const barberQuery = await db.collection('users').where('role', 'in', [3, 'barber']).get();
    console.log(`\nBarbers found by query: ${barberQuery.size}`);
    barberQuery.forEach(doc => {
        console.log(`Barber match: ${doc.id}, Name: ${doc.data().name}`);
    });
}

checkBarbers().catch(console.error);
