import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { userMessage } from '../api/errors';
import { Alert, Spinner } from '../components/States';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={from} replace />;

  const emailError = touched && !EMAIL_RE.test(email) ? 'Enter a valid email address.' : '';
  const passwordError = touched && password.length === 0 ? 'Enter your password.' : '';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email) || !password) return;
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="narrow">
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} noValidate className="stack">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'email-err' : undefined} />
          {emailError && <span id="email-err" className="field-error">{emailError}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'pw-err' : undefined} />
          {passwordError && <span id="pw-err" className="field-error">{passwordError}</span>}
        </div>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className="btn" disabled={busy}>{busy ? <><Spinner /> Signing in…</> : 'Sign in'}</button>
      </form>
    </section>
  );
}
