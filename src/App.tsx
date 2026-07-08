import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { getTools, findTool } from './lib/registry';
import { ToolList } from './components/ToolList';
import { CommandPalette } from './components/CommandPalette';
import { detectTools } from './lib/smart-detect';
import { usePendingInput } from './lib/pending-input';
import { ActiveToolContext } from './lib/active-tool';

// pull in all tool modules so they self-register on import
import './tools/index';

export function App() {
  const [activeId, setActiveId] = useState<string>(() => getTools()[0]?.id ?? '');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ toolId: string; score: number }[] | null>(null);
  const [suggestIdx, setSuggestIdx] = useState(0);
  const suggestTextRef = useRef('');

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
      const matches = detectTools(text);
      if (matches.length === 0) return;
      if (matches.length === 1) {
        usePendingInput.getState().setPendingInput(matches[0].toolId, text);
        setActiveId(matches[0].toolId);
      } else {
        setSuggestions(matches);
        setSuggestIdx(0);
        suggestTextRef.current = text;
      }
    } catch {
      // clipboard access may be denied
    }
  }, []);

  // keyboard navigation for suggestion popover
  useEffect(() => {
    if (!suggestions) return;
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSuggestIdx((i) => Math.min(i + 1, suggestions!.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSuggestIdx((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          {
            const sel = suggestions![suggestIdx];
            if (sel) {
              usePendingInput.getState().setPendingInput(sel.toolId, suggestTextRef.current);
              setActiveId(sel.toolId);
              setSuggestions(null);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSuggestions(null);
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [suggestions, suggestIdx]);

  return (
    <div className="flex h-full">
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      <main className="flex-1 min-w-0 flex flex-col">
        {ActiveComponent ? (
          <>
            <header className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
              <h1 className="text-sm font-semibold text-neutral-100">{active!.name}</h1>
              <div className="flex items-center gap-2 relative">
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

                {/* suggestion popover */}
                {suggestions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSuggestions(null)} />
                    <div
                      className="absolute top-full right-0 z-50 mt-1 w-72 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1 max-h-60 overflow-auto">
                        {suggestions.map((s, i) => {
                          const tool = findTool(s.toolId);
                          return (
                            <button
                              key={s.toolId}
                              onClick={() => {
                                usePendingInput.getState().setPendingInput(s.toolId, suggestTextRef.current);
                                setActiveId(s.toolId);
                                setSuggestions(null);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                                i === suggestIdx
                                  ? 'bg-blue-600/20 text-blue-300'
                                  : 'text-neutral-300 hover:bg-neutral-800'
                              }`}
                            >
                              <span className="text-xs uppercase tracking-wide text-neutral-500 w-16 shrink-0">
                                {tool?.category}
                              </span>
                              <span className="text-sm">{tool?.name ?? s.toolId}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="px-3 py-1.5 border-t border-neutral-800 text-[10px] text-neutral-600 flex gap-3">
                        <span>↑↓ navigate</span>
                        <span>↵ select</span>
                        <span>esc close</span>
                      </div>
                    </div>
                  </>
                )}
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
