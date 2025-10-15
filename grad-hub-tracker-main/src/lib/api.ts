declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
export const API_BASE = (import.meta as ImportMeta).env.VITE_API_BASE || 'http://localhost:3000';

export type ApiError = {
  statusCode: number;
  message: string;
  errors?: { field: string; message: string }[];
};

function getToken() {
  return localStorage.getItem('gh:token') || '';
}

// Optional: you can add more sophisticated retry/backoff here if needed
function makeKey(path: string, method?: string) {
  return `${(method || 'GET').toUpperCase()} ${path}`;
}

function withTimeout(ms: number) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, clear: () => clearTimeout(id) };
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = typeof init.body !== 'undefined';
  const headers: HeadersInit = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers || {}),
  };
  const token = getToken();
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  const t = withTimeout(15000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers, signal: t.signal });
  } finally {
    t.clear();
  }
  if (!res.ok) {
    console.log(res);
    let err: ApiError = { statusCode: res.status, message: res.statusText };
    try {
      err = (await res.json()) as ApiError;
    } catch (e) {
      // ignore json parse errors
    }
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export function apiForm<T>(path: string, form: FormData, method: 'POST' | 'PATCH' = 'POST') {
  const token = getToken();
  const t = withTimeout(15000);
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    signal: t.signal,
  }).then(async (res) => {
    t.clear();
    if (!res.ok) {
      let err: ApiError = { statusCode: res.status, message: res.statusText };
      try {
        err = (await res.json()) as ApiError;
      } catch (e) {
        // ignore json parse errors
      }
      throw err;
    }
    return (await res.json()) as T;
  });
}

export function assetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}
