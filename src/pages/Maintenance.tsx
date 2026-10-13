import { useEffect } from 'react';
import { api } from '../api/endpoints';
import { maintenance } from '../api/maintenance';

export default function Maintenance() {
  useEffect(() => {
    const check = () => api.systemStatus().then((s) => { if (!s.maintenance) maintenance.set(false); }).catch(() => undefined);
    const id = setInterval(() => void check(), 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <main className="page narrow center" role="status">
      <h1>We'll be right back</h1>
      <p className="muted">The service is under scheduled maintenance. This page checks again automatically.</p>
      <button type="button" className="btn" onClick={() => window.location.reload()}>Check now</button>
    </main>
  );
}
