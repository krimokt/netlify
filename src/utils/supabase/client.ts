import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Gets Supabase client for the browser
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storageKey: 'supabase.auth.token',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') {
            return null;
          }
          return JSON.parse(window.localStorage.getItem(key) || 'null');
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(value));
          }
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
        },
      },
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
}; 