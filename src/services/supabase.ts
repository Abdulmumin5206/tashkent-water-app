import { createClient } from '@supabase/supabase-js';

// @ts-expect-error - Vite env types are defined in vite-env.d.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// @ts-expect-error - Vite env types are defined in vite-env.d.ts
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export default supabase;
