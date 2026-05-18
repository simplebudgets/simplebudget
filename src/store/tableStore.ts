import { create } from "zustand";
import dayjs from "dayjs";

let currentBudget = {
    budgetID: '1',
    year: Number(dayjs().format('YYYY')),
    month: dayjs().format('MMMM'),
};

if (localStorage.getItem('currentBudget')) {
    currentBudget = JSON.parse(localStorage.getItem('currentBudget')!);
    if ((currentBudget as any).year === undefined) {
        currentBudget.year = Number(dayjs().format('YYYY'));
        currentBudget.month = dayjs().format('MMMM');
        localStorage.setItem('currentBudget', JSON.stringify(currentBudget));
    }
}

// Load cached data from localStorage for offline-first startup
function loadCached(key: string): any[] {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return [];
}

interface TableState {
    shared: any;
    setShared: (val: any) => void;
    budgets: any[];
    setBudgets: (val: any[] | ((prev: any[]) => any[])) => void;
    currentBudgetAndMonth: any;
    setCurrentBudgetAndMonth: (val: any) => void;
    transactions: any[];
    setTransactions: (val: any[] | ((prev: any[]) => any[])) => void;
    categories: any[];
    setCategories: (val: any[] | ((prev: any[]) => any[])) => void;
    sections: any[];
    setSections: (val: any[] | ((prev: any[]) => any[])) => void;
}

export const useTableStore = create<TableState>((set) => ({
    shared: null,
    setShared: (val) => set({ shared: val }),
    budgets: loadCached('cachedBudgets'),
    setBudgets: (val) => set((state) => ({
        budgets: typeof val === 'function' ? val(state.budgets) : val,
    })),
    currentBudgetAndMonth: currentBudget,
    setCurrentBudgetAndMonth: (val) => set({ currentBudgetAndMonth: val }),
    transactions: loadCached('cachedTransactions'),
    setTransactions: (val) => set((state) => ({
        transactions: typeof val === 'function' ? val(state.transactions) : val,
    })),
    categories: loadCached('cachedCategories'),
    setCategories: (val) => set((state) => ({
        categories: typeof val === 'function' ? val(state.categories) : val,
    })),
    sections: loadCached('cachedSections'),
    setSections: (val) => set((state) => ({
        sections: typeof val === 'function' ? val(state.sections) : val,
    })),
}));
