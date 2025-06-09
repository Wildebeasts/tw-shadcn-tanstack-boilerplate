/// <reference types="vite/client" />

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use Vite specific env vars for client-side accessibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Warnings if Supabase credentials are not configured or are using default placeholders
if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL") {
  console.warn("Supabase URL is not defined or uses the default placeholder. Please set the VITE_SUPABASE_URL environment variable in your .env file.");
}

if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
  console.warn("Supabase anon key is not defined or uses the default placeholder. Please set the VITE_SUPABASE_ANON_KEY environment variable in your .env file.");
}

/**
 * Creates a Supabase client instance for browser environments, configured to use
 * Clerk's session token for authentication.
 *
 * @param getToken A function that returns a Promise resolving to the Clerk session token string,
 *                 or null if no token is available. Typically, this would be:
 *                 `() => session?.getToken({ template: 'supabase' })`
 *                 where `session` is from Clerk's `useSession()` hook.
 * @returns A SupabaseClient instance.
 * @throws Error if Supabase URL or Anon Key is not configured.
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "YOUR_SUPABASE_URL" || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
    // Throw an error if essential configuration is missing or still default.
    // This helps catch configuration issues early.
    throw new Error('Supabase URL or Anon Key is not properly configured. Please check your environment variables and ensure they are not using default placeholder values.');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();

        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}
