import { createContext, useContext } from 'react';

/**
 * React context that provides the active toolId to child components.
 * Set in App.tsx so IOPanel can auto-read it without every tool passing it manually.
 */
export const ActiveToolContext = createContext<string>('');

export function useActiveToolId(): string {
  return useContext(ActiveToolContext);
}
