import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type AgentRun } from '../api/endpoints';
import { userMessage } from '../api/errors';
import { Alert, Spinner } from '../components/States';

interface TriageView {
  status: 'ok' | 'needs_info' | 'out_of_scope';
  category?: string; severity?: string; summary: string; suggested_team?: string;
  next_steps: string[]; missing_info: string[]; evidence: { source: string; detail: string }[]; confidence: number; reason?: string;
}

const SAMPLES = [
  'Several remote employees cannot connect to the VPN since this morning.',
  'The orders API is returning 502 errors for all customers after the latest release.',
  'Something is not working, please help.'
];

function Result({ run }: { run: AgentRun }) {
  const r = run.result as unknown as TriageView | null;
  if (!r) return null;
  const title = r.status === 'out_of_scope' ? 'Not an IT issue' : r.status === 'needs_info' ? 'More information needed' : 'Triage result';
  return (
    <section className="card" aria-labelledby="result-title">
      <div className="row between">
        <h2 id="result-title">{title}</h2>
        {r.severity && <span className={`sev sev-${r.severity}`}>{r.severity}</span>}
      </div>
      <p>{r.summary}</p>
      {r.reason && <p className="muted">{r.reason}</p>}
      {(r.category || r.suggested_team) && (
        <dl className="facts">
          {r.category && <><dt>Category</dt><dd>{r.category.replace('_', ' ')}</dd></>}
          {r.suggested_team && <><dt>Route to</dt><dd>{r.suggested_team}</dd></>}
          <dt>Confidence</dt><dd>{Math.round(r.confidence * 100)}%</dd>
        </dl>
      )}
      {r.missing_info.length > 0 && <><h3>Questions to ask</h3><ul>{r.missing_info.map((q) => <li key={q}>{q}</li>)}</ul></>}
      {r.next_steps.length > 0 && <><h3>Next steps</h3><ol>{r.next_steps.map((s) => <li key={s}>{s}</li>)}</ol></>}
      {r.evidence.length > 0 && <><h3>Evidence</h3><ul className="plain">{r.evidence.map((e, i) => <li key={i}><code>{e.source}</code> {e.detail}</li>)}</ul></>}
      <p className="muted small">Answered in {(run.ms / 1000).toFixed(1)} s</p>
    </section>
  );
}

export default function AgentConsole() {
  const [input, setInput] = useState('');
  const queryClient = useQueryClient();
  // One key per user intent: retrying the same text reuses it, so the server never runs the agent twice.
  const keyRef = useRef<{ text: string; key: string } | null>(null);
  const keyFor = (text: string) => {
    if (keyRef.current?.text !== text) keyRef.current = { text, key: crypto.randomUUID() };
    return keyRef.current.key;
  };

  const run = useMutation({
    mutationFn: (text: string) => api.runAgent('triage', text, keyFor(text)),
    onSuccess: () => { keyRef.current = null; void queryClient.invalidateQueries({ queryKey: ['runs'] }); }
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim().length >= 5 && !run.isPending) run.mutate(input.trim());
  }

  return (
    <section>
      <h1>Triage console</h1>
      <p className="muted">Describe an IT issue. The agent classifies it, rates severity, and routes it to the right team.</p>
      <form onSubmit={onSubmit} className="stack">
        <label htmlFor="issue">Issue description</label>
        <textarea id="issue" rows={5} maxLength={4000} value={input} onChange={(e) => setInput(e.target.value)} placeholder="What is broken, who is affected, and since when?" />
        <div className="row">
          <button type="submit" className="btn" disabled={run.isPending || input.trim().length < 5}>{run.isPending ? <><Spinner /> Triaging…</> : 'Triage issue'}</button>
          {SAMPLES.map((s, i) => <button key={s} type="button" className="chip" onClick={() => setInput(s)}>Sample {i + 1}</button>)}
        </div>
      </form>
      <div aria-live="polite" className="stack">
        {run.isError && <Alert>{userMessage(run.error)}</Alert>}
        {run.isPending && <div className="card" role="status" aria-label="Agent is working"><span className="skeleton" style={{ width: '50%', height: 20 }} /><span className="skeleton" style={{ width: '90%', height: 14 }} /><span className="skeleton" style={{ width: '75%', height: 14 }} /></div>}
        {run.isSuccess && <Result run={run.data.run} />}
      </div>
    </section>
  );
}
