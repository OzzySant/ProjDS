import React, { useState, useEffect } from 'react';
import { ProjectionProvider } from './context/ProjectionContext';
import Sidebar from './components/Sidebar';
import BibleModule from './components/modules/BibleModule';
import HymnalModule from './components/modules/HymnalModule';
import SettingsModule from './components/modules/SettingsModule';
import LivePreview from './components/LivePreview';
import { Smartphone, RotateCcw } from 'lucide-react';

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
        <h1 className="text-2xl font-bold mb-2">Por favor, gire seu dispositivo</h1>
        <p className="text-gray-400 max-w-xs">
          O Mobile Church Presenter foi desenhado para modo Paisagem (Landscape) para simular o ambiente de projeção.
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
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-800">
                <Smartphone size={48} className="mb-4 opacity-50"/>
                <p>Módulo de Mídia em breve</p>
            </div>
        );
      default:
        return <BibleModule />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden select-none">
      {/* 1. Sidebar (Navigation) */}
      <Sidebar currentModule={currentModule} onModuleChange={setCurrentModule} />

      {/* 2. Main Control Area (Center) */}
      <main className="flex-1 min-w-0 bg-gray-800 border-r border-gray-900 relative">
        {renderModule()}
      </main>

      {/* 3. Live View (Right - Fixed Width for Desktop feel) */}
      <aside className="w-[400px] bg-gray-950 flex-shrink-0 z-10 shadow-2xl">
        <LivePreview />
      </aside>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProjectionProvider>
      <MainLayout />
    </ProjectionProvider>
  );
};

export default App;