import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { historyService } from '../services/historyService';
import type { HistoryItem } from '../types';
import { Clock, Trash2, ChevronRight, Hash, MessageSquare } from 'lucide-react';

export const HistorySidebar: React.FC = () => {
    const { setFlowData, setInputUrl, setSourceType, status } = useApp();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const loadHistory = () => {
        setHistory(historyService.getAll());
    };

    useEffect(() => {
        // Load initially
        loadHistory();

        // Poll or listen? Ideally we'd have a stronger event system, 
        // but for now let's just reload when status changes to 'complete' (new save)
        // or just rely on manual open.
    }, [status]); // Reloads when a new summary completes

    const restore = (item: HistoryItem) => {
        setFlowData(item.flowData);
        setInputUrl(item.url);
        setSourceType(item.source);
        setIsOpen(false);
    };

    const remove = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        historyService.delete(id);
        loadHistory();
    };

    if (history.length === 0) return null;

    return (
        <>
            {/* Toggle Button (Floating Left) */}
            <button
                onClick={() => { setIsOpen(true); loadHistory(); }}
                className={`fixed left-4 top-24 z-40 bg-zinc-800/80 p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all ${isOpen ? 'hidden' : 'block'}`}
                title="Recent Threads"
            >
                <Clock size={20} />
            </button>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        Recent Threads
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto h-full pb-20 p-2 space-y-2">
                    {history.map(item => (
                        <div
                            key={item.id}
                            onClick={() => restore(item)}
                            className="group p-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer transition-all relative"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] text-zinc-500 uppercase font-mono">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={(e) => remove(e, item.id)}
                                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            <p className="text-sm text-zinc-300 font-medium line-clamp-1 mb-2" title={item.url}>
                                {item.url}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <span className="flex items-center gap-1"><Hash size={10} /> {item.topicCount}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={10} /> {item.commentCount}</span>
                                <span className="ml-auto flex items-center gap-1 text-indigo-400/50 group-hover:text-indigo-400">
                                    Load <ChevronRight size={12} />
                                </span>
                            </div>
                        </div>
                    ))}

                    {history.length === 0 && (
                        <div className="text-center text-zinc-600 py-8 text-sm">
                            No history yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
