'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type SectionType = 'projects' | 'ideas' | 'tasks' | 'chores' | 'notes' | null;

interface FocusContextType {
  focusedSection: SectionType;
  setFocusedSection: (section: SectionType) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusedSection, setFocusedSection] = useState<SectionType>(null);

  return (
    <FocusContext.Provider value={{ focusedSection, setFocusedSection }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
