import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { routes } from '../routes';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const links = routes.filter((r) => r.nav && (r.auth === 'user' || (r.auth === 'admin' && user?.role === 'admin')));
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <nav aria-label="Main" className="nav">
          <strong className="brand">App</strong>
          {user && links.map((r) => <NavLink key={r.path} to={r.path} end={r.path === '/'}>{r.title}</NavLink>)}
        </nav>
        {user && (
          <div className="row">
            <span className="muted small">{user.email}</span>
            <button type="button" className="btn btn-quiet" onClick={() => void logout()}>Sign out</button>
          </div>
        )}
      </header>
      <main id="main" className="page">{children}</main>
    </>
  );
}
