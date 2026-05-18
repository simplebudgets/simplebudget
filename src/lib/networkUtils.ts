/**
 * Shared network utilities for handling unreliable connectivity.
 */

/** How long to wait before assuming we're offline (ms) */
const NETWORK_TIMEOUT = 8000;

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the timeout, it rejects with a "Network timeout" error.
 * Use this around any Supabase call that might hang when offline.
 */
export function withNetworkTimeout<T>(promise: Promise<T> | PromiseLike<T>, ms: number = NETWORK_TIMEOUT): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Network timeout — are you offline?')), ms);
        Promise.resolve(promise).then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); },
        );
    });
}
