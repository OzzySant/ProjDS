import React, { useState, useEffect } from 'react';
import { BIBLE_VERSIONS, BIBLE_API_URLS } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { ProjectionType, BibleBook } from '../../types';
import { ChevronRight, Search, BookOpen, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getResource, saveResource } from '../../utils/db';

// Importação dos dados Offline (Placeholders ou dados colados manualmente)
import { BIBLE_NVI } from '../../data/bible_nvi';
import { BIBLE_ACF } from '../../data/bible_acf';
import { BIBLE_AA } from '../../data/bible_aa';

const BibleModule: React.FC = () => {
  const { setProjection, clearProjection, setNavigationHandlers } = useProjection();
  
  const [version, setVersion] = useState<string>('nvi');
  const [activeBibleData, setActiveBibleData] = useState<BibleBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  // Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);

  // Função para baixar com tentativas (Mirrors)
  const fetchWithFailover = async (urls: string[]) => {
    let lastError: any = null;
    for (const url of urls) {
        try {
            console.log(`Tentando baixar de: ${url}`);
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
                return await response.json();
            }
            console.warn(`Falha (HTTP ${response.status}) em: ${url}`);
            lastError = `HTTP ${response.status}`;
        } catch (e) {
            console.warn(`Erro de conexão em: ${url}`, e);
            lastError = e;
        }
    }
    throw new Error(`Todas as fontes falharam. Último erro: ${lastError}`);
  };

  const loadData = async (forceDownload = false) => {
    setIsLoading(true);
    setDownloadStatus(null);
    setSelectedBookIndex(null);
    setSelectedChapterIndex(null);

    // 1. Identificar qual arquivo local corresponde à versão
    let localFile: BibleBook[] = [];
    switch (version) {
      case 'nvi': localFile = BIBLE_NVI; break;
      case 'acf': localFile = BIBLE_ACF; break;
      case 'aa': localFile = BIBLE_AA; break;
    }

    // 2. Se o arquivo local tiver mais de 5 livros, usamos ele (prioridade máxima).
    if (localFile.length > 5) {
      setActiveBibleData(localFile);
      setIsLoading(false);
      return;
    }

    // 3. Verifica Cache (IndexedDB)
    if (!forceDownload) {
        try {
            const cached = await getResource(`bible_${version}`);
            if (cached && Array.isArray(cached) && cached.length > 5) {
                setActiveBibleData(cached);
                setIsLoading(false);
                return;
            }
        } catch (e) {
            console.warn("Erro ao ler DB", e);
        }
    }

    // 4. Baixa da Lista de Mirrors
    setDownloadStatus("Buscando fontes online...");
    const urls = BIBLE_API_URLS[version] || [];

    try {
      const json = await fetchWithFailover(urls);
      
      // Validação básica do JSON
      if (!Array.isArray(json) || json.length === 0) throw new Error("JSON baixado é inválido");

      await saveResource(`bible_${version}`, json);
      setActiveBibleData(json);
      setDownloadStatus(null);
    } catch (err) {
      console.error("Falha fatal no download", err);
      setDownloadStatus("Offline (Fontes Indisponíveis)");
      setActiveBibleData(localFile); // Fallback para o placeholder local
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega ao iniciar ou mudar versão
  useEffect(() => {
    loadData();
  }, [version]);

  const handleBookSelect = (index: number) => {
    setSelectedBookIndex(index);
    setSelectedChapterIndex(null);
  };

  const handleChapterSelect = (chapterIndex: number) => {
    setSelectedChapterIndex(chapterIndex);
  };

  const handleVerseClick = (verseText: string, verseNum: number, currentVersesList: string[]) => {
    if (selectedBookIndex === null || selectedChapterIndex === null) return;
    const bookName = activeBibleData[selectedBookIndex].name;
    const chapterNum = selectedChapterIndex + 1;
    
    // Projeção
    setProjection({
      type: ProjectionType.TEXT,
      content: verseText,
      reference: `${bookName} ${chapterNum}:${verseNum}`,
    });

    // Lógica de Próximo/Anterior
    const hasNext = verseNum < currentVersesList.length;
    const hasPrev = verseNum > 1;

    setNavigationHandlers({
        onNext: hasNext ? () => handleVerseClick(currentVersesList[verseNum], verseNum + 1, currentVersesList) : undefined,
        onPrev: hasPrev ? () => handleVerseClick(currentVersesList[verseNum - 2], verseNum - 1, currentVersesList) : undefined
    });
  };

  const filteredBooks = activeBibleData.map((b, i) => ({...b, originalIndex: i})).filter(
      b => b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentBook = selectedBookIndex !== null ? activeBibleData[selectedBookIndex] : null;
  const currentChapters = currentBook ? currentBook.chapters : [];
  const currentVerses = (currentBook && selectedChapterIndex !== null) 
    ? currentBook.chapters[selectedChapterIndex] 
    : [];

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-100">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center bg-gray-900 shadow-sm shrink-0 h-12">
        <div className="flex items-center gap-3">
            <h2 className="text-base font-bold flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400"/> <span className="hidden md:inline">Bíblia</span>
            </h2>
            <select 
                value={version} 
                onChange={(e) => setVersion(e.target.value)}
                className="bg-gray-800 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-gray-300"
            >
                {BIBLE_VERSIONS.map(v => (
                    <option key={v.id} value={v.id}>{v.label.split('(')[0]}</option>
                ))}
            </select>
            
            {isLoading ? (
                <span className="text-[10px] text-yellow-500 flex items-center gap-1 animate-pulse">
                    <Loader2 size={10} className="animate-spin"/> {downloadStatus || "Carregando..."}
                </span>
            ) : activeBibleData.length > 5 ? (
                <span className="text-[10px] bg-green-600/20 text-green-500 px-2 py-0.5 rounded border border-green-600/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> {activeBibleData === BIBLE_NVI || activeBibleData === BIBLE_ACF || activeBibleData === BIBLE_AA ? "Local" : "DB Online"}
                </span>
            ) : (
                <button 
                    onClick={() => loadData(true)}
                    className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-600/30 flex items-center gap-1 hover:bg-red-600/40 transition-colors"
                    title="Clique para tentar baixar novamente"
                >
                    <AlertTriangle size={10} /> {downloadStatus || "Falha"}
                </button>
            )}
        </div>
        
        <button 
            onClick={clearProjection}
            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded text-xs font-semibold transition-colors border border-red-600/30 whitespace-nowrap"
        >
            Limpar
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Books Column */}
        <div className="w-[30%] border-r border-gray-700 overflow-y-auto bg-gray-800/50 flex flex-col">
            <div className="p-2 sticky top-0 bg-gray-800/95 backdrop-blur z-10 border-b border-gray-700/50 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
                    <input 
                        type="text" 
                        placeholder="Livro..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                    />
                </div>
            </div>
            <div className="flex-1">
                {filteredBooks.length === 0 && !isLoading && (
                    <div className="p-4 text-center text-gray-500 text-xs">
                        Nenhum livro encontrado.
                    </div>
                )}
                {filteredBooks.map((book) => (
                    <button
                    key={book.abbrev}
                    onClick={() => handleBookSelect(book.originalIndex)}
                    className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center hover:bg-gray-700 transition-colors ${
                        selectedBookIndex === book.originalIndex ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500' : 'text-gray-300'
                    }`}
                    >
                    <span className="truncate">{book.name}</span>
                    {selectedBookIndex === book.originalIndex && <ChevronRight size={12} />}
                    </button>
                ))}
            </div>
        </div>

        {/* Chapters Column */}
        <div className="w-[15%] border-r border-gray-700 overflow-y-auto bg-gray-800/30">
        {selectedBookIndex !== null ? (
            <div className="grid grid-cols-1 gap-1 p-1">
            {currentChapters.map((_, idx) => (
                <button
                key={idx}
                onClick={() => handleChapterSelect(idx)}
                className={`py-2 px-1 text-center rounded text-xs font-medium transition-colors ${
                    selectedChapterIndex === idx ? 'bg-blue-500 text-white shadow shadow-blue-500/30' : 'hover:bg-gray-700 text-gray-300'
                }`}
                >
                {idx + 1}
                </button>
            ))}
            </div>
        ) : (
            <div className="p-4 text-center text-gray-600 text-[10px] mt-10">Livro?</div>
        )}
        </div>

        {/* Verses Column */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
        {selectedChapterIndex !== null ? (
            <div className="space-y-1 p-2">
            <div className="mb-2 pb-2 border-b border-gray-800 sticky top-0 bg-gray-900 z-10 flex items-baseline gap-2">
                <h3 className="text-base font-semibold text-gray-200">
                    {currentBook?.name}
                </h3>
                <span className="text-xl font-bold text-blue-500">{selectedChapterIndex + 1}</span>
            </div>
            {currentVerses.map((verseText, idx) => (
                <button
                key={idx}
                onClick={() => handleVerseClick(verseText, idx + 1, currentVerses)}
                className="w-full text-left p-3 rounded hover:bg-gray-800 group transition-all duration-200 border border-transparent hover:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-gray-600 pt-1 w-4 shrink-0 group-hover:text-blue-400">{idx + 1}</span>
                    <p className="text-gray-300 group-hover:text-white leading-relaxed text-sm">{verseText}</p>
                </div>
                </button>
            ))}
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <BookOpen size={32} className="opacity-20 mb-2" />
                <p className="text-xs">Selecione um capítulo</p>
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default BibleModule;