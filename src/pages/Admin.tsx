import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { userMessage } from '../api/errors';
import { Alert } from '../components/States';
import { ErrorState } from '../components/States';
import { ListSkeleton } from '../components/Skeleton';

export default function Admin() {
  const queryClient = useQueryClient();
  const metrics = useQuery({ queryKey: ['admin-metrics'], queryFn: api.adminMetrics, refetchInterval: 10_000 });
  const audit = useQuery({ queryKey: ['admin-audit'], queryFn: () => api.adminAudit(30) });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => api.setMaintenance(enabled),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
  });

  const m = metrics.data;
  const maxBucket = Math.max(1, ...(m?.requests.latencyBuckets.map((b) => b.count) ?? [1]));

  return (
    <section className="stack">
      <h1>Admin</h1>
      {metrics.isPending && <ListSkeleton rows={2} />}
      {metrics.isError && <ErrorState error={metrics.error} onRetry={() => void metrics.refetch()} />}
      {m && (
        <>
          <div className="grid">
            <div className="card"><span className="muted small">Requests</span><strong className="big">{m.requests.total}</strong></div>
            <div className="card"><span className="muted small">5xx error rate</span><strong className="big">{(m.requests.errorRate * 100).toFixed(1)}%</strong></div>
            <div className="card"><span className="muted small">Avg latency</span><strong className="big">{m.requests.avgMs} ms</strong></div>
            <div className="card"><span className="muted small">Agent avg</span><strong className="big">{m.agents.avgMs} ms</strong></div>
          </div>
          <div className="card">
            <h2>Latency</h2>
            {m.requests.latencyBuckets.map((b) => (
              <div className="bar-row" key={b.leMs}>
                <span className="small">{b.leMs === -1 ? '> 5 s' : `≤ ${b.leMs} ms`}</span>
                <span className="bar" style={{ width: `${(b.count / maxBucket) * 100}%` }} role="img" aria-label={`${b.count} requests`} />
                <span className="small">{b.count}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Agent runs and jobs</h2>
            <ul className="plain">
              {Object.entries(m.agents.runs).map(([k, v]) => <li key={k}><code>{k}</code> {v}</li>)}
              {Object.entries(m.jobs).map(([k, v]) => <li key={k}><code>job:{k}</code> {v.ok ? 'ok' : 'failed'} · {new Date(v.lastRunAt).toLocaleString()} {v.info ?? ''}</li>)}
              {Object.keys(m.agents.runs).length + Object.keys(m.jobs).length === 0 && <li className="muted">Nothing recorded yet.</li>}
            </ul>
          </div>
          <div className="card">
            <h2>Maintenance mode</h2>
            <p className="muted">When on, everything except sign-in, admin and health checks returns a maintenance page.</p>
            {toggle.isError && <Alert>{userMessage(toggle.error)}</Alert>}
            <button type="button" className="btn" disabled={toggle.isPending}
              onClick={() => { if (window.confirm(m.maintenance ? 'Turn maintenance mode off?' : 'Turn maintenance mode on? Users will see a maintenance page.')) toggle.mutate(!m.maintenance); }}>
              {m.maintenance ? 'Turn off' : 'Turn on'} (currently {m.maintenance ? 'on' : 'off'})
            </button>
          </div>
        </>
      )}
      <div className="card">
        <h2>Audit log</h2>
        {audit.isPending && <ListSkeleton rows={2} />}
        {audit.isError && <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />}
        {audit.isSuccess && (
          <div className="scroll-x">
            <table>
              <thead><tr><th>When</th><th>Action</th><th>User</th><th>Target</th></tr></thead>
              <tbody>
                {audit.data.items.map((a) => (
                  <tr key={a.id}><td>{new Date(a.at).toLocaleString()}</td><td>{a.action}</td><td>{a.userId ?? '-'}</td><td>{a.target ?? '-'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
