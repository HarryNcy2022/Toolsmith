import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { getTools, findTool } from './lib/registry';
import { ToolList } from './components/ToolList';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ActiveToolContext } from './lib/active-tool';
import { useToolPreferencesStore } from './lib/tool-preferences';
import { parseAcceleratorToKeys, validateAccelerator } from './lib/accelerator';
import type { KeyCombo } from './lib/accelerator';
import { usePendingInput } from './lib/pending-input';
import { Group, Panel, Separator } from 'react-resizable-panels';

// pull in all tool modules so they self-register on import
import './tools/index';

export function App() {
  const [activeId, setActiveId] = useState<string>(() => getTools()[0]?.id ?? '');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [focusInputRequest, setFocusInputRequest] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const recordRecent = useToolPreferencesStore((state) => state.recordRecent);

  // Parsed history hotkey, read once at mount so the listener doesn't re-subscribe.
  const historyComboRef = useRef<KeyCombo>(parseAcceleratorToKeys('CommandOrControl+Shift+H'));

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

  // Focus first editable tool input after command-palette selection or focus command.
  useEffect(() => {
    if (!focusInputRequest) return;
    const frame = requestAnimationFrame(() => {
      const input = mainRef.current
        ?.querySelector<HTMLElement>(
          '.toolsmith-input-editor .cm-content[contenteditable="true"], [data-toolsmith-focus-input]'
        );
      (input ?? mainRef.current)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusInputRequest]);

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

  // History hotkey (default CommandOrControl+Shift+H), independent of ⌘K.
  useEffect(() => {
    window.toolsmith
      ?.getConfig('historyHotkey')
      .then((raw) => {
        if (typeof raw === 'string' && validateAccelerator(raw).valid) {
          historyComboRef.current = parseAcceleratorToKeys(raw);
        }
      })
      .catch(() => {});

    function onKey(e: KeyboardEvent) {
      const combo = historyComboRef.current;
      const match =
        (combo.ctrl ? e.ctrlKey || e.metaKey : true) &&
        (combo.meta ? e.metaKey || e.ctrlKey : true) &&
        (combo.alt ? e.altKey : true) &&
        (combo.shift ? e.shiftKey : true) &&
        e.key.toLowerCase() === combo.key.toLowerCase();
      if (match) {
        e.preventDefault();
        setHistoryPanelOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const active = findTool(activeId);
  const ActiveComponent = active?.component;

  function focusInput() {
    setFocusInputRequest((request) => request + 1);
  }

  function handleToolSelect(id: string) {
    recordRecent(id);
    setActiveId(id);
  }

  function handlePaletteSelect(id: string) {
    handleToolSelect(id);
    focusInput();
  }

  return (
    <><Group
      id="app-shell"
      orientation="horizontal"
      className="h-full"
    >
      <Panel id="sidebar-panel" defaultSize="22%" minSize="12%" maxSize="50%" collapsible collapsedSize={0}>
        <Sidebar activeId={activeId} onSelect={handleToolSelect} />
      </Panel>
      <Separator className="w-px bg-neutral-800 hover:w-1 hover:bg-blue-600 transition-all duration-200 group flex items-center justify-center shrink-0 data-[resize-handle-active]:bg-blue-600">
        <div className="w-0.5 h-8 rounded-full bg-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Separator>
      <Panel id="main-panel">
        <main ref={mainRef} tabIndex={-1} className="flex-1 min-w-0 flex flex-col h-full">
          {ActiveComponent ? (
            <>
              <header className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
              <h1 className="text-sm font-semibold text-neutral-100">{active?.name ?? ''}</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaletteOpen(true)}
                    className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
                    title="⌘K"
                  >
                    ⌘K
                  </button>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
                    title="Settings"
                    aria-label="Settings"
                  >
                    ⚙
                  </button>
                  <button
                    onClick={() => setHistoryPanelOpen(true)}
                    className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
                    title="History (⌘⇧H)"
                    aria-label="History"
                  >
                    🕘
                  </button>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-600">
                    {active?.category ?? ''}
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
            <ToolList onSelect={handleToolSelect} />
          )}
        </main>
      </Panel>
    </Group>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handlePaletteSelect}
        onFocusInput={focusInput}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HistoryPanel
        toolId={activeId}
        open={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
        onLoad={(text) => usePendingInput.getState().setPendingInput(activeId, text)}
      />
    </>
  );
}
