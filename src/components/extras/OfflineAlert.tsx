import Alert from '@mui/material/Alert';
import { useOfflineStore } from '../../store/offlineStore';

/**
 * A small alert banner to show inside modals/dialogs when the user is offline.
 * Returns null when online so it can be dropped in anywhere.
 */
export default function OfflineAlert() {
    const isOnline = useOfflineStore(s => s.isOnline);
    if (isOnline) return null;
    return (
        <Alert severity="warning" variant="outlined" sx={{ py: 0, mb: 1 }}>
            You're offline — this action is unavailable.
        </Alert>
    );
}

/**
 * A top-level offline banner for the main app layout.
 * Shows a persistent warning when the user is offline.
 */
export function OfflineBanner() {
    const isOnline = useOfflineStore(s => s.isOnline);
    const pendingCount = useOfflineStore(s => s.pendingCount);
    if (isOnline) return null;
    return (
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 0, py: 0 }}>
            You're offline — viewing cached data. Only "Add Transaction" is available.
            {pendingCount > 0 && ` (${pendingCount} pending sync)`}
        </Alert>
    );
}

/** Hook that returns true when the app is effectively offline */
export function useIsOffline(): boolean {
    return !useOfflineStore(s => s.isOnline);
}
