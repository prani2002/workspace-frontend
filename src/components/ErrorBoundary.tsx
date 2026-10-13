import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; resetKey?: string }
interface State { error: Error | null }

/** Catches render errors so one broken page never white-screens the app. Hook error reporting (Sentry etc.) in componentDidCatch. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="empty" role="alert">
        <h1>Something went wrong</h1>
        <p className="muted">This page hit an unexpected error. Your data is safe.</p>
        <div className="row">
          <button type="button" className="btn" onClick={() => this.setState({ error: null })}>Try again</button>
          <button type="button" className="btn btn-quiet" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </div>
    );
  }
}
