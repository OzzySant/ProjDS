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
    <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4 z-20 shadow-lg shrink-0">
      <div className="text-blue-500 mb-2">
        <MonitorPlay size={28} />
      </div>
      
      {navItems.map((item) => {
        const isActive = currentModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onModuleChange(item.id as any)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600 text-white shadow-blue-900/50 shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title={item.label}
          >
            <item.icon size={20} className={`mb-0.5 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;