import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Tracks the signed-in Supabase user. Supabase keeps the session in localStorage,
// so a page refresh keeps you signed in.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Fires on sign in, sign out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}
