import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import SystemCard from '../components/SystemCard.jsx';
import ActivityList from '../components/ActivityList.jsx';
import { fetchActivity } from '../services/activityService.js';
import { EVENT_TYPES } from '../lib/constants.js';

// Full, filterable history loaded straight from the activity_logs table.
export default function ActivityPage({ homeId, latestLogId }) {
  const [filter, setFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Re-query when the filter changes, when Refresh is clicked, or when a new event is logged.
  useEffect(() => {
    let cancelled = false; // ignore a slow response if the filter changed in the meantime
    setStatus('loading');
    fetchActivity(homeId, { eventType: filter })
      .then((rows) => {
        if (cancelled) return;
        setLogs(rows);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [homeId, filter, reloadKey, latestLogId]);

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Activity history</h1>
          <p className="muted">Every change, mode switch, automation run and simulated security event, newest first, read from the activity_logs table.</p>
        </div>
      </div>

      <SystemCard
        title={filter === 'all' ? 'All events' : `${EVENT_TYPES.find((t) => t.id === filter)?.label} events`}
        icon={History}
        status={status === 'ready' ? `${logs.length} shown` : undefined}
        aside={
          <button type="button" className="icon-btn" onClick={() => setReloadKey((k) => k + 1)} aria-label="Refresh activity">
            <RefreshCw size={16} />
          </button>
        }
      >
        <div className="chip-row filter-row" role="group" aria-label="Filter by event type">
          {[{ id: 'all', label: 'All' }, ...EVENT_TYPES].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${filter === t.id ? 'is-active' : ''}`}
              aria-pressed={filter === t.id}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {status === 'loading' && <p className="muted small">Loading activity…</p>}
        {status === 'error' && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {status === 'ready' && <ActivityList logs={logs} emptyText="No events of this type yet." />}
      </SystemCard>
    </>
  );
}
