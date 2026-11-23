import { useState } from 'react';
import { isSupabaseConfigured } from './lib/supabaseClient.js';
import { useAuth } from './hooks/useAuth.js';
import { useSmartHome } from './hooks/useSmartHome.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useAlarmSound } from './hooks/useAlarmSound.js';
import { signOut } from './services/authService.js';
import AppHeader from './components/AppHeader.jsx';
import Toasts from './components/Toasts.jsx';
import ScreenMessage from './components/ScreenMessage.jsx';
import DashboardSkeleton from './components/DashboardSkeleton.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AutomationsPage from './pages/AutomationsPage.jsx';
import ActivityPage from './pages/ActivityPage.jsx';

// Top-level gate: configuration -> authentication -> data -> pages.
export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <ScreenMessage title="Supabase is not configured">
        <p>
          Copy <code>.env.example</code> to <code>.env</code>, add your project URL and anon key, then restart{' '}
          <code>npm run dev</code>. See <code>presentation/SETUP.md</code>.
        </p>
      </ScreenMessage>
    );
  }
  return <AuthGate />;
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <ScreenMessage title="Connecting…" loading />;
  if (!user) return <LoginPage />;
  // key={user.id}: signing in as someone else starts with completely fresh state.
  return <SmartHomeApp key={user.id} user={user} />;
}

function SmartHomeApp({ user }) {
  const { items, notify, dismiss } = useNotifications();
  const { state, logs, status, loadError, saving, homeId, actions } = useSmartHome(user.id, notify);
  const { page, navigate } = useHashRoute();
  const [sound, setSound] = useState(false);

  useAlarmSound(sound, Boolean(state?.home.alarm_triggered || state?.home.emergency_active));

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      notify({ type: 'error', message: err.message });
    }
  }

  if (status === 'loading' && !state) return <DashboardSkeleton />;
  if (status === 'error') {
    return (
      <ScreenMessage
        title="Couldn’t load your home"
        action={
          <div className="button-pair">
            <button type="button" className="btn btn-primary" onClick={actions.reload}>
              Try again
            </button>
            <button type="button" className="btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        }
      >
        <p className="field-error">{loadError}</p>
        <p className="muted small">Check your internet connection and that the SQL migrations have been applied.</p>
      </ScreenMessage>
    );
  }

  return (
    <div className={`app ${state.home.emergency_active ? 'is-emergency' : ''}`}>
      <AppHeader
        page={page}
        onNavigate={navigate}
        saving={saving}
        sound={sound}
        onToggleSound={() => setSound((s) => !s)}
        email={user.email}
        onSignOut={handleSignOut}
      />
      <main className="shell">
        {page === 'dashboard' && <DashboardPage state={state} logs={logs} actions={actions} onNavigate={navigate} />}
        {page === 'automations' && <AutomationsPage state={state} logs={logs} actions={actions} />}
        {page === 'activity' && <ActivityPage homeId={homeId} latestLogId={logs[0]?.id} />}
      </main>
      <footer className="shell footer">
        <span>SMART HOME GONE ROGUE 2.0, Web Systems final project</span>
        <span>Simulation only: no real devices, sensors or emergency services are connected</span>
      </footer>
      <Toasts items={items} onDismiss={dismiss} />
    </div>
  );
}
