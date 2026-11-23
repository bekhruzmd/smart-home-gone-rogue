import { Lightbulb, Shield, Thermometer, House, Workflow, OctagonAlert, Info } from 'lucide-react';

const ICONS = {
  lighting: Lightbulb,
  security: Shield,
  climate: Thermometer,
  mode: House,
  automation: Workflow,
  emergency: OctagonAlert,
  system: Info,
};

function formatTime(iso) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ActivityList({ logs, compact = false, emptyText = 'No activity yet.' }) {
  if (!logs.length) return <p className="muted small empty">{emptyText}</p>;

  return (
    <ol className={`activity-list ${compact ? 'is-compact' : ''}`}>
      {logs.map((log) => {
        const Icon = ICONS[log.event_type] ?? Info;
        return (
          <li key={log.id} className={`activity-item type-${log.event_type}`}>
            <span className="activity-icon" aria-hidden="true">
              <Icon size={14} />
            </span>
            <div className="activity-body">
              <p>{log.description}</p>
              <p className="activity-meta">
                <time dateTime={log.created_at}>{formatTime(log.created_at)}</time>
                <span className="type-tag">{log.event_type}</span>
                {log.simulated && <span className="sim-tag">Simulated</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
