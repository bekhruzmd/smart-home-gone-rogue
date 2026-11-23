import { Workflow } from 'lucide-react';
import SystemCard from '../components/SystemCard.jsx';
import RuleList from '../components/RuleList.jsx';
import { EmergencyBanner } from '../components/AlertBanners.jsx';

export default function AutomationsPage({ state, logs, actions }) {
  const { home, rules } = state;
  const paused = home.emergency_active;
  const enabled = rules.filter((r) => r.enabled).length;
  const recentRuns = logs.filter((l) => l.event_type === 'automation' && l.description.includes('" ran:')).slice(0, 5);

  return (
    <>
      <EmergencyBanner home={home} />
      <div className="page-intro">
        <div>
          <h1>Automations</h1>
          <p className="muted">
            Simple, predictable WHEN → THEN rules. They run in order, only when their trigger happens, and never while the
            emergency override is active.
          </p>
        </div>
      </div>

      <div className="two-col">
        <SystemCard
          title="Rules"
          icon={Workflow}
          status={paused ? 'Paused by emergency override' : `${enabled} of ${rules.length} enabled`}
          tone={paused ? 'warn' : 'info'}
        >
          <RuleList rules={rules} paused={paused} onToggle={actions.toggleRule} />
        </SystemCard>

        <SystemCard title="Recent rule runs" icon={Workflow}>
          {recentRuns.length ? (
            <ul className="run-list">
              {recentRuns.map((l) => (
                <li key={l.id}>
                  <time dateTime={l.created_at}>{new Date(l.created_at).toLocaleTimeString()}</time>
                  <span>{l.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No rules have run yet. Try switching to Away Mode on the dashboard.</p>
          )}
        </SystemCard>
      </div>
    </>
  );
}
