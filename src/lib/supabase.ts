import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://psdmjjcvaxejxktqwdcm.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZG1qamN2YXhlanhrdHF3ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAzMzA0ODMsImV4cCI6MTk4NTkwNjQ4M30.7Uqw2v3Ny5FvPBRBbbvtcUxJj_ReNDjRBUn6cWlal_o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'public' },
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/** Exported for use in connectivity checks */
export { SUPABASE_URL, SUPABASE_KEY };
