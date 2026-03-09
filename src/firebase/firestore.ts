import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { CycleEntry } from '../types/cycle';

function cyclesRef(userId: string) {
  return collection(db, 'users', userId, 'cycles');
}

export async function saveCycleEntry(
  userId: string,
  entry: Omit<CycleEntry, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(cyclesRef(userId), {
    ...entry,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCycleEntry(
  userId: string,
  entryId: string,
  data: Partial<Pick<CycleEntry, 'startDate' | 'endDate'>>
): Promise<void> {
  const docRefInstance = doc(db, 'users', userId, 'cycles', entryId);
  await updateDoc(docRefInstance, data);
}

export async function getCycleHistory(userId: string): Promise<CycleEntry[]> {
  const q = query(cyclesRef(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    userId: d.data().userId,
    startDate: d.data().startDate,
    endDate: d.data().endDate ?? null,
    createdAt: d.data().createdAt?.toMillis?.() ?? Date.now(),
  }));
}

export async function deleteCycleEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const docRefInstance = doc(db, 'users', userId, 'cycles', entryId);
  await deleteDoc(docRefInstance);
}
