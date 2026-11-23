import { House, Volume2, VolumeX, LogOut, LoaderCircle, Check } from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'automations', label: 'Automations' },
  { id: 'activity', label: 'Activity' },
];

export default function AppHeader({ page, onNavigate, saving, sound, onToggleSound, email, onSignOut }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <House size={18} />
        </span>
        <span>
          NOVA <b>HOME OS</b>
        </span>
      </div>

      <nav aria-label="Main">
        <ul className="nav-list">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#/${item.id}`}
                className={page === item.id ? 'is-active' : ''}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="header-tools">
        <span className={`save-state ${saving ? 'is-saving' : ''}`} role="status" aria-live="polite">
          {saving ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
          {saving ? 'Saving…' : 'Saved'}
        </span>
        <button type="button" className="icon-btn" onClick={onToggleSound} aria-pressed={sound} aria-label="Alarm sound">
          {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <span className="user-email" title={email}>
          {email}
        </span>
        <button type="button" className="icon-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
