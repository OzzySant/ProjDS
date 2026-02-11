import React, { useState, useEffect, useCallback } from 'react';
import { API_URLS } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { ProjectionType, Hymn } from '../../types';
import { Music, Search, PlayCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const HymnalModule: React.FC = () => {
  const { setProjection, clearProjection } = useProjection();
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);

  const fetchHarpa = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
          const response = await fetch(API_URLS.HARPA);
          if (!response.ok) {
             throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          // Ensure data has the expected structure
          if (Array.isArray(data) && data.length > 0) {
              setHymns(data);
          } else {
             throw new Error('Formato de dados inválido ou vazio.');
          }
      } catch (err: any) {
          console.error(err);
          const msg = err.message || "Erro desconhecido";
          setError(`Falha ao carregar Harpa: ${msg}. Verifique sua conexão.`);
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchHarpa();
  }, [fetchHarpa]);

  const filteredHymns = hymns.filter(
    (h) => h.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || h.numero.toString().includes(searchTerm)
  );

  // Helper to split raw lyrics into slides/stanzas
  const getStanzas = (rawLyrics: string) => {
      // Common JSON format uses \n\n for stanza breaks or just \n for lines.
      // We try to split by double newline first.
      let parts = rawLyrics.split('\n\n');
      if (parts.length === 1) {
          // Fallback: If no double newlines, try to group every 4 lines? 
          // Or just return the whole thing if it's short.
          if(parts[0].length > 200) {
              // naive split if too long
              return [parts[0]]; 
          }
      }
      return parts.filter(p => p.trim().length > 0);
  };

  const handleLyricClick = (stanza: string, index: number) => {
    if (!selectedHymn) return;
    setProjection({
      type: ProjectionType.LYRIC,
      content: stanza,
      reference: `${selectedHymn.numero}. ${selectedHymn.titulo}`,
    });
  };

  return (
    <div className="flex h-full bg-gray-800">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col bg-gray-800/50">
        <div className="p-4 border-b border-gray-700 bg-gray-900">
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 mb-4">
                <Music size={20} className="text-purple-400"/> Harpa Cristã
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input
                    type="text"
                    placeholder="Buscar número ou título..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center text-purple-400">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-sm">Baixando Hinos...</span>
            </div>
        ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-red-400">
                <AlertCircle size={32} className="mb-2 opacity-50"/>
                <p className="text-sm mb-4 font-medium">{error}</p>
                <button 
                    onClick={fetchHarpa} 
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-500/30 text-xs font-bold uppercase tracking-wide"
                >
                    <RefreshCw size={14}/> Tentar Novamente
                </button>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto">
            {filteredHymns.map((hymn) => (
                <button
                key={hymn.numero}
                onClick={() => setSelectedHymn(hymn)}
                className={`w-full text-left px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700 transition-colors flex justify-between items-center ${
                    selectedHymn?.numero === hymn.numero ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''
                }`}
                >
                <div className="truncate pr-2">
                    <span className="font-bold text-gray-500 mr-3 text-xs">#{hymn.numero}</span>
                    <span className={`font-medium truncate ${selectedHymn?.numero === hymn.numero ? 'text-purple-300' : 'text-gray-300'}`}>
                        {hymn.titulo}
                    </span>
                </div>
                </button>
            ))}
            </div>
        )}
      </div>

      {/* Lyrics Preview Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center h-16 bg-gray-900 shadow-sm">
            {selectedHymn ? (
                 <h3 className="text-lg font-semibold text-gray-100 truncate pr-4">
                     <span className="text-purple-400 font-bold mr-2">{selectedHymn.numero}.</span>
                     {selectedHymn.titulo}
                 </h3>
            ) : <div></div>}
             <button 
                onClick={clearProjection}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-600/30 whitespace-nowrap"
            >
                Limpar Tela
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selectedHymn ? (
            getStanzas(selectedHymn.letra).map((stanza, idx) => (
              <div key={idx} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                <div className="bg-gray-700/50 px-4 py-2 flex justify-between items-center border-b border-gray-700/50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estrofe {idx + 1}</span>
                    <button 
                        onClick={() => handleLyricClick(stanza, idx)}
                        className="flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-full transition-colors font-medium shadow-md shadow-purple-900/20"
                    >
                        <PlayCircle size={12} /> Projetar
                    </button>
                </div>
                <div 
                    onClick={() => handleLyricClick(stanza, idx)}
                    className="p-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
                >
                  <p className="text-lg text-gray-300 leading-8 whitespace-pre-wrap font-serif text-center">{stanza}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Music size={64} className="opacity-20 mb-4"/>
                <p>Selecione um hino para ver a letra</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HymnalModule;