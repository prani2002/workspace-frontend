import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { AuthLevel } from './auth/RequireAuth';

export interface AppRoute {
  path: string;
  /** MUST id from SCOPE.md, or "base" (template) / "sample" (demo to delete). The guard fails on anything else. */
  scope: string;
  title: string;
  auth: AuthLevel;
  nav?: boolean;
  component: LazyExoticComponent<ComponentType>;
}

export const routes: AppRoute[] = [
  { path: '/login', scope: 'base', title: 'Sign in', auth: 'public', component: lazy(() => import('./pages/Login')) },
  { path: '/', scope: 'sample', title: 'Runs', auth: 'user', nav: true, component: lazy(() => import('./pages/Home')) },
  { path: '/console', scope: 'sample', title: 'Triage console', auth: 'user', nav: true, component: lazy(() => import('./pages/AgentConsole')) },
  { path: '/admin', scope: 'base', title: 'Admin', auth: 'admin', nav: true, component: lazy(() => import('./pages/Admin')) },
  // @fde:routes (new-feature.mjs inserts routes above this line; keep the catch-all last)
  { path: '*', scope: 'base', title: 'Not found', auth: 'public', component: lazy(() => import('./pages/NotFound')) }
];
