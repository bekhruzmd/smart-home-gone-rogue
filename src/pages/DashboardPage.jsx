import { useState } from 'react';
import { History } from 'lucide-react';
import StatusOverview from '../components/StatusOverview.jsx';
import ModeSelector from '../components/ModeSelector.jsx';
import LightingPanel from '../components/LightingPanel.jsx';
import SecurityPanel from '../components/SecurityPanel.jsx';
import ThermostatPanel from '../components/ThermostatPanel.jsx';
import EmergencyOverride from '../components/EmergencyOverride.jsx';
import ActivityList from '../components/ActivityList.jsx';
import SystemCard from '../components/SystemCard.jsx';
import { AlarmAlert, EmergencyBanner } from '../components/AlertBanners.jsx';

// Layout, top to bottom: emergency banner → posted status placard → alarm strip →
// mode plates → rooms → climate | security | activity → emergency override.
export default function DashboardPage({ state, logs, actions, onNavigate }) {
  const { home } = state;
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleReset() {
    if (!confirmReset) return setConfirmReset(true);
    setConfirmReset(false);
    await actions.resetDemo();
  }

  return (
    <>
      <EmergencyBanner home={home} />
      <StatusOverview
        state={state}
        confirmReset={confirmReset}
        onReset={handleReset}
        onCancelReset={() => setConfirmReset(false)}
      />
      <AlarmAlert home={home} onAcknowledge={actions.acknowledgeAlarm} />

      <ModeSelector mode={home.mode} disabled={home.emergency_active} onSelect={actions.setMode} />
      <LightingPanel state={state} actions={actions} />

      <div className="dashboard-grid">
        <ThermostatPanel state={state} actions={actions} />
        <SecurityPanel state={state} logs={logs} actions={actions} />
        <SystemCard
          title="Recent activity"
          icon={History}
          className="activity-panel"
          aside={
            <button type="button" className="link-btn small" onClick={() => onNavigate('activity')}>
              View all
            </button>
          }
        >
          <ActivityList logs={logs.slice(0, 7)} compact />
        </SystemCard>
      </div>

      <EmergencyOverride home={home} actions={actions} />
    </>
  );
}
