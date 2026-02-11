import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectionContent, ProjectionType } from '../types';

interface ProjectionContextType {
  currentProjection: ProjectionContent;
  setProjection: (content: ProjectionContent) => void;
  clearProjection: () => void;
  settings: {
    theme: 'dark' | 'light';
    fontSize: number;
    bgImage: string | null;
  };
  updateSettings: (newSettings: Partial<ProjectionContextType['settings']>) => void;
}

const defaultProjection: ProjectionContent = {
  type: ProjectionType.IDLE,
  content: '',
};

const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

export const ProjectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProjection, setCurrentProjection] = useState<ProjectionContent>(defaultProjection);
  const [settings, setSettings] = useState({
    theme: 'dark' as const,
    fontSize: 48,
    bgImage: null as string | null,
  });

  const setProjection = (content: ProjectionContent) => {
    setCurrentProjection(content);
  };

  const clearProjection = () => {
    setCurrentProjection(defaultProjection);
  };

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <ProjectionContext.Provider value={{ currentProjection, setProjection, clearProjection, settings, updateSettings }}>
      {children}
    </ProjectionContext.Provider>
  );
};

export const useProjection = () => {
  const context = useContext(ProjectionContext);
  if (!context) {
    throw new Error('useProjection must be used within a ProjectionProvider');
  }
  return context;
};