import { createClient } from '@supabase/supabase-js';

// Public configuration only. Vite exposes variables that start with VITE_ to the browser.
// The anon (public) key is designed to be visible; Row Level Security is what protects data.
// NEVER put the service_role key here or in any VITE_ variable.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// null when .env is missing, so the app can show setup instructions instead of crashing.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
