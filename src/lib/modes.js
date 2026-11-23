// The three smart-home modes. Each preset says what the MODE itself changes:
// security and climate. Mode lighting is done by automation rules
// (see automation_rules in the database) so you can switch it on or off per rule.
//
//   lockAllDoors: true  -> every lock device becomes locked
//   home: {...}         -> fields written to the homes table

export const MODES = {
  home: {
    id: 'home',
    label: 'Home',
    description: 'Comfortable lights, 72°F, alarm disarmed',
    lockAllDoors: false,
    home: { alarm_armed: false, alarm_triggered: false, target_temp: 72 },
  },
  away: {
    id: 'away',
    label: 'Away',
    description: 'Lights off, doors locked, alarm armed, 78°F eco',
    lockAllDoors: true,
    home: { alarm_armed: true, target_temp: 78 },
  },
  night: {
    id: 'night',
    label: 'Night',
    description: 'Dimmed lights, doors locked, alarm armed, 68°F',
    lockAllDoors: true,
    home: { alarm_armed: true, target_temp: 68 },
  },
};

export const MODE_LIST = [MODES.home, MODES.away, MODES.night];
