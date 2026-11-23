import { useState } from 'react';
import { KeyRound, OctagonAlert } from 'lucide-react';
import { EMERGENCY_REASONS, RESTORE_PHRASE } from '../lib/constants.js';
import Select from './Select.jsx';

// The original assignment's emergency override, reworked:
//   before: a phrase + code that reset four booleans in memory.
//   now:    a real, persisted emergency state that changes devices, pauses automation,
//           is logged, and needs an explicit confirmation phrase to leave.
export default function EmergencyOverride({ home, actions }) {
  const [reason, setReason] = useState(EMERGENCY_REASONS[0]);
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');

  async function activate() {
    if (!confirming) {
      setConfirming(true); // two-step: first click asks, second click activates
      return;
    }
    setConfirming(false);
    await actions.activateEmergency(reason);
  }

  async function restore(e) {
    e.preventDefault();
    if (phrase.trim().toLowerCase() !== RESTORE_PHRASE.toLowerCase()) {
      setError(`Type "${RESTORE_PHRASE}" exactly to confirm.`);
      return;
    }
    setError('');
    const ok = await actions.restoreNormal(phrase);
    if (ok) setPhrase('');
  }

  return (
    <section id="emergency-override" className={`override ${home.emergency_active ? 'is-active' : ''}`}>
      <div className="override-copy">
        {home.emergency_active ? <OctagonAlert size={24} aria-hidden="true" /> : <KeyRound size={24} aria-hidden="true" />}
        <h2>Emergency override</h2>
        <p>
          Unlocks every door, turns every light to 100%, switches the HVAC off and pauses all automation rules
          until you restore normal operation.
        </p>
      </div>

      {home.emergency_active ? (
        <form className="override-controls" onSubmit={restore} noValidate>
          <label htmlFor="restore-phrase">
            Type <strong>{RESTORE_PHRASE}</strong> to restore normal operation
          </label>
          <div className="input-row">
            <input
              id="restore-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={RESTORE_PHRASE}
              autoComplete="off"
              aria-invalid={Boolean(error)}
            />
            <button type="submit" className="btn btn-primary">
              Restore normal operation
            </button>
          </div>
          <p className={error ? 'field-error' : 'muted small'} role={error ? 'alert' : undefined}>
            {error || 'Restoring switches the house back to Home Mode and resumes automations.'}
          </p>
        </form>
      ) : (
        <div className="override-controls">
          <label htmlFor="emergency-reason">Reason</label>
          <div className="input-row">
            <Select
              id="emergency-reason"
              value={reason}
              onChange={(e) => setReason(typeof e === 'string' ? e : e.target.value)}
              options={EMERGENCY_REASONS}
              aria-label="Reason"
            />
            <button type="button" className="btn btn-danger" onClick={activate}>
              {confirming ? 'Confirm: activate override' : 'Activate emergency override'}
            </button>
          </div>
          <p className="muted small">
            {confirming ? (
              <>
                Click again to confirm.{' '}
                <button type="button" className="link-btn" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </>
            ) : (
              'Simulated. Nothing contacts emergency services.'
            )}
          </p>
        </div>
      )}
    </section>
  );
}
