import RoomCard from './RoomCard.jsx';
import { lightsSummary } from '../lib/homeStatus.js';

// The rooms strip: one tile per room plus the master light controls.
// It's a plain section (not a SystemCard) so the room tiles aren't cards nested inside a card.
export default function LightingPanel({ state, actions }) {
  const { rooms, devices } = state;
  const { on, total } = lightsSummary(devices);

  return (
    <section className="rooms-section" aria-labelledby="rooms-heading">
      <div className="section-head">
        <h2 id="rooms-heading">Rooms</h2>
        <div className="section-tools">
          <span className="muted small" aria-live="polite">
            {on} of {total} lights on
          </span>
          <div className="button-pair" role="group" aria-label="Master lights">
            <button type="button" className="btn btn-sm" onClick={() => actions.setAllLights(true)} disabled={on === total}>
              All on
            </button>
            <button type="button" className="btn btn-sm" onClick={() => actions.setAllLights(false)} disabled={on === 0}>
              All off
            </button>
          </div>
        </div>
      </div>
      <div className="room-grid">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            light={devices.find((d) => d.room_id === room.id && d.type === 'light')}
            lock={devices.find((d) => d.room_id === room.id && d.type === 'lock')}
            actions={actions}
          />
        ))}
      </div>
    </section>
  );
}
