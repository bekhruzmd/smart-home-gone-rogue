import { Sofa, BedDouble, CookingPot, Bath, House, LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import Switch from './Switch.jsx';
import BrightnessSlider from './BrightnessSlider.jsx';

const ROOM_ICONS = { living_room: Sofa, bedroom: BedDouble, kitchen: CookingPot, bathroom: Bath };

// One room tile: its light (toggle + brightness) and, if the room has one, its door lock.
export default function RoomCard({ room, light, lock, actions }) {
  const lit = light?.is_on;
  // The tile's warm glow follows brightness, so "visual feedback for active lights" is literal.
  const glow = lit ? light.brightness / 100 : 0;
  const Icon = ROOM_ICONS[room.slug] ?? House;

  return (
    <article className={`room-card ${lit ? 'is-lit' : ''}`} style={{ '--glow': glow }} aria-label={room.name}>
      <header className="room-head">
        <span className="room-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div className="room-title">
          <h3>{room.name}</h3>
          {light && <p className="room-status">{lit ? `Light on, ${light.brightness}%` : 'Light off'}</p>}
        </div>
        {light && <Switch checked={lit} onChange={() => actions.toggleLight(light.id)} label={`${room.name} lights`} />}
      </header>

      {light && (
        <BrightnessSlider
          id={`brightness-${light.id}`}
          label={`${room.name} brightness`}
          value={lit ? light.brightness : 0}
          onCommit={(v) => actions.setBrightness(light.id, v)}
        />
      )}

      {lock && (
        <button
          type="button"
          className={`lock-button ${lock.is_locked ? 'is-locked' : 'is-unlocked'}`}
          onClick={() => actions.toggleLock(lock.id)}
          aria-label={`${lock.name}: ${lock.is_locked ? 'locked' : 'unlocked'}. Click to ${lock.is_locked ? 'unlock' : 'lock'}.`}
        >
          {lock.is_locked ? <LockKeyhole size={16} aria-hidden="true" /> : <LockKeyholeOpen size={16} aria-hidden="true" />}
          <span>{lock.name}</span>
          <strong>{lock.is_locked ? 'Locked' : 'Unlocked'}</strong>
        </button>
      )}
    </article>
  );
}
