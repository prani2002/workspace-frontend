import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost, onSessionExpired } from '../src/api/client';
import { ApiError, userMessage } from '../src/api/errors';
import { maintenance } from '../src/api/maintenance';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  maintenance.set(false);
  document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});
afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends cookies and attaches the CSRF header on unsafe methods only', async () => {
    document.cookie = 'csrf_token=abc123; path=/';
    fetchMock.mockImplementation(async () => json({ ok: true }));
    await apiPost('/api/v1/x', { a: 1 });
    await apiGet('/api/v1/x');
    const [, post] = fetchMock.mock.calls[0]!;
    const [, get] = fetchMock.mock.calls[1]!;
    expect(post.credentials).toBe('include');
    expect(post.headers['x-csrf-token']).toBe('abc123');
    expect(get.headers['x-csrf-token']).toBeUndefined();
  });

  it('refreshes once on 401 and retries the original request', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: 'unauthorized', message: 'x' } }, 401))
      .mockResolvedValueOnce(json({ user: {} }))
      .mockResolvedValueOnce(json({ items: [1] }));
    expect(await apiGet('/api/v1/agents/runs')).toEqual({ items: [1] });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/v1/agents/runs', '/api/v1/auth/refresh', '/api/v1/agents/runs']);
  });

  it('shares a single refresh between concurrent 401s', async () => {
    let refreshes = 0;
    let first = true;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/v1/auth/refresh') { refreshes += 1; return json({ user: {} }); }
      if (first || url.endsWith('/b') && refreshes === 0) { first = false; return json({}, 401); }
      return json({ ok: true });
    });
    const results = await Promise.allSettled([apiGet('/api/v1/a'), apiGet('/api/v1/b')]);
    expect(refreshes).toBe(1);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
  });

  it('signals session expiry when refresh fails', async () => {
    const expired = vi.fn();
    const off = onSessionExpired(expired);
    fetchMock.mockImplementation(async (url: string) => (url === '/api/v1/auth/refresh' ? json({}, 401) : json({ error: { code: 'unauthorized', message: 'Authentication required' } }, 401)));
    await expect(apiGet('/api/v1/agents/runs')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalled();
    off();
  });

  it('flags maintenance mode on a 503 maintenance response', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'maintenance', message: 'down' } }, 503));
    await expect(apiGet('/api/v1/agents/runs')).rejects.toMatchObject({ code: 'maintenance' });
    expect(maintenance.get()).toBe(true);
  });

  it('maps network failures to a readable error with no raw details', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = (await apiGet('/api/v1/x').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('network_error');
    expect(userMessage(err)).toMatch(/can't reach the server/i);
  });

  it('surfaces the request id on server errors', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'internal_error', message: 'x', requestId: 'req-abc' } }, 500));
    const err = await apiGet('/api/v1/x').catch((e: unknown) => e);
    expect(userMessage(err)).toContain('req-abc');
  });
});
