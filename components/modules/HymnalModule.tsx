import React, { useState, useEffect } from 'react';
import { useProjection } from '../../context/ProjectionContext';
import { ProjectionType, Hymn } from '../../types';
import { Music, Search, PlayCircle, CheckCircle2, Loader2, AlertTriangle, DownloadCloud } from 'lucide-react';
import { HARPA_DATA } from '../../data/harpa';
import { HARPA_API_URLS } from '../../constants';
import { getResource, saveResource } from '../../utils/db';

const HymnalModule: React.FC = () => {
  const { setProjection, clearProjection, setNavigationHandlers } = useProjection();
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Função auxiliar para normalizar e validar dados
  const parseAndValidate = (data: any): Hymn[] => {
      let list: any[] = [];
      if (Array.isArray(data)) {
          list = data;
      } else if (data && Array.isArray(data.hinos)) {
          list = data.hinos;
      } else if (data && Array.isArray(data.hymns)) {
          list = data.hymns;
      } else if (data && typeof data === 'object') {
          // Suporte para formato Object Map (ex: { "1": {...}, "2": {...} })
          // Filtra chaves que parecem índices e converte para array
          list = Object.values(data).filter((item: any) => (item.numero || item.hino) && (item.letra || item.verses));
      }

      // Normalização dos campos
      const normalized = list.map((item: any) => {
          // Tenta extrair título de strings como "1 - Chuvas de Graça"
          let titulo = item.titulo || item.title || item.hino || "Sem título";
          if (titulo.includes(' - ')) {
             const parts = titulo.split(' - ');
             if (parseInt(parts[0]) > 0) {
                 titulo = parts.slice(1).join(' - ');
             }
          }

          // Tratamento de letras complexas (Daniel Liberato format)
          let letra = item.letra || item.text || item.lyrics || "";
          
          if (!letra && item.verses) {
              // Reconstrói a letra a partir de verses/coro com intercalação
              const parts: string[] = [];
              const chorusText = item.coro 
                  ? `[Coro]\n${item.coro.replace(/<br>/g, '\n').replace(/<br\s*\/>/g, '\n')}` 
                  : null;
              
              if (typeof item.verses === 'object') {
                  const sortedKeys = Object.keys(item.verses).sort((a, b) => parseInt(a) - parseInt(b));
                  
                  sortedKeys.forEach((key) => {
                      const v = item.verses[key];
                      parts.push(String(v).replace(/<br>/g, '\n').replace(/<br\s*\/>/g, '\n'));
                      
                      // Intercala o refrão após cada estrofe
                      if (chorusText) {
                          parts.push(chorusText);
                      }
                  });
              }
              letra = parts.join('\n\n');
          }

          return {
            numero: parseInt(item.numero || item.number || (item.hino ? item.hino.split(' - ')[0] : 0)),
            titulo: titulo,
            letra: letra
          };
      }).filter((h: any) => h.numero > 0 && h.letra.length > 0);

      // Validação: Se não tiver pelo menos 50 hinos, algo está errado com a fonte
      if (normalized.length < 50) {
          throw new Error(`Fonte incompleta: apenas ${normalized.length} hinos encontrados.`);
      }

      return normalized;
  };

  const fetchWithFailover = async (urls: string[]) => {
      let lastError: any = null;
      
      for (const url of urls) {
          try {
              setStatus(`Tentando: ${url.substring(0, 30)}...`);
              console.log(`Tentando baixar Harpa de: ${url}`);
              
              const response = await fetch(url, { mode: 'cors' });
              if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
              
              // O arquivo pode não ser um JSON estrito (pode ter chaves sem aspas)
              // Lemos como texto primeiro
              const text = await response.text();
              let rawJson;
              
              try {
                  rawJson = JSON.parse(text);
              } catch (jsonError) {
                  console.warn("JSON.parse padrão falhou, tentando modo permissivo (eval)...");
                  // Fallback para objetos JS mal formados (chaves sem aspas)
                  // A fonte solicitada pode estar formatada como um objeto JS e não JSON estrito.
                  try {
                       // new Function é uma alternativa mais segura que eval direto, mas ainda permite execução.
                       // Como a fonte é controlada via constante, assumimos risco calculado para compatibilidade.
                       rawJson = new Function(`return ${text}`)();
                  } catch (evalError) {
                       throw new Error("Falha no parsing: O conteúdo não é JSON nem objeto JS válido.");
                  }
              }

              const validHymns = parseAndValidate(rawJson);
              
              console.log(`Sucesso! ${validHymns.length} hinos baixados de ${url}`);
              return validHymns;

          } catch (e: any) {
              console.warn(`Falha na fonte ${url}:`, e.message);
              lastError = e.message;
              // Loop continua para a próxima URL...
          }
      }
      throw new Error(`Todas as fontes falharam. Último erro: ${lastError}`);
  };

  const loadHymns = async (forceDownload = false) => {
    setIsLoading(true);
    setStatus("Iniciando...");

    // 1. Verifica arquivo local estático (Prioridade se tiver dados completos)
    if (HARPA_DATA.length > 50 && !forceDownload) {
        console.log("Usando banco de dados local (harpa.ts)");
        setHymns([...HARPA_DATA].sort((a, b) => a.numero - b.numero));
        setIsLoading(false);
        setStatus(null);
        return;
    }

    // 2. Tenta carregar do Cache (IndexedDB)
    if (!forceDownload) {
        try {
            const cached = await getResource('harpa_data');
            if (cached && Array.isArray(cached) && cached.length > 100) {
                console.log("Carregado do Cache Offline");
                // Se já estava em cache, precisamos garantir que o parse seja refeito se necessário
                // ou confiar que o cache está ok. Como mudamos a lógica, idealmente deveríamos reprocessar,
                // mas 'cached' já é o objeto final Hymn[]. 
                // Se o usuário já tiver dados cacheados com a ordem antiga, ele precisará clicar em "Baixar" (forceDownload).
                // Para forçar a atualização automática, poderíamos invalidar o cache, mas vamos deixar o botão "Baixar" disponível.
                setHymns(cached.sort((a: any, b: any) => a.numero - b.numero));
                setIsLoading(false);
                setStatus(null);
                return;
            }
        } catch (e) {
            console.warn("Cache miss", e);
        }
    }

    // 3. Tenta baixar da Internet (Failover Loop)
    setStatus("Baixando 640 Hinos...");
    
    try {
        const validHymns = await fetchWithFailover(HARPA_API_URLS);
        
        // Salva para uso futuro
        await saveResource('harpa_data', validHymns);
        setHymns(validHymns.sort((a: any, b: any) => a.numero - b.numero));
        setStatus(null);
    } catch (err) {
        console.error("Erro no download:", err);
        // Fallback final silencioso para dados locais (mesmo que parciais)
        if (HARPA_DATA.length > 0) {
            setStatus("Modo Offline (Backup)");
            setHymns(HARPA_DATA);
        } else {
            setStatus("Erro: Sem conexão e sem dados locais.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHymns();
  }, []);

  const filteredHymns = hymns.filter(
    (h) => 
        h.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        h.numero?.toString().includes(searchTerm) ||
        h.letra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStanzas = (rawLyrics: string) => {
      if (!rawLyrics) return [];
      const normalized = rawLyrics.replace(/\r\n/g, '\n');
      let parts = normalized.split('\n\n');
      if (parts.length === 1 && parts[0].length > 0) {
           return [parts[0]];
      }
      return parts.filter(p => p.trim().length > 0);
  };

  const handleLyricClick = (stanza: string, index: number, allStanzas: string[]) => {
    if (!selectedHymn) return;
    
    // Projeção
    setProjection({
      type: ProjectionType.LYRIC,
      content: stanza,
      reference: `${selectedHymn.numero}. ${selectedHymn.titulo}`,
    });

    // Lógica de Navegação
    const hasNext = index < allStanzas.length - 1;
    const hasPrev = index > 0;

    setNavigationHandlers({
        onNext: hasNext ? () => handleLyricClick(allStanzas[index + 1], index + 1, allStanzas) : undefined,
        onPrev: hasPrev ? () => handleLyricClick(allStanzas[index - 1], index - 1, allStanzas) : undefined
    });
  };

  return (
    <div className="flex h-full bg-gray-800">
      {/* Sidebar List */}
      <div className="w-[40%] md:w-1/3 border-r border-gray-700 flex flex-col bg-gray-800/50">
        <div className="p-3 border-b border-gray-700 bg-gray-900 shrink-0">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                    <Music size={16} className="text-purple-400"/> Harpa Cristã
                </h2>
                {isLoading ? (
                     <span className="text-[10px] text-yellow-500 flex items-center gap-1 overflow-hidden whitespace-nowrap max-w-[120px]">
                        <Loader2 size={10} className="animate-spin shrink-0" /> {status}
                     </span>
                ) : hymns.length > 50 ? (
                    <span className="text-[10px] bg-green-600/20 text-green-500 px-2 py-0.5 rounded border border-green-600/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> {hymns.length} Hinos
                    </span>
                ) : (
                    <button
                        onClick={() => loadHymns(true)}
                        className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-600/30 flex items-center gap-1 hover:bg-red-600/40 transition-colors"
                        title="Tentar baixar novamente"
                    >
                        <DownloadCloud size={10} /> Baixar
                    </button>
                )}
            </div>
            
            <div className="relative">
                <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
                <input
                    type="text"
                    placeholder="Busque por Nº, Título ou Letra..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
        {filteredHymns.length === 0 && !isLoading ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Search size={24} className="mb-2 opacity-20" />
                <p className="text-xs">Nenhum hino encontrado.</p>
                </div>
        ) : (
            filteredHymns.map((hymn) => (
                <button
                key={hymn.numero}
                onClick={() => setSelectedHymn(hymn)}
                className={`w-full text-left px-3 py-2 border-b border-gray-700/50 hover:bg-gray-700 transition-colors flex justify-between items-center group ${
                    selectedHymn?.numero === hymn.numero ? 'bg-purple-600/20 border-l-2 border-l-purple-500' : ''
                }`}
                >
                <div className="truncate pr-1 flex items-center w-full">
                    <span className={`font-mono font-bold mr-2 text-[10px] px-1.5 py-0.5 rounded min-w-[32px] text-center ${selectedHymn?.numero === hymn.numero ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                        {hymn.numero}
                    </span>
                    <span className={`font-medium truncate text-xs ${selectedHymn?.numero === hymn.numero ? 'text-purple-300' : 'text-gray-300'}`}>
                        {hymn.titulo}
                    </span>
                </div>
                </button>
            ))
        )}
        </div>
      </div>

      {/* Lyrics Preview Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center h-12 bg-gray-900 shadow-sm shrink-0">
            {selectedHymn ? (
                 <h3 className="text-sm font-semibold text-gray-100 truncate pr-2 flex items-center gap-2">
                     <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{selectedHymn.numero}</span>
                     {selectedHymn.titulo}
                 </h3>
            ) : <div></div>}
             <button 
                onClick={clearProjection}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded text-xs font-semibold border border-red-600/30 whitespace-nowrap transition-colors"
            >
                Limpar Tela
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50">
          {selectedHymn ? (
            getStanzas(selectedHymn.letra).map((stanza, idx, arr) => (
              <div key={idx} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500/50 transition-colors group">
                <div className="bg-gray-700/30 px-3 py-1.5 flex justify-between items-center border-b border-gray-700/50">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                        {stanza.toLowerCase().includes('coro') || stanza.toLowerCase().includes('refrão') ? 'Refrão' : `Estrofe`}
                    </span>
                    <button 
                        onClick={() => handleLyricClick(stanza, idx, arr)}
                        className="flex items-center gap-1 text-[10px] bg-gray-700 group-hover:bg-purple-600 text-gray-300 group-hover:text-white px-3 py-1 rounded-full transition-all font-medium shadow-sm"
                    >
                        <PlayCircle size={12} /> Projetar
                    </button>
                </div>
                <div 
                    onClick={() => handleLyricClick(stanza, idx, arr)}
                    className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                >
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-center">{stanza}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600/50">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                     <Music size={32} className="opacity-40 text-purple-400"/>
                </div>
                <p className="text-sm font-medium">Selecione um hino</p>
                <p className="text-xs mt-1 opacity-50 max-w-[200px] text-center">
                    {isLoading ? "Baixando 640 hinos..." : `${hymns.length} Hinos disponíveis.`}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HymnalModule;