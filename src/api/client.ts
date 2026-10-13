import { ApiError } from './errors';
import { maintenance } from './maintenance';

const BASE = ((import.meta.env['VITE_API_BASE'] as string | undefined) ?? '').replace(/\/+$/, '');
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_TIMEOUT_MS = 20_000;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Do not try a silent token refresh on 401 (auth calls set this). */
  skipRefresh?: boolean;
}

const sessionListeners = new Set<() => void>();
/** Fires when a session cannot be refreshed; AuthProvider listens and sends the user to /login. */
export const onSessionExpired = (fn: () => void) => {
  sessionListeners.add(fn);
  return () => sessionListeners.delete(fn);
};

function readCookie(name: string): string | undefined {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

async function send(method: string, path: string, o: RequestOptions): Promise<Response> {
  const qs = o.query ? Object.entries(o.query).filter(([, v]) => v !== undefined).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&') : '';
  const url = `${BASE}${path}${qs ? `?${qs}` : ''}`;
  const headers: Record<string, string> = { Accept: 'application/json', ...(o.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...o.headers };
  if (UNSAFE.has(method)) {
    const csrf = readCookie('csrf_token');
    if (csrf) headers['x-csrf-token'] = csrf;
  }
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, o.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  o.signal?.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    return await fetch(url, { method, headers, credentials: 'include', signal: controller.signal, ...(o.body !== undefined ? { body: JSON.stringify(o.body) } : {}) });
  } catch (err) {
    if (timedOut) throw new ApiError(0, 'timeout', 'The request timed out');
    if (o.signal?.aborted) throw err; // caller cancelled (e.g. React Query); not an error to show
    throw new ApiError(0, 'network_error', 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

let refreshing: Promise<boolean> | null = null;
function refreshOnce(): Promise<boolean> {
  refreshing ??= send('POST', '/api/v1/auth/refresh', { skipRefresh: true })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function request<T>(method: string, path: string, o: RequestOptions = {}): Promise<T> {
  let res = await send(method, path, o);
  if (res.status === 401 && !o.skipRefresh && !path.startsWith('/api/v1/auth/')) {
    if (await refreshOnce()) res = await send(method, path, o);
    else sessionListeners.forEach((fn) => fn());
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = undefined; }
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; requestId?: string; details?: unknown } } | undefined)?.error;
    const err = new ApiError(res.status, e?.code ?? 'http_error', e?.message ?? `Request failed (${res.status})`, e?.requestId ?? res.headers.get('x-request-id') ?? undefined, e?.details);
    if (res.status === 503 && err.code === 'maintenance') maintenance.set(true);
    throw err;
  }
  return data as T;
}

export const apiGet = <T>(path: string, o?: RequestOptions) => request<T>('GET', path, o);
export const apiPost = <T>(path: string, body?: unknown, o?: RequestOptions) => request<T>('POST', path, { ...o, body });
export const apiPut = <T>(path: string, body?: unknown, o?: RequestOptions) => request<T>('PUT', path, { ...o, body });
