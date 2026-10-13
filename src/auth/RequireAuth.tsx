import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { PageSkeleton } from '../components/Skeleton';
import Forbidden from '../pages/Forbidden';

export type AuthLevel = 'public' | 'user' | 'admin';

export function RequireAuth({ level, children }: { level: AuthLevel; children: ReactNode }) {
  const { user, status } = useAuth();
  const location = useLocation();
  if (level === 'public') return <>{children}</>;
  if (status === 'loading') return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (level === 'admin' && user.role !== 'admin') return <Forbidden />;
  return <>{children}</>;
}
