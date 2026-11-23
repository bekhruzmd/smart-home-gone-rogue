import { supabase } from '../lib/supabaseClient.js';

// Activity history with optional filtering. The filter runs in the database
// (WHERE event_type = ...), not in the browser, so only matching rows are downloaded.
export async function fetchActivity(homeId, { eventType = 'all', limit = 100 } = {}) {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('home_id', homeId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (eventType !== 'all') query = query.eq('event_type', eventType);

  const { data, error } = await query;
  if (error) throw new Error(`Loading activity failed: ${error.message}`);
  return data;
}
