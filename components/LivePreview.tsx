import React, { useRef, useState, useEffect } from 'react';
import { useProjection } from '../context/ProjectionContext';
import { ProjectionType } from '../types';
import { Cast, Monitor, Play, Pause, SkipBack, SkipForward, Eye, EyeOff } from 'lucide-react';

const LivePreview: React.FC = () => {
  const { 
    currentProjection, 
    settings, 
    isBlackout, 
    toggleBlackout, 
    navigationHandlers 
  } = useProjection();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Animation Buffer State
  const [displayedProjection, setDisplayedProjection] = useState(currentProjection);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate the scale to fit 1920x1080 into the available container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        const newScale = availableWidth / 1920;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Transition Animation Logic
  useEffect(() => {
    if (
      currentProjection.content !== displayedProjection.content ||
      currentProjection.reference !== displayedProjection.reference ||
      currentProjection.type !== displayedProjection.type
    ) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayedProjection(currentProjection);
        setIsAnimating(false);
      }, 150); 

      return () => clearTimeout(timer);
    }
  }, [currentProjection, displayedProjection]);

  // Auto-Play Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isAutoPlaying && navigationHandlers.onNext) {
      interval = setInterval(() => {
        if (navigationHandlers.onNext) {
          navigationHandlers.onNext();
        } else {
          setIsAutoPlaying(false);
        }
      }, 5000);
    } else if (!navigationHandlers.onNext) {
       setIsAutoPlaying(false);
    }

    return () => clearInterval(interval);
  }, [isAutoPlaying, navigationHandlers.onNext]);

  const handleOpenProjector = () => {
    const width = 1280;
    const height = 720;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
        `${window.location.protocol}//${window.location.host}${window.location.pathname}?view=projector`, 
        'ChurchPresenterProjector', 
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;

  // Estilo do Projetor (Fundo)
  const projectorStyle: React.CSSProperties = {
    width: `${BASE_WIDTH}px`,
    height: `${BASE_HEIGHT}px`,
    // Se tiver imagem, usa transparente para mostrar a div da imagem, senão usa preto
    backgroundColor: 'black', 
    backgroundImage: settings.bgImage ? `url(${settings.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'Georgia, serif',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    overflow: 'hidden', 
  };

  return (
    <div className="bg-gray-950 p-2 md:p-3 border-l border-gray-800 flex flex-col h-full overflow-hidden relative">
      <div className="flex justify-between items-center mb-2 text-gray-400 shrink-0">
        <h3 className="font-bold flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBlackout ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isBlackout ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
            </span>
            {isBlackout ? 'DESCANSO (LOGO)' : 'AO VIVO'}
        </h3>
        
        <div className="flex gap-3">
            <button 
                onClick={() => toggleBlackout()}
                title={isBlackout ? "Mostrar Texto" : "Ocultar Texto (Modo Descanso)"}
                className={`hover:text-white cursor-pointer bg-transparent border-none p-1 flex items-center transition-colors ${isBlackout ? 'text-yellow-500' : 'text-gray-500'}`}
            >
                {isBlackout ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>

            <button 
                onClick={handleOpenProjector}
                title="Abrir Janela do Projetor" 
                className="hover:text-white cursor-pointer bg-transparent border-none p-1 flex items-center text-blue-500 hover:text-blue-400 transition-colors"
            >
                <Cast size={22} />
            </button>
        </div>
      </div>

      {/* 
        The "Scene" Container. 
      */}
      <div 
        ref={containerRef}
        className="w-full relative bg-black rounded overflow-hidden shadow-2xl border border-gray-800 group transition-all duration-300"
        style={{ aspectRatio: '16/9', borderColor: isBlackout ? '#eab308' : '#ef4444' }}
      >
        <div 
            className="absolute top-0 left-0 transition-opacity duration-300"
            style={{...projectorStyle}}
        >
          {settings.bgImage && <div className="absolute inset-0 bg-black/40 z-0"></div>}

          {/* 
              Content Container:
              - Se isBlackout for true, a opacidade vai para 0 (Esconde o texto), mas o fundo acima permanece.
          */}
          <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${isAnimating || isBlackout ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            
            {/* IDLE STATE */}
            {displayedProjection.type === ProjectionType.IDLE && (
              <div className="flex flex-col items-center opacity-90 animate-fade-in">
                <div className="w-48 h-48 border-8 border-white/20 rounded-full flex items-center justify-center mb-8">
                   <Monitor size={80} className="text-white/50" />
                </div>
                <h1 className="text-white/80 text-6xl font-bold tracking-[0.2em] uppercase drop-shadow-lg">Bem-Vindo</h1>
              </div>
            )}

            {/* TEXT / LYRICS STATE */}
            {(displayedProjection.type === ProjectionType.TEXT || displayedProjection.type === ProjectionType.LYRIC) && (
               <div className="w-full h-full flex flex-col items-center justify-center p-[80px]">
                  <div className="flex-1 flex items-center justify-center w-full">
                    <p 
                        className="text-center text-white font-semibold drop-shadow-2xl whitespace-pre-wrap leading-tight max-w-[90%]"
                        style={{ fontSize: `${settings.fontSize}px` }}
                    >
                        {displayedProjection.content}
                    </p>
                  </div>
                  
                  {displayedProjection.reference && (
                      <div className="h-[100px] flex items-end">
                        <p 
                          className="text-yellow-400 font-sans font-medium tracking-wide drop-shadow-lg opacity-90"
                          style={{ fontSize: `${settings.fontSize * 0.45}px` }}
                        >
                            {displayedProjection.reference}
                        </p>
                      </div>
                  )}
               </div>
            )}
          </div>
        </div>
        
        {/* Info Overlay */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            1080p {isAutoPlaying && " | Auto 5s"} {isBlackout && " | MODO DESCANSO"}
        </div>
      </div>

      {/* Control Bar (Footer) */}
      <div className="mt-auto pt-4 pb-2">
        <div className="flex items-center justify-center gap-3 select-none">
            
            {/* 1. Anterior */}
            <button 
                onClick={navigationHandlers.onPrev}
                disabled={!navigationHandlers.onPrev}
                className="h-14 w-16 flex items-center justify-center border-2 border-white/20 rounded-lg hover:bg-white/10 hover:border-white/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/20 active:scale-95 transition-all text-white"
            >
                <SkipBack className="w-8 h-8 fill-current" />
            </button>

            {/* 2. Pause (Stop Timer) */}
            <button 
                onClick={() => setIsAutoPlaying(false)}
                className={`h-14 w-16 flex items-center justify-center border-2 rounded-lg transition-all active:scale-95 ${
                    !isAutoPlaying 
                    ? 'border-white text-white bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                    : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'
                }`}
            >
                <Pause className="w-8 h-8 fill-current" />
            </button>

            {/* 3. Play (Start Timer) */}
            <button 
                onClick={() => {
                    setIsAutoPlaying(true);
                }}
                disabled={!navigationHandlers.onNext}
                className={`h-14 w-16 flex items-center justify-center border-2 rounded-lg transition-all active:scale-95 ${
                    isAutoPlaying 
                    ? 'border-green-500 text-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                    : 'border-white/20 text-gray-400 hover:text-green-400 hover:border-green-500/50'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
                <Play className="w-8 h-8 fill-current" />
            </button>

            {/* 4. Próximo */}
            <button 
                onClick={navigationHandlers.onNext}
                disabled={!navigationHandlers.onNext}
                className="h-14 w-16 flex items-center justify-center border-2 border-white/20 rounded-lg hover:bg-white/10 hover:border-white/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/20 active:scale-95 transition-all text-white"
            >
                <SkipForward className="w-8 h-8 fill-current" />
            </button>

        </div>
      </div>
    </div>
  );
};

export default LivePreview;