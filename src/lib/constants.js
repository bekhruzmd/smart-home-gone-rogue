// Shared configuration used across the app. Keeping these in one place means the
// UI, the automation engine and the tests all agree on the same numbers.

// Thermostat limits match the original assignment's slider (55–90 °F) and the
// CHECK constraint on homes.target_temp in supabase/migrations/001_schema.sql.
export const TEMP_MIN = 55;
export const TEMP_MAX = 90;

// The original app's "comfort zone"; outside it counts as an issue.
export const COMFORT_MIN = 68;
export const COMFORT_MAX = 76;

export const TEMPERATURE_PRESETS = [
  { id: 'eco', label: 'Eco', value: 78, hint: 'Energy saving' },
  { id: 'comfort', label: 'Comfort', value: 72, hint: 'Everyday' },
  { id: 'sleep', label: 'Sleep', value: 68, hint: 'Cooler for sleep' },
];

export const HVAC_MODES = [
  { id: 'heat', label: 'Heat' },
  { id: 'cool', label: 'Cool' },
  { id: 'auto', label: 'Auto' },
  { id: 'off', label: 'Off' },
];

// Allowed values of activity_logs.event_type (also enforced by the database).
export const EVENT_TYPES = [
  { id: 'lighting', label: 'Lighting' },
  { id: 'security', label: 'Security' },
  { id: 'climate', label: 'Climate' },
  { id: 'mode', label: 'Modes' },
  { id: 'automation', label: 'Automation' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'system', label: 'System' },
];

// Kept from the original assignment's emergency override. In 2.0 it is a deliberate
// confirmation step (so nobody restores the house by accident), NOT a password —
// real access control is Supabase Auth + Row Level Security.
export const RESTORE_PHRASE = 'I control this house';

export const EMERGENCY_REASONS = ['Fire alarm', 'Gas leak', 'Medical emergency', 'Other emergency'];
