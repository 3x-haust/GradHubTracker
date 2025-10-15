import { create } from 'zustand';
import { api, apiForm } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { GraduateRecord } from '@/lib/types';

type GraduatesState = {
  items: GraduateRecord[];
  total: number;
  loading: boolean;
  pageSize: number;
  currentPage: number;
  fetch: (params?: { page?: number; q?: string }) => Promise<void>;
  get: (id: string) => Promise<GraduateRecord>;
  create: (payload: Omit<GraduateRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<GraduateRecord>;
  update: (id: string, updates: Partial<GraduateRecord>) => Promise<GraduateRecord>;
  remove: (id: string) => Promise<void>;
  uploadPhoto: (id: string, file: File) => Promise<GraduateRecord>;
  deletePhoto: (id: string) => Promise<void>;
};

export const useGraduates = create<GraduatesState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,
  pageSize: 20,
  currentPage: 1,
  async fetch(params) {
    set({ loading: true });
    const page = params?.page ?? 1;
    const q = params?.q ? `&q=${encodeURIComponent(params.q)}` : '';
    const res = await api<{ items: GraduateRecord[]; total: number; page: number; pageSize: number }>(
      `/graduates?page=${page}${q}`,
    );
    set({ items: res.items, total: res.total, loading: false, pageSize: res.pageSize, currentPage: res.page });
  },
  async get(id) {
    return api<GraduateRecord>(`/graduates/${id}`);
  },
  async create(payload) {
    const actor = useAuth.getState().me?.sub;
    const created = await api<GraduateRecord>(`/graduates${actor ? `?actor=${encodeURIComponent(actor)}` : ''}` , {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    set({ items: [created, ...get().items] });
    return created;
  },
  async update(id, updates) {
    const actor = useAuth.getState().me?.sub;
    const updated = await api<GraduateRecord>(`/graduates/${id}${actor ? `?actor=${encodeURIComponent(actor)}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    set({ items: get().items.map((g) => (g.id === id ? updated : g)) });
    return updated;
  },
  async remove(id) {
    const actor = useAuth.getState().me?.sub;
    await api(`/graduates/${id}${actor ? `?actor=${encodeURIComponent(actor)}` : ''}`, { method: 'DELETE' });
    set({ items: get().items.filter((g) => g.id !== id) });
  },
  async uploadPhoto(id, file) {
    const fd = new FormData();
    fd.append('file', file);
    const actor = useAuth.getState().me?.sub;
    const updated = await apiForm<GraduateRecord>(`/graduates/${id}/photo${actor ? `?actor=${encodeURIComponent(actor)}` : ''}`, fd, 'POST');
    set({ items: get().items.map((g) => (g.id === id ? updated : g)) });
    return updated;
  },
  async deletePhoto(id) {
    const actor = useAuth.getState().me?.sub;
    await api(`/graduates/${id}/photo${actor ? `?actor=${encodeURIComponent(actor)}` : ''}`, { method: 'DELETE' });
    const g = await get().get(id);
    set({ items: get().items.map((x) => (x.id === id ? g : x)) });
  },
}));
