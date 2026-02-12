import React, { useState, useEffect } from 'react';
import { ProjectionProvider } from './context/ProjectionContext';
import Sidebar from './components/Sidebar';
import BibleModule from './components/modules/BibleModule';
import HymnalModule from './components/modules/HymnalModule';
import SettingsModule from './components/modules/SettingsModule';
import MediaModule from './components/modules/MediaModule';
import LivePreview from './components/LivePreview';
import ProjectorView from './components/ProjectorView';
import { RotateCcw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<'bible' | 'hymn' | 'media' | 'settings'>('bible');
  const [isPortrait, setIsPortrait] = useState(false);

  // Check orientation logic
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (isPortrait) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="bg-gray-800 p-6 rounded-full mb-6 animate-pulse">
            <RotateCcw size={48} className="text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Gire seu dispositivo</h1>
        <p className="text-gray-400 max-w-xs text-sm">
          Este app foi otimizado para uso em Paisagem (Landscape) para controlar a projeção.
        </p>
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'bible':
        return <BibleModule />;
      case 'hymn':
        return <HymnalModule />;
      case 'settings':
        return <SettingsModule />;
      case 'media':
        return <MediaModule />;
      default:
        return <BibleModule />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden select-none text-sm md:text-base">
      {/* 1. Sidebar (Navigation) - Fixed width defined in component */}
      <Sidebar currentModule={currentModule} onModuleChange={setCurrentModule} />

      {/* 2. Main Control Area (Center) - Takes remaining space */}
      <main className="flex-1 min-w-0 bg-gray-800 border-r border-gray-900 relative flex flex-col">
        {renderModule()}
      </main>

      {/* 3. Live Preview (Right) - Responsive Width */}
      <aside className="w-[35%] max-w-[400px] min-w-[240px] bg-gray-950 flex-shrink-0 z-10 shadow-2xl flex flex-col border-l border-gray-900">
        <LivePreview />
      </aside>
    </div>
  );
};

const App: React.FC = () => {
  // Simple "Routing" Check
  const [isProjectorView, setIsProjectorView] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'projector') {
        setIsProjectorView(true);
    }
  }, []);

  if (isProjectorView) {
      return <ProjectorView />;
  }

  return (
    <ProjectionProvider>
      <MainLayout />
    </ProjectionProvider>
  );
};

export default App;