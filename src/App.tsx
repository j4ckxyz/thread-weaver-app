import React from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { ConfigPanel } from './components/ConfigPanel';
import { InputHero } from './components/InputHero';
import { FlowBoard } from './components/FlowBoard';
import { FeedBoard } from './components/FeedBoard';
import { ChatPanel } from './components/ChatPanel';
import { LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

function App() {
  const [viewMode, setViewMode] = useState<'map' | 'feed'>('map');

  return (
    <AppProvider>
      <Layout>
        <ConfigPanel />
        <InputHero />

        {/* View Toggle */}
        <div className="flex justify-center mt-6 mb-4">
          <div className="bg-zinc-800 p-1 rounded-lg border border-zinc-700 flex gap-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <LayoutGrid size={16} /> Map View
            </button>
            <button
              onClick={() => setViewMode('feed')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'feed' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <List size={16} /> Feed View
            </button>
          </div>
        </div>

        {viewMode === 'map' ? <FlowBoard /> : <FeedBoard />}
        <ChatPanel />
      </Layout>
    </AppProvider>
  );
}

export default App;
