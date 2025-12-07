import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { openRouterService } from '../services/openRouter';
import { Send, MessageSquare, Loader2, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import type { ThreadNode } from '../types';

export const ChatPanel: React.FC = () => {
    const {
        flowData,
        setFlowData,
        apiKey,
        selectedModel,
        inputUrl
    } = useApp();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Don't show if no data
    if (!flowData || !apiKey || !selectedModel) return null;

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const question = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: question }]);
        setLoading(true);

        try {
            // Prepare context (thread content is not stored in state directly right now, 
            // but we can re-fetch or arguably we should have stored it. 
            // For now, let's use the flow nodes as context since that's what we have nicely structured).
            // Ideally, we'd have the raw text. Let's use the node contents as a proxy for the 'thread'.

            const threadContext = flowData.nodes.map(n =>
                `[${n.data.author || 'Author'}]: ${n.data.content}`
            ).join('\n\n');

            const graphSnapshot = JSON.stringify(flowData.nodes.map(n => ({ id: n.id, label: n.data.label })));

            const result = await openRouterService.chatWithThread(
                apiKey,
                selectedModel.id,
                threadContext,
                question,
                graphSnapshot
            );

            setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);

            // If there are new nodes, add them!
            if (result.newNodes && Array.isArray(result.newNodes) && result.newNodes.length > 0) {
                const newNodes: ThreadNode[] = [];
                const newEdges: any[] = [];

                // We need to place them somewhere. Let's spawn them near the center or just list them.
                // Better: Check if they have a topicId in the newNodes.
                // If not, put them in a "New Insights" area?

                result.newNodes.forEach((n: any, idx: number) => {
                    // Logic to find position. Random for now or offset from center
                    const newId = `chat-node-${Date.now()}-${idx}`;

                    newNodes.push({
                        id: newId,
                        type: 'comment',
                        position: { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250 },
                        data: {
                            ...n,
                            label: n.author || 'AI Insight',
                            content: n.content
                        }
                    });

                    // Link to center for now if no topic
                    newEdges.push({
                        id: `e-${newId}`,
                        source: 'center-root',
                        target: newId,
                        animated: true,
                        style: { stroke: '#10b981', strokeDasharray: '5,5' } // Green dashed for AI nodes
                    });
                });

                // Update Flow Data
                setFlowData({
                    nodes: [...flowData.nodes, ...newNodes],
                    edges: [...flowData.edges, ...newEdges]
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error answering that.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-110 active:scale-95 animate-fade-in"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[500px] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-400" />
                            Chat with Thread
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
                        {messages.length === 0 && (
                            <div className="text-center text-zinc-500 mt-10">
                                <p>Ask any question about the discussion!</p>
                                <p className="text-xs mt-2 opacity-60">"What is the main controversy?"</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm border border-zinc-700'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 p-3 rounded-2xl rounded-bl-sm border border-zinc-700">
                                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


