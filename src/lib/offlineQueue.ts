/**
 * IndexedDB-backed offline queue for transactions.
 * Stores pending transactions that failed to sync due to network issues.
 */

const DB_NAME = 'simpleBudgetOffline';
const DB_VERSION = 1;
const STORE_NAME = 'pendingTransactions';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'recordID' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export interface PendingTransaction {
    recordID: string;
    budgetID: string;
    categoryID: string | null;
    amount: number;
    title: string;
    transactionDate: number;
    transactionType: string;
    creatorID: string;
    _queuedAt: number; // timestamp when queued
}

/** Add a transaction to the offline queue */
export async function enqueue(transaction: PendingTransaction): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(transaction);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Get all pending transactions from the queue */
export async function getAll(): Promise<PendingTransaction[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Remove a transaction from the queue after successful sync */
export async function dequeue(recordID: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(recordID);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Get the count of pending transactions */
export async function pendingCount(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
