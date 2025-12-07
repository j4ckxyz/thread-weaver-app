import React from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { ConfigPanel } from './components/ConfigPanel';
import { InputHero } from './components/InputHero';
import { FlowBoard } from './components/FlowBoard';
import { ChatPanel } from './components/ChatPanel';

function App() {
  return (
    <AppProvider>
      <Layout>
        <ConfigPanel />
        <InputHero />
        <FlowBoard />
        <ChatPanel />
      </Layout>
    </AppProvider>
  );
}

export default App;
