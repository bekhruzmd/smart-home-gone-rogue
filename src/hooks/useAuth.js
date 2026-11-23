import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Tracks the signed-in Supabase user. Supabase keeps the session in localStorage,
// so a page refresh keeps you signed in.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    let authChanged = false;
    supabase.auth.getSession().then(({ data }) => {
      if (active && !authChanged) setSession(data.session);
    }).catch(() => {
      if (active && !authChanged) setSession(null);
    }).finally(() => {
      if (active) setLoading(false);
    });

    // Fires on sign in, sign out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      authChanged = true;
      if (active) {
        setSession(newSession);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
