import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { EmptyState, ErrorState } from '../components/States';
import { ListSkeleton } from '../components/Skeleton';

export default function Home() {
  const runs = useQuery({ queryKey: ['runs'], queryFn: () => api.listAgentRuns(20) });
  return (
    <section>
      <h1>Recent runs</h1>
      {runs.isPending && <ListSkeleton />}
      {runs.isError && <ErrorState error={runs.error} onRetry={() => void runs.refetch()} />}
      {runs.isSuccess && runs.data.items.length === 0 && (
        <EmptyState title="No runs yet" hint="Describe an IT issue and the agent will triage it." action={<Link className="btn" to="/console">Open the console</Link>} />
      )}
      {runs.isSuccess && runs.data.items.length > 0 && (
        <ul className="stack list">
          {runs.data.items.map((r) => {
            const severity = (r.result as { severity?: string } | null)?.severity;
            return (
              <li key={r.id} className="card">
                <div className="row between">
                  <strong>{(r.result as { summary?: string } | null)?.summary ?? (r.status === 'error' ? 'Run failed' : 'No summary')}</strong>
                  {severity && <span className={`sev sev-${severity}`}>{severity}</span>}
                </div>
                <p className="muted small">{r.input.slice(0, 140)}{r.input.length > 140 ? '…' : ''}</p>
                <p className="muted small">{new Date(r.createdAt).toLocaleString()} · {(r.ms / 1000).toFixed(1)} s{r.errorCode ? ` · ${r.errorCode}` : ''}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
