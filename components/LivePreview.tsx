import React, { useRef, useState, useEffect } from 'react';
import { useProjection } from '../context/ProjectionContext';
import { ProjectionType } from '../types';
import { Cast, Monitor } from 'lucide-react';

const LivePreview: React.FC = () => {
  const { currentProjection, settings } = useProjection();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  // Calculate the scale to fit 1920x1080 into the available container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        // We want to fit a 1920px wide screen into the available width
        const newScale = availableWidth / 1920;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Standard Full HD Resolution
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;

  const projectorStyle: React.CSSProperties = {
    width: `${BASE_WIDTH}px`,
    height: `${BASE_HEIGHT}px`,
    backgroundColor: settings.bgImage ? 'transparent' : 'black',
    backgroundImage: settings.bgImage ? `url(${settings.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'Georgia, serif',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    overflow: 'hidden', // Ensure no spillover
  };

  return (
    <div className="bg-gray-950 p-4 border-l border-gray-800 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 text-gray-400">
        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Saída ao Vivo
        </h3>
        <div className="flex gap-2">
             <Cast size={16} title="Transmitir" className="hover:text-white cursor-pointer"/>
        </div>
      </div>

      {/* 
        The "Scene" Container. 
        Aspect Ratio is maintained by the parent div height calculation or manually via aspect-video.
      */}
      <div 
        ref={containerRef}
        className="w-full relative bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800 group"
        style={{ aspectRatio: '16/9' }}
      >
        {/* The Scaled Projector View (1920x1080 virtual resolution) */}
        <div 
            className="absolute top-0 left-0"
            style={projectorStyle}
        >
          {/* Dark Overlay for text readability */}
          {settings.bgImage && <div className="absolute inset-0 bg-black/40 z-0"></div>}

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            
            {/* IDLE STATE */}
            {currentProjection.type === ProjectionType.IDLE && (
              <div className="flex flex-col items-center opacity-90 animate-fade-in">
                <div className="w-48 h-48 border-8 border-white/20 rounded-full flex items-center justify-center mb-8">
                   <Monitor size={80} className="text-white/50" />
                </div>
                <h1 className="text-white/80 text-6xl font-bold tracking-[0.2em] uppercase drop-shadow-lg">Bem-Vindo</h1>
              </div>
            )}

            {/* TEXT / LYRICS STATE */}
            {(currentProjection.type === ProjectionType.TEXT || currentProjection.type === ProjectionType.LYRIC) && (
               <div className="w-full h-full flex flex-col items-center justify-center p-[80px]">
                  <div className="flex-1 flex items-center justify-center w-full">
                    <p 
                        className="text-center text-white font-semibold drop-shadow-2xl whitespace-pre-wrap leading-tight max-w-[90%]"
                        style={{ fontSize: `${settings.fontSize}px` }}
                    >
                        {currentProjection.content}
                    </p>
                  </div>
                  
                  {currentProjection.reference && (
                      <div className="h-[100px] flex items-end">
                        <p 
                          className="text-yellow-400 font-sans font-medium tracking-wide drop-shadow-lg opacity-90"
                          style={{ fontSize: `${settings.fontSize * 0.45}px` }}
                        >
                            {currentProjection.reference}
                        </p>
                      </div>
                  )}
               </div>
            )}
          </div>
        </div>
        
        {/* Info Overlay (UI only, not projected) */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            1920x1080 Scaled {(scale * 100).toFixed(0)}%
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-xs text-gray-500">
        <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-400">Status da Projeção</span>
            <span className="flex items-center gap-1 text-green-500"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Ativo</span>
        </div>
        <div className="grid grid-cols-2 gap-y-1 gap-x-4">
            <div>Tipo: <span className="text-gray-300">{currentProjection.type}</span></div>
            <div>Resolução: <span className="text-gray-300">1080p</span></div>
            <div>Fonte: <span className="text-gray-300">{settings.fontSize}px</span></div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;