import React, { useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    ConnectionLineType
} from 'reactflow';
import type { NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import { useApp } from '../context/AppContext';
import { MessageSquare, Quote, Hash, Maximize2, Minimize2 } from 'lucide-react';

// --- Custom Nodes ---

const TopicNode = ({ data }: any) => {
    return (
        <div className="glass-panel p-4 rounded-xl min-w-[250px] max-w-[300px] border-l-4 border-l-indigo-500 shadow-lg shadow-indigo-500/20">
            <Handle type="target" position={Position.Top} className="!bg-indigo-500" />
            <div className="flex items-center gap-2 mb-2">
                <Hash size={16} className="text-white opacity-80" />
                <h3 className="font-bold text-white text-lg">{data.label}</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{data.content}</p>
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
        </div>
    );
};

const CommentNode = ({ data }: any) => {
    return (
        <div className="glass-panel p-3 rounded-lg min-w-[300px] max-w-[400px] border border-zinc-700/50 hover:border-indigo-500/50 transition-colors">
            <Handle type="target" position={Position.Top} className="!bg-zinc-500" />
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-indigo-300 flex items-center gap-1">
                    <MessageSquare size={10} className="text-indigo-400" /> {data.author}
                </span>
                {data.sentiment && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900 px-1 rounded">
                        {data.sentiment}
                    </span>
                )}
            </div>
            <div className="text-sm text-zinc-300 italic mb-2 relative pl-3 border-l-2 border-zinc-600">
                "{data.content}"
            </div>
            {data.link && (
                <a href={data.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Quote size={10} /> View Source
                </a>
            )}
        </div>
    );
};

const nodeTypes: NodeTypes = {
    topic: TopicNode,
    comment: CommentNode,
};

// --- Flow Board ---

export const FlowBoard: React.FC = () => {
    const { flowData } = useApp();

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [density, setDensity] = useState(100);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Highlighting Logic
    const { highlightNodes, highlightEdges } = useMemo(() => {
        if (!selectedNodeId || !flowData) return { highlightNodes: new Set<string>(), highlightEdges: new Set<string>() };

        const connectedNodeIds = new Set<string>();
        const connectedEdgeIds = new Set<string>();

        connectedNodeIds.add(selectedNodeId);

        flowData.edges.forEach(edge => {
            if (edge.source === selectedNodeId) {
                connectedNodeIds.add(edge.target);
                connectedEdgeIds.add(edge.id);
            } else if (edge.target === selectedNodeId) {
                connectedNodeIds.add(edge.source);
                connectedEdgeIds.add(edge.id);
            }
        });

        return { highlightNodes: connectedNodeIds, highlightEdges: connectedEdgeIds };
    }, [selectedNodeId, flowData]);

    const visibleNodes = useMemo(() => {
        if (!flowData) return [];
        let nodes = flowData.nodes;

        // Density filter
        if (density !== 100) {
            const essentialNodes = nodes.filter(n => n.type !== 'comment');
            const commentNodes = nodes.filter(n => n.type === 'comment');
            const countToShow = Math.floor(commentNodes.length * (density / 100));
            nodes = [...essentialNodes, ...commentNodes.slice(0, countToShow)];
        }

        // Apply highlighting styles (opacity)
        return nodes.map(node => ({
            ...node,
            style: {
                ...node.style,
                opacity: selectedNodeId ? (highlightNodes.has(node.id) ? 1 : 0.1) : 1,
                transition: 'opacity 0.3s ease'
            }
        }));
    }, [flowData?.nodes, density, selectedNodeId, highlightNodes]);

    const visibleEdges = useMemo(() => {
        if (!flowData) return [];
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

        let edges = flowData.edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

        // Apply highlighting styles to edges
        return edges.map(edge => ({
            ...edge,
            animated: selectedNodeId ? highlightEdges.has(edge.id) : edge.animated,
            style: {
                ...edge.style,
                stroke: selectedNodeId
                    ? (highlightEdges.has(edge.id) ? '#6366f1' : '#3f3f46')
                    : edge.style?.stroke,
                opacity: selectedNodeId ? (highlightEdges.has(edge.id) ? 1 : 0.1) : 1,
                strokeWidth: selectedNodeId && highlightEdges.has(edge.id) ? 3 : 1
            }
        }));
    }, [flowData?.edges, visibleNodes, selectedNodeId, highlightEdges]);

    // If no data, show nothing
    if (!flowData) return null;

    return (
        <div className={`transition-all duration-500 ease-in-out ${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950' : 'w-full h-[600px] rounded-2xl mt-8 relative'} overflow-hidden glass-panel border border-zinc-700/50 animate-fade-in group`}>
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {/* Density Slider */}
                <div className="bg-zinc-800/80 p-2 rounded-lg backdrop-blur flex items-center gap-3 border border-zinc-700">
                    <span className="text-xs text-zinc-400 font-medium">Density</span>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={density}
                        onChange={(e) => setDensity(Number(e.target.value))}
                        className="w-24 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title="Adjust Detail Level"
                    />
                </div>
                {/* Fullscreen Toggle */}
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="bg-zinc-800/80 p-2 rounded-lg text-white hover:bg-indigo-600 transition-colors border border-zinc-700"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>

            <ReactFlow
                key={`flow-${flowData.nodes.length}-${density}`} // Remount on major changes
                nodes={visibleNodes}
                edges={visibleEdges}
                nodeTypes={nodeTypes}
                fitView
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                attributionPosition="bottom-right"
                connectionLineType={ConnectionLineType.SmoothStep}
                minZoom={0.1}
            >
                <Background color="#27272a" gap={20} size={1} />
                <Controls className="!bg-zinc-800 !border-zinc-700 !fill-white" />
                <MiniMap
                    nodeColor={() => '#6366f1'}
                    maskColor="rgba(9, 9, 11, 0.6)"
                    className="!bg-zinc-900 !border-zinc-800"
                />
            </ReactFlow>
        </div>
    );
};
