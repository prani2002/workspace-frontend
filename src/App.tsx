import { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useMaintenance } from './api/maintenance';
import { RequireAuth } from './auth/RequireAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { PageSkeleton } from './components/Skeleton';
import Maintenance from './pages/Maintenance';
import { routes, type AppRoute } from './routes';

function RouteView({ route }: { route: AppRoute }) {
  useEffect(() => { document.title = `${route.title} · App`; }, [route.title]);
  return (
    <RequireAuth level={route.auth}>
      <route.component />
    </RequireAuth>
  );
}

export default function App() {
  const underMaintenance = useMaintenance();
  const { pathname } = useLocation();
  if (underMaintenance) return <Maintenance />;
  return (
    <Layout>
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {routes.map((r) => <Route key={r.path} path={r.path} element={<RouteView route={r} />} />)}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
