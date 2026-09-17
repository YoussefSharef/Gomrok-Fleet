const TOKEN_KEY = 'gomrok-token';

// In dev, Vite proxies /api to the local server (see vite.config.ts). In
// production the client and API are typically deployed separately (e.g.
// client on Vercel, server on Render/Railway/Fly), so VITE_API_URL must
// point at the deployed API's base URL, e.g. https://your-api.onrender.com/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (body && body.error) || res.statusText);
  }
  return body as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};
