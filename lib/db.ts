import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key (bypasses RLS).
// Placeholder fallbacks prevent Next.js build errors when env vars are absent locally.
// Real values must be set in .env.local (dev) or Vercel env vars (production).
export const supabase = createClient(
  process.env.SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-key",
  { auth: { persistSession: false } }
);
