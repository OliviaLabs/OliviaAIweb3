import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_S_KEY;

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

function createDisabledSupabase() {
  const noAuth = {
    async getSession() { return { data: { session: null } } },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
    async signUp() { throw new Error('Supabase disabled') },
    async signInWithPassword() { throw new Error('Supabase disabled') },
    async signOut() { return },
    async resetPasswordForEmail() { throw new Error('Supabase disabled') },
    async updateUser() { throw new Error('Supabase disabled') },
    async signInWithOAuth() { throw new Error('Supabase disabled') },
  };
  return { auth: noAuth };
}

const supabase_v2 = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDisabledSupabase();

export { supabase_v2 };
