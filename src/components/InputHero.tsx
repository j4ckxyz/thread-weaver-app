import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { openRouterService } from '../services/openRouter';
import { fetchThreadContent } from '../services/fetchers';
import { historyService } from '../services/historyService';
import { HistorySidebar } from './HistorySidebar';

export const InputHero: React.FC = () => {
  const {
    inputUrl, setInputUrl,
    setSourceType,
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

      console.log('LLM Raw Response:', summaryData);

      // Relaxed Validation: If we have topics OR nodes, we proceed.
      // If summaryData is just an array (rare case handled by service ideally), we fail.
      if (!summaryData || (!summaryData.topics && !summaryData.nodes)) {
        console.error('Invalid Data Structure:', JSON.stringify(summaryData, null, 2));
        throw new Error('Invalid response format from LLM.');
      }

      // 3. Update Flow Data
      const flowNodes: any[] = [];
      const flowEdges: any[] = [];

      // Center Node
      const centerNodeId = 'center-root';
      flowNodes.push({
        id: centerNodeId,
        type: 'topic',
        position: { x: 0, y: 0 },
        data: { label: 'Thread Root', content: 'Central Topic' },
        style: { width: 150, height: 150, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#6366f1', border: 'none', boxShadow: '0 0 30px rgba(99,102,241,0.6)' }
      });

      const topics = summaryData.topics || [];
      const topicRadius = 600; // Large spacing
      const angleStep = (2 * Math.PI) / (topics.length || 1);

      topics.forEach((topic: any, idx: number) => {
        const angle = idx * angleStep;
        const topicX = Math.cos(angle) * topicRadius;
        const topicY = Math.sin(angle) * topicRadius;
        const topicNodeId = `topic-${idx}`;

        flowNodes.push({
          id: topicNodeId,
          type: 'topic',
          position: { x: topicX, y: topicY },
          data: { label: topic.title, content: topic.summary }
        });

        // Edge from Center to Topic
        flowEdges.push({
          id: `e-center-${idx}`,
          source: centerNodeId,
          target: topicNodeId,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 }
        });

        // Children Nodes (Comments)
        const relatedNodes = summaryData.nodes.filter((n: any) => n.topicId === topic.id);
        const baseChildRadius = 500; // Increased base spacing

        relatedNodes.forEach((n: any, nIdx: number) => {
          // Fan spread - wider arc
          const spread = Math.PI / 1.5; // Wider spread
          const startAngle = angle - (spread / 2);
          const childAngle = startAngle + ((nIdx + 1) * (spread / (relatedNodes.length + 1)));

          // Stagger distance to prevent overlap
          const radiusOffset = nIdx % 2 === 0 ? 0 : 180;
          const finalRadius = baseChildRadius + radiusOffset;

          const childX = topicX + Math.cos(childAngle) * finalRadius;
          const childY = topicY + Math.sin(childAngle) * finalRadius;

          const childNodeId = `node-${idx}-${nIdx}`;

          flowNodes.push({
            id: childNodeId,
            type: 'comment',
            position: { x: childX, y: childY },
            data: { ...n, label: n.author }
          });

          flowEdges.push({
            id: `e-${idx}-${nIdx}`,
            source: topicNodeId,
            target: childNodeId,
            animated: true,
            style: { stroke: '#a1a1aa' }
          });
        });
      });

      setFlowData({ nodes: flowNodes, edges: flowEdges } as any);

      // Save to History
      historyService.save({
        url: inputUrl,
        source: content.source as any,
        topicCount: topics.length,
        commentCount: summaryData.nodes.length,
        flowData: { nodes: flowNodes, edges: flowEdges } as any,
        modelId: selectedModel?.id || 'unknown'
      });

      setStatus('complete');

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred');
      setStatus('error');
    }
  };

  const isProcessing = status === 'fetching' || status === 'summarizing';

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 text-center mt-12">
      <HistorySidebar />
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

      {/* Error Display */}
      {status === 'error' && (
        <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded-lg text-sm border border-red-900/50">
          {useApp().error}
        </div>
      )}
    </div>
  );
};
