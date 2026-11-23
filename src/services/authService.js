import { supabase } from '../lib/supabaseClient.js';

// Thin wrappers around Supabase Auth (email + password).
// The session token they create is sent with every database request, and the
// Row Level Security policies use it (auth.uid()) to decide which rows you can see.

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

// Returns true when the account still needs email confirmation before signing in.
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return !data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
