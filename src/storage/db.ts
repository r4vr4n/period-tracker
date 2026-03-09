import type { CycleEntry } from '../types/cycle';

const DB_NAME = 'flo_cycle_db';
const DB_VERSION = 1;
const STORE_NAME = 'cycles';

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
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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

/* ---- Import / Export ---- */

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
