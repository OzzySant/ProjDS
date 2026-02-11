import React from 'react';
import { useProjection } from '../../context/ProjectionContext';
import { Settings, Image, Type } from 'lucide-react';

const SettingsModule: React.FC = () => {
  const { settings, updateSettings } = useProjection();

  return (
    <div className="p-8 bg-gray-800 text-gray-100 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <Settings className="text-gray-400" /> Configurações
      </h2>

      <div className="max-w-2xl space-y-8">
        {/* Font Size Control */}
        <section className="bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type size={18} className="text-blue-400" /> Tipografia da Projeção
            </h3>
            <div className="flex items-center gap-4">
                <label className="text-gray-400 w-32">Tamanho Fonte</label>
                <input
                    type="range"
                    min="24"
                    max="96"
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="w-12 text-right font-mono">{settings.fontSize}px</span>
            </div>
        </section>

        {/* Theme Control */}
        <section className="bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image size={18} className="text-purple-400" /> Tema de Fundo
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => updateSettings({ bgImage: null })}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                        settings.bgImage === null 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                >
                    <div className="w-full aspect-video bg-black rounded border border-gray-700"></div>
                    <span className="text-sm font-medium">Preto (Padrão)</span>
                </button>
                 <button
                    onClick={() => updateSettings({ bgImage: 'https://picsum.photos/1920/1080?blur=5' })}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                        settings.bgImage !== null 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                    }`}
                >
                    <div className="w-full aspect-video rounded border border-gray-700 overflow-hidden relative">
                         <img src="https://picsum.photos/1920/1080?blur=5" className="object-cover w-full h-full opacity-50" alt="Nature" />
                    </div>
                    <span className="text-sm font-medium">Natureza (Aleatório)</span>
                </button>
            </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsModule;