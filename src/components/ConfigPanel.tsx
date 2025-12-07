import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { openRouterService } from '../services/openRouter';
import type { Model } from '../types';
import { Settings, Key, Search, Check, ChevronDown, ChevronUp } from 'lucide-react';

export const ConfigPanel: React.FC = () => {
    const { apiKey, setApiKey, selectedModel, setSelectedModel } = useApp();
    const [models, setModels] = useState<Model[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(!apiKey); // Auto-open if no key

    useEffect(() => {
        if (apiKey && isOpen && models.length === 0) {
            setLoadingModels(true);
            openRouterService.getModels().then(ms => {
                setModels(ms);
                if (ms.length > 0 && !selectedModel) {
                    // Default to a good cheap model if available, or just the first
                    const defaultModel = ms.find(m => m.id.includes('llama-3-70b')) || ms[0];
                    setSelectedModel(defaultModel);
                }
                setLoadingModels(false);
            });
        }
    }, [apiKey, isOpen]);

    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-2 ml-auto"
            >
                <Settings size={16} />
                {isOpen ? 'Hide Configuration' : (selectedModel ? `Using ${selectedModel.name}` : 'Configure API')}
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="glass-panel rounded-xl p-6 flex flex-col gap-6 animate-fade-in">
                    {/* API Key Section */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Key size={16} className="text-indigo-400" />
                            OpenRouter API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-..."
                            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <p className="text-xs text-zinc-500">
                            Your key is stored locally in your browser.
                        </p>
                    </div>

                    {/* Model Selection */}
                    {apiKey && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Search size={16} className="text-indigo-400" />
                                Select Model ({models.length} available)
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search models (e.g. gpt-4, claude, llama)..."
                                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {loadingModels ? (
                                <div className="text-sm text-zinc-500 animate-pulse">Loading models...</div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto border border-zinc-700/50 rounded-lg bg-zinc-900/30">
                                    {filteredModels.map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model)}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/5 flex items-center justify-between transition-colors ${selectedModel?.id === model.id ? 'bg-indigo-500/20 text-indigo-200' : 'text-zinc-300'}`}
                                        >
                                            <span className="truncate pr-4">{model.name}</span>
                                            {selectedModel?.id === model.id && <Check size={16} />}
                                        </button>
                                    ))}
                                    {filteredModels.length === 0 && (
                                        <div className="p-4 text-center text-zinc-500 text-sm">No models found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
};
