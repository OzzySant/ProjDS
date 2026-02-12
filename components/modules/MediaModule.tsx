import React, { useState } from 'react';
import { useProjection } from '../../context/ProjectionContext';
import { ProjectionType } from '../../types';
import { Search, Globe, Type, PlayCircle, ExternalLink, Eraser } from 'lucide-react';

const MediaModule: React.FC = () => {
  const { setProjection, clearProjection, setNavigationHandlers } = useProjection();
  const [searchQuery, setSearchQuery] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [title, setTitle] = useState('');

  const handleExternalSearch = (provider: 'google' | 'letras' | 'vagalume' | 'multitracks') => {
    let url = '';
    const query = encodeURIComponent(searchQuery);

    switch (provider) {
      case 'google':
        url = `https://www.google.com/search?q=${query}+letra`;
        break;
      case 'letras':
        url = `https://www.letras.mus.br/?q=${query}`;
        break;
      case 'vagalume':
        url = `https://www.vagalume.com.br/search.php?q=${query}`;
        break;
      case 'multitracks':
        url = `https://www.multitracks.com.br/search/?q=${query}`;
        break;
    }
    window.open(url, '_blank');
  };

  const slides = pastedText.split(/\n\s*\n/).filter(s => s.trim().length > 0);

  const handleSlideClick = (slide: string, index: number) => {
    setProjection({
        type: ProjectionType.LYRIC,
        content: slide,
        reference: title
    });

    const hasNext = index < slides.length - 1;
    const hasPrev = index > 0;

    setNavigationHandlers({
        onNext: hasNext ? () => handleSlideClick(slides[index + 1], index + 1) : undefined,
        onPrev: hasPrev ? () => handleSlideClick(slides[index - 1], index - 1) : undefined
    });
  };

  return (
    <div className="flex h-full bg-gray-800 text-gray-100">
      {/* Coluna de Pesquisa e Ferramentas (Esquerda) */}
      <div className="w-[40%] md:w-1/3 border-r border-gray-700 flex flex-col bg-gray-800/50 p-4 overflow-y-auto">
        
        <div className="mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-pink-400">
                <Globe size={20} /> Pesquisa Web
            </h2>
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Nome da música ou trecho..."
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExternalSearch('google')}
                />
                
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleExternalSearch('letras')}
                        className="bg-gray-700 hover:bg-orange-600 text-xs py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        Letras.mus <ExternalLink size={10}/>
                    </button>
                    <button 
                        onClick={() => handleExternalSearch('vagalume')}
                        className="bg-gray-700 hover:bg-green-600 text-xs py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        Vagalume <ExternalLink size={10}/>
                    </button>
                    <button 
                        onClick={() => handleExternalSearch('multitracks')}
                        className="bg-gray-700 hover:bg-blue-600 text-xs py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        MultiTracks <ExternalLink size={10}/>
                    </button>
                    <button 
                        onClick={() => handleExternalSearch('google')}
                        className="bg-gray-700 hover:bg-gray-600 text-xs py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        Google <ExternalLink size={10}/>
                    </button>
                </div>
            </div>
        </div>

        <div className="mt-auto border-t border-gray-700 pt-4">
             <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded text-xs text-blue-200">
                <strong>Como usar:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 opacity-80">
                    <li>Pesquise a música nos botões acima.</li>
                    <li>Copie a letra no site.</li>
                    <li>Cole no campo ao lado.</li>
                    <li>Separe os slides pulando uma linha.</li>
                </ol>
             </div>
        </div>
      </div>

      {/* Área de Colagem e Projeção (Direita) */}
      <div className="flex-1 flex flex-col bg-gray-900 p-4">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold flex items-center gap-2 text-pink-400">
                <Type size={20} /> Editor Rápido
            </h2>
            <div className="flex gap-2">
                 <button 
                    onClick={() => {setPastedText(''); setTitle(''); clearProjection();}}
                    className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800 transition-colors"
                    title="Limpar Tudo"
                >
                    <Eraser size={16} />
                </button>
                 <button 
                    onClick={clearProjection}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded text-xs font-semibold border border-red-600/30 whitespace-nowrap transition-colors"
                >
                    Limpar Tela
                </button>
            </div>
        </div>

        <input
            type="text"
            placeholder="Título (Opcional, ex: Artista - Música)"
            className="w-full bg-gray-800 border-b border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500 mb-2 font-semibold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
            className="w-full h-40 bg-gray-800 text-gray-300 p-3 text-sm rounded border border-gray-700 focus:outline-none focus:border-pink-500 font-mono resize-none mb-4"
            placeholder="Cole a letra aqui...&#10;&#10;Separe os slides com uma linha em branco."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto bg-gray-800/30 rounded border border-gray-700/50">
            {slides.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 text-xs">
                    O preview dos slides aparecerá aqui
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2 p-2">
                    {slides.map((slide, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSlideClick(slide, idx)}
                            className="text-left p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded group transition-all flex gap-3 hover:border-pink-500/50"
                        >
                            <span className="text-xs font-bold text-gray-500 group-hover:text-pink-400 pt-0.5 w-6">{idx + 1}</span>
                            <span className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{slide}</span>
                            <PlayCircle size={16} className="ml-auto text-gray-600 group-hover:text-pink-400 opacity-0 group-hover:opacity-100 self-center" />
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MediaModule;