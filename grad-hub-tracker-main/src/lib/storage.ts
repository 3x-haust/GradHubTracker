import { GraduateRecord } from "./types";

const KEY = "grad-hub-tracker:graduates";

function readAll(): GraduateRecord[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as GraduateRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(list: GraduateRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export const GraduateStore = {
  list(): GraduateRecord[] {
    return readAll();
  },
  add(record: GraduateRecord) {
    const list = readAll();
    list.unshift(record);
    writeAll(list);
  },
  update(id: string, updates: Partial<GraduateRecord>) {
    const list = readAll();
    const idx = list.findIndex((g) => g.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      writeAll(list);
    }
  },
  remove(id: string) {
    const list = readAll().filter((g) => g.id !== id);
    writeAll(list);
  },
  clear() {
    writeAll([]);
  },
};
