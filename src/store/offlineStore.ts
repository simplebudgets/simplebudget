import { create } from 'zustand';

interface OfflineState {
    isOnline: boolean;
    setIsOnline: (val: boolean) => void;
    pendingCount: number;
    setPendingCount: (val: number) => void;
    isSyncing: boolean;
    setIsSyncing: (val: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
    isOnline: navigator.onLine,
    setIsOnline: (val) => set({ isOnline: val }),
    pendingCount: 0,
    setPendingCount: (val) => set({ pendingCount: val }),
    isSyncing: false,
    setIsSyncing: (val) => set({ isSyncing: val }),
}));
