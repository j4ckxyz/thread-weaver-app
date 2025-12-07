export type SourceType = 'hacker-news' | 'reddit' | 'bluesky' | 'unknown';

export interface Model {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

export interface ThreadNode {
    id: string;
    type: 'topic' | 'comment' | 'root';
    data: {
        label: string;
        content?: string;
        author?: string;
        link?: string;
        sentiment?: 'positive' | 'negative' | 'neutral' | 'insightful' | 'controversial';
        score?: number;
    };
    position: { x: number; y: number };
}

export interface FlowData {
    nodes: ThreadNode[];
    edges: { id: string; source: string; target: string; animated?: boolean }[];
}

export interface AppState {
    apiKey: string;
    selectedModel: Model | null;
    inputUrl: string;
    sourceType: SourceType;
    status: 'idle' | 'fetching' | 'summarizing' | 'complete' | 'error';
    error: string | null;
    flowData: FlowData | null;
}
