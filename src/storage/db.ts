import type { CycleEntry } from '../types/cycle';

const DB_NAME = 'flo_cycle_db';
const DB_VERSION = 2;
const STORE_NAME = 'cycles';
const PROFILE_STORE = 'profile';

export interface UserProfile {
  name: string;
  syncId: string;
  createdAt: number;
}

export interface SyncPayload {
  profile: UserProfile;
  history: CycleEntry[];
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('startDate', 'startDate', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  let res = '';
  for (let i = 0; i < 5; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/* ---- User Profile ---- */

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROFILE_STORE, 'readonly');
    const req = tx.objectStore(PROFILE_STORE).get('user');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROFILE_STORE, 'readwrite');
    tx.objectStore(PROFILE_STORE).put({ ...profile, id: 'user' });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---- Cycle Entries ---- */

export async function saveCycleEntry(
  entry: Omit<CycleEntry, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const db = await openDB();
  const id = generateId();
  const record: CycleEntry = {
    id,
    userId: 'local',
    startDate: entry.startDate,
    endDate: entry.endDate ?? null,
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCompletePeriod(startDate: string, endDate: string): Promise<string> {
  const db = await openDB();
  const id = generateId();
  const record: CycleEntry = {
    id,
    userId: 'local',
    startDate,
    endDate,
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateCycleEntry(
  entryId: string,
  data: Partial<Pick<CycleEntry, 'startDate' | 'endDate'>>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(entryId);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, ...data });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCycleHistory(): Promise<CycleEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const entries = (req.result as CycleEntry[]).sort(
        (a, b) => b.createdAt - a.createdAt
      );
      resolve(entries);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCycleEntry(entryId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(entryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---- P2P Sync Helpers ---- */

export async function prepareSyncPayload(): Promise<SyncPayload> {
  const profile = await getUserProfile();
  if (!profile) throw new Error('No profile to sync');
  const history = await getCycleHistory();
  return {
    profile,
    history,
    timestamp: Date.now(),
  };
}

export async function applySyncPayload(payload: SyncPayload): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, PROFILE_STORE], 'readwrite');

    // Save profile
    tx.objectStore(PROFILE_STORE).put({ ...payload.profile, id: 'user' });

    // Save history
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const entry of payload.history) {
      store.put(entry);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---- Export / Import ---- */

export async function exportData(): Promise<string> {
  const entries = await getCycleHistory();
  return JSON.stringify(entries, null, 2);
}

export async function importData(json: string): Promise<number> {
  const entries = JSON.parse(json) as CycleEntry[];
  if (!Array.isArray(entries)) throw new Error('Invalid format: expected an array');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      if (!entry.id || !entry.startDate) continue;
      store.put(entry);
    }
    tx.oncomplete = () => resolve(entries.length);
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
