import type { ReactNode } from 'react';
import { userMessage } from '../api/errors';

export const Alert = ({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) => (
  <p className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</p>
);

export const Spinner = () => <span className="spinner" role="status" aria-label="Working" />;

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="empty">
      <Alert>{userMessage(error)}</Alert>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}
