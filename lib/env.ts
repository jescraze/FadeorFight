export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** False until Supabase keys are set; the site then runs on demo data. */
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
