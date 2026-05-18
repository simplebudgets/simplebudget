import { createClient, SupabaseClient } from "@supabase/supabase-js";

declare global {
    interface Window {
        __SUPABASE_CONFIG__?: { url: string; key: string };
    }
}

const PRODUCTION_URL = "https://psdmjjcvaxejxktqwdcm.supabase.co";
const PRODUCTION_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZG1qamN2YXhlanhrdHF3ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAzMzA0ODMsImV4cCI6MTk4NTkwNjQ4M30.7Uqw2v3Ny5FvPBRBbbvtcUxJj_ReNDjRBUn6cWlal_o";

/**
 * Config resolution priority:
 * 1. window.__SUPABASE_CONFIG__ (set via public/config.js for self-hosted deployments)
 * 2. localStorage 'supabaseCustomConfig' (per-user runtime override)
 * 3. VITE_SUPABASE_URL / VITE_SUPABASE_KEY env vars (build-time)
 * 4. Hardcoded production defaults
 */
function getSupabaseConfig(): { url: string; key: string } {
    // 1. Self-hosted global config (config.js loaded before the app bundle)
    if (window.__SUPABASE_CONFIG__?.url && window.__SUPABASE_CONFIG__?.key) {
        return { url: window.__SUPABASE_CONFIG__.url, key: window.__SUPABASE_CONFIG__.key };
    }

    // 2. Per-user localStorage override
    const customConfig = localStorage.getItem('supabaseCustomConfig');
    if (customConfig) {
        try {
            const parsed = JSON.parse(customConfig);
            if (parsed.url && parsed.key) {
                return { url: parsed.url, key: parsed.key };
            }
        } catch {
            // Fall through to defaults
        }
    }

    // 3. Build-time env vars, 4. Production defaults
    return {
        url: import.meta.env.VITE_SUPABASE_URL || PRODUCTION_URL,
        key: import.meta.env.VITE_SUPABASE_KEY || PRODUCTION_KEY,
    };
}

const config = getSupabaseConfig();

let SUPABASE_URL = config.url;
let SUPABASE_KEY = config.key;

let supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'public' },
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/**
 * Reinitialize the Supabase client with a custom URL and key.
 * Stores the config in localStorage so it persists across reloads.
 */
export function setCustomSupabaseConfig(url: string, key: string) {
    localStorage.setItem('supabaseCustomConfig', JSON.stringify({ url, key }));
    SUPABASE_URL = url;
    SUPABASE_KEY = key;
    supabase = createClient(url, key, {
        db: { schema: 'public' },
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });
}

/**
 * Reset to the production Supabase backend (or the self-hosted config if set).
 */
export function resetToProductionSupabase() {
    localStorage.removeItem('supabaseCustomConfig');
    const resolved = getSupabaseConfig();
    SUPABASE_URL = resolved.url;
    SUPABASE_KEY = resolved.key;
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        db: { schema: 'public' },
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });
}

/**
 * Returns true if a custom (non-production) Supabase config is active via localStorage.
 */
export function isCustomSupabaseConfig(): boolean {
    return localStorage.getItem('supabaseCustomConfig') !== null;
}

/**
 * Returns true if a self-hosted global config is set via config.js.
 */
export function isSelfHostedConfig(): boolean {
    return !!(window.__SUPABASE_CONFIG__?.url && window.__SUPABASE_CONFIG__?.key);
}

export { supabase, SUPABASE_URL, SUPABASE_KEY };
