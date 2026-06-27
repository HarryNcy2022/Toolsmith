import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { getTools, findTool } from './lib/registry';
import { ToolList } from './components/ToolList';
import { CommandPalette } from './components/CommandPalette';
import { detectTool } from './lib/smart-detect';
import { ActiveToolContext } from './lib/active-tool';

// pull in all tool modules so they self-register on import
import './tools/index';

export function App() {
  const [activeId, setActiveId] = useState<string>(() => getTools()[0]?.id ?? '');
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  // ⌘K / Ctrl+K to open command palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const active = findTool(activeId);
  const ActiveComponent = active?.component;

  const handleDetectClipboard = useCallback(async () => {
    try {
      const text = await window.devutils?.readClipboard();
      if (!text) return;
      const detected = detectTool(text);
      if (detected) {
        setActiveId(detected);
      }
    } catch {
      // clipboard access may be denied
    }
  }, []);

  return (
    <div className="flex h-full">
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      <main className="flex-1 min-w-0 flex flex-col">
        {ActiveComponent ? (
          <>
            <header className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
              <h1 className="text-sm font-semibold text-neutral-100">{active!.name}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDetectClipboard}
                  className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
                  title="Detect tool from clipboard content"
                >
                  📋 Detect
                </button>
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
                  title="⌘K"
                >
                  ⌘K
                </button>
                <span className="text-[10px] uppercase tracking-wider text-neutral-600">
                  {active!.category}
                </span>
              </div>
            </header>
            <div className="flex-1 min-h-0 p-4">
              <ActiveToolContext.Provider value={activeId}>
                <ActiveComponent />
              </ActiveToolContext.Provider>
            </div>
          </>
        ) : (
          <ToolList onSelect={setActiveId} />
        )}
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={setActiveId}
      />
    </div>
  );
}
