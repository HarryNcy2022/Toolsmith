import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { getTools, findTool } from './lib/registry';
import { ToolList } from './components/ToolList';

// pull in all tool modules so they self-register on import
import './tools/index';

export function App() {
  const [activeId, setActiveId] = useState<string>(() => getTools()[0]?.id ?? '');

  // keep active tool in URL hash so reload/back works
  useEffect(() => {
    const fromHash = window.location.hash.replace('#/', '');
    if (fromHash && findTool(fromHash)) {
      setActiveId(fromHash);
    }
  }, []);

  useEffect(() => {
    if (activeId) window.location.hash = `/${activeId}`;
  }, [activeId]);

  const active = findTool(activeId);
  const ActiveComponent = active?.component;

  return (
    <div className="flex h-full">
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      <main className="flex-1 min-w-0 flex flex-col">
        {ActiveComponent ? (
          <>
            <header className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
              <h1 className="text-sm font-semibold text-neutral-100">{active!.name}</h1>
              <span className="text-[10px] uppercase tracking-wider text-neutral-600">
                {active!.category}
              </span>
            </header>
            <div className="flex-1 min-h-0 p-4">
              <ActiveComponent />
            </div>
          </>
        ) : (
          <ToolList onSelect={setActiveId} />
        )}
      </main>
    </div>
  );
}
