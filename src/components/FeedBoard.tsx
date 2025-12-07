import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Quote, Hash, ChevronDown, ChevronUp } from 'lucide-react';

export const FeedBoard: React.FC = () => {
    const { flowData } = useApp();
    const [expandedTopics, setExpandedTopics] = React.useState<Set<string>>(new Set());

    const topics = useMemo(() => {
        if (!flowData) return [];
        return flowData.nodes.filter(n => n.type === 'topic' || n.type === 'root');
    }, [flowData]);

    const toggleTopic = (id: string) => {
        const newSet = new Set(expandedTopics);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedTopics(newSet);
    };

    if (!flowData) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 px-4 pb-24 animate-fade-in flex flex-col gap-6">
            {topics.map((topic) => {
                const isRoot = topic.type === 'root';
                // Find comments related to this topic
                // In our current structure, we don't strictly have a parent-child link in 'data' except implicitly via filtering in InputHero.
                // However, based on how we built the graph, edges connect Topic -> Comment.
                // Or comments have `topicId` in their data if we preserved it from the LLM response.
                // Let's rely on finding edges: Source = TopicID, Target = CommentID

                const relatedEdges = flowData.edges.filter(e => e.source === topic.id);
                const relatedCommentIds = new Set(relatedEdges.map(e => e.target));
                const comments = flowData.nodes.filter(n => relatedCommentIds.has(n.id) && n.type === 'comment');

                // If it's root, maybe it doesn't have direct comments in the same way, or maybe it does.

                const isExpanded = expandedTopics.has(topic.id) || isRoot; // Root always expanded/visible?

                return (
                    <div key={topic.id} className="bg-zinc-900/50 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
                        {/* Header / Topic Card */}
                        <div
                            onClick={() => !isRoot && toggleTopic(topic.id)}
                            className={`p-5 cursor-pointer transition-colors ${isRoot ? 'bg-indigo-600/20 border-b border-indigo-500/30' : 'hover:bg-zinc-800/50'}`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash size={18} className={isRoot ? "text-indigo-400" : "text-zinc-500"} />
                                        <h3 className="text-xl font-bold text-white leading-tight">
                                            {topic.data.label}
                                        </h3>
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        {topic.data.content}
                                    </p>
                                </div>
                                {!isRoot && (
                                    <button className="text-zinc-500 mt-1">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                )}
                            </div>

                            {!isRoot && comments.length > 0 && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                    <MessageSquare size={12} />
                                    {comments.length} comments
                                </div>
                            )}
                        </div>

                        {/* Comments Feed */}
                        {isExpanded && comments.length > 0 && (
                            <div className="bg-zinc-950/30 border-t border-zinc-800/50 divide-y divide-zinc-800/50">
                                {comments.map(comment => (
                                    <div key={comment.id} className="p-4 pl-6 relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800"></div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-indigo-400 text-xs flex items-center gap-1">
                                                {comment.data.author || 'Anonymous'}
                                            </span>
                                            {comment.data.sentiment && (
                                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                                    {comment.data.sentiment}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-zinc-300 leading-relaxed mb-2">
                                            "{comment.data.content}"
                                        </div>
                                        {comment.data.link && (
                                            <a href={comment.data.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors uppercase tracking-wider font-medium">
                                                <Quote size={10} /> Source
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
