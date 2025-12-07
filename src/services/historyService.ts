import type { HistoryItem } from '../types';

const HISTORY_KEY = 'thread_weaver_history';

export const historyService = {
    getAll: (): HistoryItem[] => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load history', e);
            return [];
        }
    },

    save: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        const history = historyService.getAll();
        const newItem: HistoryItem = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };

        // Add to beginning, limit to 20 items
        const updated = [newItem, ...history].slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return newItem;
    },

    delete: (id: string) => {
        const history = historyService.getAll();
        const updated = history.filter(h => h.id !== id);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
    },

    clear: () => {
        localStorage.removeItem(HISTORY_KEY);
    }
};
