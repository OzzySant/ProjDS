import React, { useState, useEffect } from 'react';
import { API_URLS, BIBLE_VERSIONS } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { ProjectionType, BibleBook } from '../../types';
import { ChevronRight, Search, BookOpen, Loader2, RefreshCw } from 'lucide-react';

const BibleModule: React.FC = () => {
  const { setProjection, clearProjection } = useProjection();
  
  // State for Data
  const [bibleData, setBibleData] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string>('nvi');

  // State for Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);

  // Fetch Bible Data
  useEffect(() => {
    const fetchBible = async () => {
      setLoading(true);
      setError(null);
      try {
        // @ts-ignore - access key dynamically
        const url = API_URLS.BIBLE[version.toUpperCase()];
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao carregar bíblia');
        const data: BibleBook[] = await response.json();
        setBibleData(data);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar versão. Verifique a internet.');
      } finally {
        setLoading(false);
      }
    };

    fetchBible();
    // Reset selection on version change
    setSelectedBookIndex(null);
    setSelectedChapterIndex(null);
  }, [version]);

  const handleBookSelect = (index: number) => {
    setSelectedBookIndex(index);
    setSelectedChapterIndex(null);
  };

  const handleChapterSelect = (chapterIndex: number) => {
    setSelectedChapterIndex(chapterIndex);
  };

  const handleVerseClick = (verseText: string, verseNum: number) => {
    if (selectedBookIndex === null || selectedChapterIndex === null) return;
    const bookName = bibleData[selectedBookIndex].name;
    const chapterNum = selectedChapterIndex + 1;
    
    setProjection({
      type: ProjectionType.TEXT,
      content: verseText,
      reference: `${bookName} ${chapterNum}:${verseNum}`,
    });
  };

  const filteredBooks = bibleData.map((b, i) => ({...b, originalIndex: i})).filter(
      b => b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentBook = selectedBookIndex !== null ? bibleData[selectedBookIndex] : null;
  const currentChapters = currentBook ? currentBook.chapters : [];
  const currentVerses = (currentBook && selectedChapterIndex !== null) 
    ? currentBook.chapters[selectedChapterIndex] 
    : [];

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shadow-sm">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-blue-400"/> Bíblia
            </h2>
            <select 
                value={version} 
                onChange={(e) => setVersion(e.target.value)}
                className="bg-gray-800 text-sm border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-gray-300"
            >
                {BIBLE_VERSIONS.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                ))}
            </select>
        </div>
        
        <button 
            onClick={clearProjection}
            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-600/30"
        >
            Limpar Tela
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-blue-400">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p>Carregando {version.toUpperCase()}...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400">
            <p className="mb-4">{error}</p>
            <button onClick={() => setVersion(version)} className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded">
                <RefreshCw size={16}/> Tentar Novamente
            </button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
            {/* Books Column */}
            <div className="w-1/4 border-r border-gray-700 overflow-y-auto bg-gray-800/50">
                <div className="p-2 sticky top-0 bg-gray-800/95 backdrop-blur z-10 border-b border-gray-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar livro..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                    </div>
                </div>
            {filteredBooks.map((book) => (
                <button
                key={book.abbrev}
                onClick={() => handleBookSelect(book.originalIndex)}
                className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center hover:bg-gray-700 transition-colors ${
                    selectedBookIndex === book.originalIndex ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-gray-300'
                }`}
                >
                <span>{book.name}</span>
                {selectedBookIndex === book.originalIndex && <ChevronRight size={14} />}
                </button>
            ))}
            </div>

            {/* Chapters Column */}
            <div className="w-1/6 border-r border-gray-700 overflow-y-auto bg-gray-800/30">
            {selectedBookIndex !== null ? (
                <div className="grid grid-cols-1 gap-1 p-2">
                {currentChapters.map((_, idx) => (
                    <button
                    key={idx}
                    onClick={() => handleChapterSelect(idx)}
                    className={`py-2 px-1 text-center rounded text-sm font-medium transition-colors ${
                        selectedChapterIndex === idx ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-gray-700 text-gray-300'
                    }`}
                    >
                    {idx + 1}
                    </button>
                ))}
                </div>
            ) : (
                <div className="p-4 text-center text-gray-500 text-sm mt-10">Selecione um livro</div>
            )}
            </div>

            {/* Verses Column */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
            {selectedChapterIndex !== null ? (
                <div className="space-y-2">
                <div className="mb-4 pb-2 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                    <h3 className="text-lg font-semibold text-gray-200">
                        {currentBook?.name} <span className="text-blue-500">{selectedChapterIndex + 1}</span>
                    </h3>
                </div>
                {currentVerses.map((verseText, idx) => (
                    <button
                    key={idx}
                    onClick={() => handleVerseClick(verseText, idx + 1)}
                    className="w-full text-left p-4 rounded-lg hover:bg-gray-800 group transition-all duration-200 border border-transparent hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    <div className="flex gap-3">
                        <span className="text-xs font-bold text-gray-500 pt-1 w-6 shrink-0 group-hover:text-blue-400">{idx + 1}</span>
                        <p className="text-gray-300 group-hover:text-white leading-relaxed text-base">{verseText}</p>
                    </div>
                    </button>
                ))}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <BookOpen size={48} className="opacity-20 mb-4" />
                    <p>Selecione um capítulo para ver os versículos</p>
                </div>
            )}
            </div>
        </div>
      )}
    </div>
  );
};

export default BibleModule;