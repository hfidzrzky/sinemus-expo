import { useState, useCallback } from 'react';

export interface TabConfig<T extends string> {
  id: T;
  label: string;
  isOptional?: boolean;
}

export function useMultiTabForm<T extends string>(tabs: TabConfig<T>[], initialTab?: T) {
  const [activeTab, setActiveTab] = useState<T>(initialTab || tabs[0].id);
  const [completedTabs, setCompletedTabs] = useState<Set<T>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const markTabCompleted = useCallback((tabId: T, completed = true) => {
    setCompletedTabs((prev) => {
      const next = new Set(prev);
      if (completed) {
        next.add(tabId);
      } else {
        next.delete(tabId);
      }
      return next;
    });
  }, []);

  const goToTab = useCallback((tabId: T) => {
    setActiveTab(tabId);
  }, []);

  const currentIndex = tabs.findIndex((t) => t.id === activeTab);
  const hasNext = currentIndex < tabs.length - 1;
  const hasPrevious = currentIndex > 0;

  const goToNextTab = useCallback(() => {
    if (hasNext) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  }, [hasNext, currentIndex, tabs]);

  const goToPreviousTab = useCallback(() => {
    if (hasPrevious) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  }, [hasPrevious, currentIndex, tabs]);

  return {
    tabs,
    activeTab,
    setActiveTab: goToTab,
    completedTabs,
    markTabCompleted,
    isDirty,
    setIsDirty,
    hasNext,
    hasPrevious,
    goToNextTab,
    goToPreviousTab,
  };
}
