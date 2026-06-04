import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// If variables are missing, we still initialize a dummy client structure (or log warnings)
// to prevent breaking the application when running in offline-only / guest mode.
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
