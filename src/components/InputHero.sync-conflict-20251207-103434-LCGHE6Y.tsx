import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { openRouterService } from '../services/openRouter';
import { fetchThreadContent } from '../services/fetchers';

export const InputHero: React.FC = () => {
  const {
    inputUrl, setInputUrl,
    sourceType, setSourceType,
    apiKey, selectedModel,
    status, setStatus,
    setFlowData, setError
  } = useApp();

  const handleSummarize = async () => {
    if (!inputUrl) return;
    if (!apiKey || !selectedModel) {
      setError('Please configure your API Key and Model first.');
      return;
    }

    setStatus('fetching');
    setError(null);
    setFlowData(null);

    try {
      // 1. Fetch Content
      const content = await fetchThreadContent(inputUrl);
      setSourceType(content.source as any);

      setStatus('summarizing');

      // 2. Summarize via LLM
      const summaryData = await openRouterService.summarizeThread(
        apiKey,
        selectedModel.id,
        content.text,
        content.source
      );

      console.log('LLM Response:', summaryData);

      if (!summaryData || !summaryData.topics || !Array.isArray(summaryData.topics)) {
        throw new Error('Invalid response format from LLM.');
      }

    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
      Thread Weaver
    </h1>
    <p className="text-zinc-400 text-lg">
      Turn complex discussions into beautiful, organized insights.
    </p>

    <div className="relative group w-full">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      <div className="relative flex items-center bg-zinc-900 rounded-xl border border-zinc-700/50 p-2">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste Hacker News ID, Reddit URL, or Bluesky Link..."
          className="w-full bg-transparent border-none text-white px-4 py-2 focus:ring-0 placeholder-zinc-600"
          onKeyDown={(e) => e.key === 'Enter' && handleSummarize()}
        />
        <button
          onClick={handleSummarize}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {status === 'fetching' ? 'Fetching...' : status === 'summarizing' ? 'Weaving...' : 'Summarize'}
        </button>
      </div>
    </div>

      {/* Error Display */ }
      {
        status === 'error' && (
          <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded-lg text-sm border border-red-900/50">
            {useApp().error}
          </div>
        )
      }
  </div >
);
};
