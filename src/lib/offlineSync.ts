/**
 * Offline sync engine.
 * Listens for online/offline events, performs periodic connectivity checks,
 * and drains the pending queue when connectivity returns.
 */

import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabase';
import { getAll, dequeue, pendingCount, enqueue, PendingTransaction } from './offlineQueue';
import { useOfflineStore } from '../store/offlineStore';
import { ensureSession } from '../components/extras/ensureSession';

let syncInProgress = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/** How long to wait for a network request before assuming we're offline (ms) */
const NETWORK_TIMEOUT = 8000;

/** How often to verify connectivity with a real network request (ms) */
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

/** Race a promise against a timeout. Rejects with a timeout error if too slow. */
function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Network timeout')), ms);
        Promise.resolve(promise).then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); },
        );
    });
}

/**
 * Performs a lightweight network check to verify actual internet connectivity.
 * navigator.onLine only checks if there's a network adapter — it doesn't detect
 * "lie-fi" (connected to WiFi but no internet). This pings Supabase's REST endpoint
 * with a tiny request to confirm real connectivity.
 */
export async function verifyConnectivity(): Promise<boolean> {
    // If the browser says we're offline, trust it immediately
    if (!navigator.onLine) {
        useOfflineStore.getState().setIsOnline(false);
        return false;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/`,
            {
                method: 'HEAD',
                headers: {
                    'apikey': SUPABASE_KEY,
                },
                signal: controller.signal,
            }
        );
        clearTimeout(timeout);

        // Any HTTP response (even 4xx/5xx) means the server is reachable.
        // Only a network failure / timeout means we're truly offline.
        useOfflineStore.getState().setIsOnline(true);
        useOfflineStore.getState().setLastVerifiedAt(Date.now());
        return true;
    } catch {
        // Network error, timeout, or abort — we're effectively offline
        useOfflineStore.getState().setIsOnline(false);
        return false;
    }
}

/** Start periodic heartbeat checks */
function startHeartbeat(): void {
    if (heartbeatInterval) return;
    heartbeatInterval = setInterval(async () => {
        const wasOnline = useOfflineStore.getState().isOnline;
        const isNowOnline = await verifyConnectivity();

        // If we just came back online, trigger a sync
        if (!wasOnline && isNowOnline) {
            syncPendingTransactions();
        }
    }, HEARTBEAT_INTERVAL);
}

/** Stop periodic heartbeat checks */
function stopHeartbeat(): void {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

/** Attempt to sync all pending transactions to Supabase */
export async function syncPendingTransactions(): Promise<{ synced: number; failed: number }> {
    if (syncInProgress) return { synced: 0, failed: 0 };
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    syncInProgress = true;
    useOfflineStore.getState().setIsSyncing(true);

    let synced = 0;
    let failed = 0;

    try {
        await withTimeout(ensureSession(), NETWORK_TIMEOUT);
        const pending = await getAll();

        for (const transaction of pending) {
            // Strip the queue metadata before inserting
            const { _queuedAt, ...payload } = transaction;

            try {
                const result = await withTimeout(
                    Promise.resolve(supabase.from('transactions').insert(payload)),
                    NETWORK_TIMEOUT
                ) as { error: any };

                if (result.error) {
                    // If it's a duplicate key error, the transaction already exists — remove from queue
                    if (result.error.code === '23505') {
                        await dequeue(transaction.recordID);
                        synced++;
                    } else {
                        failed++;
                        console.error('Offline sync failed for', transaction.recordID, result.error.message);
                    }
                } else {
                    await dequeue(transaction.recordID);
                    synced++;
                }
            } catch (err) {
                // Timeout or network error — stop trying, we're probably offline
                failed++;
                break;
            }
        }
    } catch (err) {
        console.error('Offline sync error:', err);
    } finally {
        syncInProgress = false;
        useOfflineStore.getState().setIsSyncing(false);
        // Update pending count
        const count = await pendingCount();
        useOfflineStore.getState().setPendingCount(count);
        // If ALL items failed (not just some), we're likely offline.
        // Don't mark offline if some succeeded — that means the network is working
        // but individual items had errors.
        if (count > 0 && failed > 0 && synced === 0) {
            useOfflineStore.getState().setIsOnline(false);
        }
    }

    return { synced, failed };
}

/**
 * Try to insert a transaction. Always queues first for instant UI response,
 * then attempts to sync in the background. If the sync succeeds, the item
 * is removed from the queue. If it fails, it stays queued for later.
 */
export async function insertTransactionWithOfflineSupport(
    transaction: Omit<PendingTransaction, '_queuedAt'>
): Promise<{ success: boolean; queued: boolean; error?: string }> {
    // Always enqueue first — guarantees the transaction is persisted locally
    await enqueue({ ...transaction, _queuedAt: Date.now() });
    const count = await pendingCount();
    useOfflineStore.getState().setPendingCount(count);

    // If clearly offline, don't even try the network
    if (!navigator.onLine) {
        return { success: true, queued: true };
    }

    // Fire-and-forget background sync attempt for this transaction
    syncSingleTransaction(transaction);

    // Return immediately — the UI doesn't wait for the network
    return { success: true, queued: true };
}

/** Background attempt to sync a single transaction, removing it from the queue on success */
async function syncSingleTransaction(transaction: Omit<PendingTransaction, '_queuedAt'>): Promise<void> {
    try {
        const result = await withTimeout(
            Promise.resolve(supabase.from('transactions').insert(transaction)),
            NETWORK_TIMEOUT
        ) as { error: any };

        if (!result.error || result.error.code === '23505') {
            // Success or duplicate — remove from queue
            await dequeue(transaction.recordID);
            const count = await pendingCount();
            useOfflineStore.getState().setPendingCount(count);
        }
        // If it's some other error, leave it in the queue for the next full sync
    } catch {
        // Timeout or network failure — verify connectivity before marking offline
        verifyConnectivity();
    }
}

/** Initialize online/offline listeners, heartbeat, and kick off initial sync */
export function initOfflineSync(): () => void {
    const handleOnline = () => {
        // Don't immediately trust navigator.onLine — verify with a real request
        verifyConnectivity().then((reallyOnline) => {
            if (reallyOnline) {
                syncPendingTransactions();
            }
        });
    };

    const handleOffline = () => {
        useOfflineStore.getState().setIsOnline(false);
    };

    // Also listen for visibility changes — when the app comes back to foreground,
    // re-verify connectivity (important for mobile where the OS suspends the app)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            verifyConnectivity().then((online) => {
                if (online) {
                    syncPendingTransactions();
                }
            });
        }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set initial state with a real connectivity check
    verifyConnectivity();

    // Start periodic heartbeat
    startHeartbeat();

    // Check for any pending items on startup
    pendingCount().then((count) => {
        useOfflineStore.getState().setPendingCount(count);
        // If we're online and have pending items, sync them
        if (navigator.onLine && count > 0) {
            syncPendingTransactions();
        }
    });

    // Cleanup function
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        stopHeartbeat();
    };
}
