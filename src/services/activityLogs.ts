import { db } from '../firebaseClient';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { ActivityLog } from '../types';

const LOGS_COLLECTION = 'activity_logs';

export const logActivity = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, LOGS_COLLECTION), {
      ...log,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export const getActivityLogs = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityLog[];
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};
