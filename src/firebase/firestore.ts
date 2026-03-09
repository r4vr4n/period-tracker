import type { CycleEntry } from '../types/cycle';

const STORAGE_KEY = 'flo_cycle_data';

function getAll(): CycleEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CycleEntry[];
  } catch {
    return [];
  }
}

function saveAll(entries: CycleEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveCycleEntry(
  userId: string,
  entry: Omit<CycleEntry, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const entries = getAll();
  const id = generateId();
  entries.unshift({
    id,
    userId,
    startDate: entry.startDate,
    endDate: entry.endDate ?? null,
    createdAt: Date.now(),
  });
  saveAll(entries);
  return id;
}

export async function updateCycleEntry(
  _userId: string,
  entryId: string,
  data: Partial<Pick<CycleEntry, 'startDate' | 'endDate'>>
): Promise<void> {
  const entries = getAll();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...data };
    saveAll(entries);
  }
}

export async function getCycleHistory(_userId: string): Promise<CycleEntry[]> {
  return getAll().sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteCycleEntry(
  _userId: string,
  entryId: string
): Promise<void> {
  const entries = getAll().filter((e) => e.id !== entryId);
  saveAll(entries);
}
