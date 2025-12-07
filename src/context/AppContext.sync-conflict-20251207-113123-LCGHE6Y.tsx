import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppState, Model, SourceType, FlowData } from '../types';

interface AppContextType extends AppState {
    setApiKey: (key: string) => void;
    setSelectedModel: (model: Model) => void;
    setInputUrl: (url: string) => void;
    setSourceType: (type: SourceType) => void;
    setStatus: (status: AppState['status']) => void;
    setError: (error: string | null) => void;
    setFlowData: (data: FlowData | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_key') || '');
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [inputUrl, setInputUrl] = useState('');
    const [sourceType, setSourceType] = useState<SourceType>('unknown');
    const [status, setStatus] = useState<AppState['status']>('idle');
    const [error, setError] = useState<string | null>(null);
    const [flowData, setFlowData] = useState<FlowData | null>(null);

    useEffect(() => {
        localStorage.setItem('openrouter_key', apiKey);
    }, [apiKey]);

    return (
        <AppContext.Provider value={{
            apiKey, setApiKey,
            selectedModel, setSelectedModel,
            inputUrl, setInputUrl,
            sourceType, setSourceType,
            status, setStatus,
            error, setError,
            flowData, setFlowData
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
