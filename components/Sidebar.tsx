import React from 'react';
import { Book, Music, Image as ImageIcon, Settings, MonitorPlay } from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onModuleChange: (module: 'bible' | 'hymn' | 'media' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentModule, onModuleChange }) => {
  const navItems = [
    { id: 'bible', icon: Book, label: 'Bíblia' },
    { id: 'hymn', icon: Music, label: 'Harpa' },
    { id: 'media', icon: ImageIcon, label: 'Mídia' },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 gap-6 z-20 shadow-lg">
      <div className="text-blue-500 mb-4">
        <MonitorPlay size={32} />
      </div>
      
      {navItems.map((item) => {
        const isActive = currentModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onModuleChange(item.id as any)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600 text-white shadow-blue-900/50 shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title={item.label}
          >
            <item.icon size={24} className={`mb-1 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;