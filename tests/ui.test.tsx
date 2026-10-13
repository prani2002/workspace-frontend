import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { RequireAuth } from '../src/auth/RequireAuth';
import { AuthProvider } from '../src/auth/AuthContext';
import Login from '../src/pages/Login';
import { ApiError } from '../src/api/errors';
import { api } from '../src/api/endpoints';
import { routes } from '../src/routes';

vi.mock('../src/api/endpoints', async (orig) => {
  const mod = await orig<typeof import('../src/api/endpoints')>();
  return { ...mod, api: { ...mod.api, me: vi.fn(), refresh: vi.fn(), login: vi.fn(), logout: vi.fn() } };
});
const mocked = api as unknown as Record<'me' | 'refresh' | 'login' | 'logout', ReturnType<typeof vi.fn>>;

const wrap = (ui: React.ReactNode, initial = '/') => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={[initial]}><AuthProvider>{ui}</AuthProvider></MemoryRouter>
  </QueryClientProvider>
);
const unauth = new ApiError(401, 'unauthorized', 'Authentication required');

beforeEach(() => { (['me', 'refresh', 'login', 'logout'] as const).forEach((k) => mocked[k].mockReset()); });

describe('ErrorBoundary', () => {
  it('shows a recovery UI instead of crashing and can recover', async () => {
    let explode = true;
    const Bomb = () => { if (explode) throw new Error('boom'); return <p>fine</p>; };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    explode = false;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});

describe('Login', () => {
  beforeEach(() => { mocked.me.mockRejectedValue(unauth); mocked.refresh.mockRejectedValue(unauth); });

  it('validates fields inline before calling the API', async () => {
    render(wrap(<Login />));
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mocked.login).not.toHaveBeenCalled();
  });

  it('shows a clear message for wrong credentials and a loading state while submitting', async () => {
    mocked.login.mockRejectedValue(new ApiError(401, 'invalid_credentials', 'Invalid email or password'));
    render(wrap(<Login />));
    await userEvent.type(await screen.findByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(mocked.login).toHaveBeenCalledWith('a@b.co', 'secret');
  });
});

describe('RequireAuth', () => {
  const tree = (level: 'user' | 'admin') => (
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/secret" element={<RequireAuth level={level}><p>secret content</p></RequireAuth>} />
    </Routes>
  );

  it('redirects anonymous users to /login', async () => {
    mocked.me.mockRejectedValue(unauth); mocked.refresh.mockRejectedValue(unauth);
    render(wrap(tree('user'), '/secret'));
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('shows the secret page to signed-in users and a no-access page for admin-only routes', async () => {
    mocked.me.mockResolvedValue({ user: { id: '1', email: 'm@x.co', role: 'member' } });
    const { unmount } = render(wrap(tree('user'), '/secret'));
    expect(await screen.findByText('secret content')).toBeInTheDocument();
    unmount();
    render(wrap(tree('admin'), '/secret'));
    await waitFor(() => expect(screen.getByText('No access')).toBeInTheDocument());
  });
});

describe('route table', () => {
  it('has unique paths, scope tags, and the catch-all last', () => {
    const paths = routes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(routes.every((r) => r.scope && r.title)).toBe(true);
    expect(paths.at(-1)).toBe('*');
  });
});
