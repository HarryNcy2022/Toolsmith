import { useEffect, useMemo, useRef, useState } from 'react';
import { getTools, findTool } from '../lib/registry';
import { detectContentType, getContentTypeInfo, type DetectedContentType } from '../lib/detect-content';
import { usePendingInput } from '../lib/pending-input';
import { orderTools, useToolPreferencesStore } from '../lib/tool-preferences';
import type { Tool } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onFocusInput: () => void;
}

interface ToolRowProps {
  tool: Tool;
  selected: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  pinned: boolean;
  badge?: string;
}

function ToolRow({ tool, selected, onSelect, onTogglePin, pinned, badge }: ToolRowProps) {
  function handlePinKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    onTogglePin();
  }

  return (
    <div
      className={`w-full px-4 py-2 flex items-center gap-3 transition-colors ${
        selected
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        aria-label={`Select ${tool.name}`}
      >
        <span className="text-xs uppercase tracking-wide text-neutral-600 w-20 shrink-0">
          {tool.category}
        </span>
        <span className="text-sm flex-1">{tool.name}</span>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            {badge}
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label={`${pinned ? 'Unpin' : 'Pin'} ${tool.name}`}
        aria-pressed={pinned}
        title={`${pinned ? 'Unpin' : 'Pin'} ${tool.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        onKeyDown={handlePinKeyDown}
        className={`shrink-0 rounded p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
          pinned
            ? 'text-blue-300 hover:bg-blue-600/20'
            : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
        }`}
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill={pinned ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      </button>
    </div>
  );
}

interface PaletteCommand {
  id: string;
  label: string;
  keywords: string[];
}

const PALETTE_COMMANDS: PaletteCommand[] = [
  { id: 'focus', label: 'Focus current input', keywords: ['focus', 'input', 'refocus'] }
];

interface CommandRowProps {
  command: PaletteCommand;
  selected: boolean;
  onSelect: () => void;
}

function CommandRow({ command, selected, onSelect }: CommandRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
        selected ? 'bg-blue-600/20 text-blue-300' : 'text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      <span className="text-xs uppercase tracking-wide text-neutral-600 w-20 shrink-0">Command</span>
      <span className="text-sm flex-1">{command.label}</span>
      <span className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
        /{command.id}
      </span>
    </button>
  );
}

export function CommandPalette({ open, onClose, onSelect, onFocusInput }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const [detectedContentType, setDetectedContentType] = useState<DetectedContentType | null>(null);
  const [clipboardText, setClipboardText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tools = useMemo(() => getTools(), []);
  const pinnedIds = useToolPreferencesStore((state) => state.pinnedIds);
  const recentToolIds = useToolPreferencesStore((state) => state.recentToolIds);
  const togglePin = useToolPreferencesStore((state) => state.togglePin);
  const commandMode = query.trim().startsWith('/');

  const filtered = useMemo(() => {
    if (commandMode) return [];
    const matchingTools = !query.trim()
      ? tools
      : tools.filter((t) => {
          const q = query.trim().toLowerCase();
          return (
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.keywords?.some((k) => k.includes(q))
          );
        });
    return orderTools(matchingTools, pinnedIds, recentToolIds);
  }, [commandMode, pinnedIds, query, recentToolIds, tools]);

  const commandQuery = commandMode ? query.trim().slice(1).trim().toLowerCase() : '';
  const commandResults = useMemo(() => {
    if (!commandMode) return [];
    if (!commandQuery) return PALETTE_COMMANDS;
    return PALETTE_COMMANDS.filter(
      (command) =>
        command.label.toLowerCase().includes(commandQuery) ||
        command.keywords.some((keyword) => keyword.includes(commandQuery))
    );
  }, [commandMode, commandQuery]);

  // Build clipboard detection section using content-type classifier
  const detectSection: { type: string; recommended: Tool[] } | null = useMemo(() => {
    const isDetecting = query.trim() === '' && detectedContentType !== null && (clipboardText || detectedContentType === 'image');
    if (!isDetecting) return null;

    if (detectedContentType === null) return null;
    const info = getContentTypeInfo(detectedContentType);
    const recommended: Tool[] = [];
    for (const id of info.recommendedToolIds) {
      const tool = findTool(id);
      if (tool) {
        recommended.push(tool);
      }
    }

    return { type: info.label, recommended };
  }, [query, detectedContentType, clipboardText]);

  // reset index when command, detect, or tool results change
  useEffect(() => {
    setIdx(0);
  }, [commandResults, detectSection, filtered]);

  // focus input + read clipboard on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setIdx(0);
      setDetectedContentType(null);
      setClipboardText('');

      (async () => {
        try {
          const [raw, hasImage] = await Promise.all([
            window.toolsmith
              ? window.toolsmith.readClipboard()
              : navigator.clipboard.readText(),
            window.toolsmith
              ? window.toolsmith.clipboardHasImage()
              : Promise.resolve(false),
          ]);
          const text = (raw ?? '').trim();
          if (text || hasImage) {
            setClipboardText(text);
            const type = detectContentType(text, hasImage);
            setDetectedContentType(type);
          }
        } catch (error) {
          if (error instanceof Error) {
            console.warn('[clipboard-detect] Failed to read clipboard:', error);
          } else {
            console.warn('[clipboard-detect] Failed to read clipboard:', String(error));
          }
        }
      })();

      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSelectTool(toolId: string) {
    onSelect(toolId);
    onClose();
  }

  function handleSelectDetect(toolId: string) {
    usePendingInput.getState().setPendingInput(toolId, clipboardText);
    onSelect(toolId);
    onClose();
  }

  const hasDetectRow = detectSection !== null;
  const commandCount = commandMode ? commandResults.length : 0;
  const recommendedCount = detectSection?.recommended.length ?? 0;
  const filteredRowOffset = commandCount + recommendedCount;
  const totalCount = (commandMode ? 0 : filtered.length) + filteredRowOffset;

  function handleCommand(command: PaletteCommand) {
    if (command.id === 'focus') onFocusInput();
    onClose();
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, totalCount - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (commandMode && idx < commandCount) {
          handleCommand(commandResults[idx]);
        } else if (hasDetectRow && idx >= commandCount && idx < filteredRowOffset) {
          const recommendedTool = detectSection?.recommended[idx - commandCount];
          if (recommendedTool) handleSelectDetect(recommendedTool.id);
        } else {
          const itemIdx = idx - filteredRowOffset;
          const item = filtered[itemIdx];
          if (item) handleSelectTool(item.id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* panel */}
      <div className="relative w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-neutral-800">
          <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools… or type / for commands"
            className="flex-1 py-3 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>
        <div className="max-h-80 overflow-auto py-1">
          {commandMode &&
            commandResults.map((command, i) => (
              <CommandRow
                key={command.id}
                command={command}
                selected={idx === i}
                onSelect={() => handleCommand(command)}
              />
            ))}
          {detectSection && (
            <>
              {/* Clipboard detection section header */}
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 select-none">
                Clipboard detection: {detectSection.type}
              </div>

              {/* Recommended tool rows */}
              {detectSection.recommended.map((tool, i) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  selected={idx === i + commandCount}
                  onSelect={() => handleSelectDetect(tool.id)}
                  onTogglePin={() => togglePin(tool.id)}
                  pinned={pinnedIds.includes(tool.id)}
                  badge="recommended"
                />
              ))}

              {/* Separator */}
              <hr className="border-neutral-800 mx-3 my-1" />

              {/* All tools sub-header */}
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 select-none">
                All tools ({filtered.length})
              </div>

            </>
          )}
          {commandMode ? (
            commandResults.length === 0 && (
              <div className="px-4 py-6 text-sm text-neutral-500 text-center">No commands found</div>
            )
          ) : filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">No tools found</div>
          ) : (
            filtered.map((tool, i) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                selected={idx === i + filteredRowOffset}
                onSelect={() => handleSelectTool(tool.id)}
                onTogglePin={() => togglePin(tool.id)}
                pinned={pinnedIds.includes(tool.id)}
              />
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-600 flex gap-4">
          <span>type / commands</span>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
