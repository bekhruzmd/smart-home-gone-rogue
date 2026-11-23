import RollingNumber from './RollingNumber.jsx';
import { RotateCcw } from 'lucide-react';
import SafetySign from './SafetySign.jsx';
import { getIssues } from '../lib/homeStatus.js';

// The posted status placard, the page's lead element.
// It is the original assignment's "N active issues" counter, calculated from the
// database-backed state. While anything is wrong it is a yellow hazard sign listing
// each issue; when everything is fixed it flips to a green "safe condition" sign.
export default function StatusOverview({ state, confirmReset, onReset, onCancelReset }) {
  const issues = getIssues(state);
  const ok = issues.length === 0;

  return (
    // key: the placard re-mounts when it changes state, which plays the flip animation once.
    <section key={ok ? 'safe' : 'hazard'} className={`placard ${ok ? 'is-safe' : 'is-hazard'}`} aria-live="polite">
      <div className="placard-sign">
        <SafetySign type={ok ? 'safe' : 'warning'} size={92} />
      </div>
      <div className="placard-body">
        <h1>{ok ? 'Safe condition: your home is under control' : 'Your home has gone rogue'}</h1>
        {ok ? (
          <p className="placard-sub">Doors secure, climate comfortable, alarm quiet. Every device is simulated.</p>
        ) : (
          <ul className="issue-list" aria-label={`${issues.length} active ${issues.length === 1 ? 'issue' : 'issues'}`}>
            {issues.map((i) => (
              <li key={i.id} className={`issue-${i.severity}`}>
                {i.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="placard-side">
        <p className="issue-count">
          <b><RollingNumber value={issues.length} /></b> active {issues.length === 1 ? 'issue' : 'issues'}
        </p>
        <div className="reset-box">
          <button type="button" className={`btn ${confirmReset ? 'btn-danger' : 'btn-sign'}`} onClick={onReset}>
            <RotateCcw size={15} aria-hidden="true" />
            {confirmReset ? 'Click again to reset' : 'Restart demo'}
          </button>
          {confirmReset && (
            <button type="button" className="link-btn small" onClick={onCancelReset}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
