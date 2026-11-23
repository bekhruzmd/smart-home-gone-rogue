import { useState } from 'react';
import { House } from 'lucide-react';
import { signIn, signUp } from '../services/authService.js';

export default function LoginPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        // useAuth notices the new session and App switches to the dashboard.
      } else {
        const needsConfirmation = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setInfo('Account created. Check your email to confirm it, then sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <div className="login-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <House size={18} />
          </span>
          <span>
            NOVA <b>HOME OS</b>
          </span>
        </div>
        <h1>Smart Home Gone Rogue 2.0</h1>
        <p className="muted">Sign in to take back control of your (simulated) smart home.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="field-info" role="status">
              {info}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="muted small center">
          {mode === 'signin' ? 'No account yet?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
        <p className="muted tiny center">University of South Florida, Web Systems final project. All devices simulated.</p>
      </div>
    </main>
  );
}
