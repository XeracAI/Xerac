'use client';

import { useState, createContext, type ReactNode, useMemo } from 'react';

import type { Model, ModelGroup } from '@/lib/ai/types';

interface ModelContext {
  models: Model[];
  setModels: (models: Model[]) => void;
  userModelGroups: ModelGroup[];
  setUserModelGroups: (modelGroups: ModelGroup[]) => void;
}

export const ModelContext = createContext<ModelContext>({
  models: [],
  setModels: () => {},
  userModelGroups: [],
  setUserModelGroups: () => {},
});

export function ModelContextProvider({ children, initialModels, initialUserModelGroups }: { children: ReactNode, initialModels?: Model[]; initialUserModelGroups?: ModelGroup[] | null }) {
  const [models, setModels] = useState<Model[]>(initialModels || []);
  const [userModelGroups, setUserModelGroups] = useState<ModelGroup[]>(initialUserModelGroups || []);

  const value = useMemo(() => ({
    models,
    setModels,
    userModelGroups,
    setUserModelGroups,
  }), [models, userModelGroups]);

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
}
