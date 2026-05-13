/**
 * Offline sync engine.
 * Listens for online/offline events and drains the pending queue when connectivity returns.
 */

import { supabase } from './supabase';
import { getAll, dequeue, pendingCount, enqueue, PendingTransaction } from './offlineQueue';
import { useOfflineStore } from '../store/offlineStore';
import { ensureSession } from '../components/extras/ensureSession';

let syncInProgress = false;

/** Attempt to sync all pending transactions to Supabase */
export async function syncPendingTransactions(): Promise<{ synced: number; failed: number }> {
    if (syncInProgress) return { synced: 0, failed: 0 };
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    syncInProgress = true;
    useOfflineStore.getState().setIsSyncing(true);

    let synced = 0;
    let failed = 0;

    try {
        await ensureSession();
        const pending = await getAll();

        for (const transaction of pending) {
            // Strip the queue metadata before inserting
            const { _queuedAt, ...payload } = transaction;

            const { error } = await supabase
                .from('transactions')
                .insert(payload);

            if (error) {
                // If it's a duplicate key error, the transaction already exists — remove from queue
                if (error.code === '23505') {
                    await dequeue(transaction.recordID);
                    synced++;
                } else {
                    failed++;
                    console.error('Offline sync failed for', transaction.recordID, error.message);
                }
            } else {
                await dequeue(transaction.recordID);
                synced++;
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
    }

    return { synced, failed };
}

/**
 * Try to insert a transaction. If offline or the request fails due to network,
 * queue it for later sync. Returns true if saved (either online or queued).
 */
export async function insertTransactionWithOfflineSupport(
    transaction: Omit<PendingTransaction, '_queuedAt'>
): Promise<{ success: boolean; queued: boolean; error?: string }> {
    // If offline, queue immediately
    if (!navigator.onLine) {
        await enqueue({ ...transaction, _queuedAt: Date.now() });
        const count = await pendingCount();
        useOfflineStore.getState().setPendingCount(count);
        return { success: true, queued: true };
    }

    // Try the insert
    try {
        const { error } = await supabase
            .from('transactions')
            .insert(transaction);

        if (error) {
            // If it looks like a network error, queue it
            if (isNetworkError(error)) {
                await enqueue({ ...transaction, _queuedAt: Date.now() });
                const count = await pendingCount();
                useOfflineStore.getState().setPendingCount(count);
                return { success: true, queued: true };
            }
            return { success: false, queued: false, error: error.message };
        }

        return { success: true, queued: false };
    } catch (err: any) {
        // Network-level failure (fetch failed, timeout, etc.)
        await enqueue({ ...transaction, _queuedAt: Date.now() });
        const count = await pendingCount();
        useOfflineStore.getState().setPendingCount(count);
        return { success: true, queued: true };
    }
}

/** Heuristic to detect network-related Supabase errors */
function isNetworkError(error: any): boolean {
    const msg = (error?.message || '').toLowerCase();
    return (
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed') ||
        msg.includes('networkerror') ||
        error?.code === 'NETWORK_ERROR'
    );
}

/** Initialize online/offline listeners and kick off initial sync */
export function initOfflineSync(): () => void {
    const handleOnline = () => {
        useOfflineStore.getState().setIsOnline(true);
        // Auto-sync when coming back online
        syncPendingTransactions();
    };

    const handleOffline = () => {
        useOfflineStore.getState().setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    useOfflineStore.getState().setIsOnline(navigator.onLine);

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
    };
}
