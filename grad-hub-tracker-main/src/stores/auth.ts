import { create } from 'zustand';
import { api } from '@/lib/api';

export type Role = 'admin' | 'teacher';
export type Me = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  approved: boolean;
};

type AuthState = {
  token: string | null;
  me: Me | null;
  validated: boolean; 
  setToken: (t: string | null) => void;
  loginWithGoogleIdToken: (id_token: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('gh:token'),
  me: ((): Me | null => {
    try {
      const raw = localStorage.getItem('gh:me');
      return raw ? (JSON.parse(raw) as Me) : null;
    } catch {
      return null;
    }
  })(),
  validated: false,
  setToken: (t) => {
    if (t) localStorage.setItem('gh:token', t);
    else localStorage.removeItem('gh:token');
    set({ token: t });
  },
  async loginWithGoogleIdToken(id_token: string) {
    const res = await api<{ token: string; user: { id: string; name: string; email: string; role: Role; approved: boolean } }>(
      '/auth/google',
      { method: 'POST', body: JSON.stringify({ id_token }) },
    );
    get().setToken(res.token);
    const me: Me = { sub: res.user.id, email: res.user.email, name: res.user.name, role: res.user.role, approved: res.user.approved };
    localStorage.setItem('gh:me', JSON.stringify(me));
    set({ me, validated: true });
  },
  async fetchMe() {
    try {
      const me = await api<Me>('/auth/me');
      localStorage.setItem('gh:me', JSON.stringify(me));
      set({ me, validated: true });
    } catch (e: unknown) {
      const err = e as { statusCode?: number } | undefined;
      if (err?.statusCode === 401) {
        localStorage.removeItem('gh:me');
        set({ me: null, validated: true });
        return;
      }
      throw err ?? e;
    }
  },
  logout() {
    set({ token: null, me: null, validated: false });
    localStorage.removeItem('gh:token');
    localStorage.removeItem('gh:me');
  },
}));
