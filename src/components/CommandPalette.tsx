import { useEffect, useMemo, useRef, useState } from 'react';
import { getTools, findTool } from '../lib/registry';
import { detectContentType, getContentTypeInfo, type DetectedContentType } from '../lib/detect-content';
import { usePendingInput } from '../lib/pending-input';
import type { Tool } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

interface ToolRowProps {
  tool: Tool;
  selected: boolean;
  onSelect: () => void;
  badge?: string;
}

function ToolRow({ tool, selected, onSelect, badge }: ToolRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
        selected
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-neutral-300 hover:bg-neutral-800'
      }`}
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
  );
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const [detectedContentType, setDetectedContentType] = useState<DetectedContentType | null>(null);
  const [clipboardText, setClipboardText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tools = useMemo(() => getTools(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return tools;
    const q = query.trim().toLowerCase();
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.keywords?.some((k) => k.includes(q))
    );
  }, [query, tools]);

  // Build clipboard detection section using content-type classifier
  const detectSection: { type: string; recommended: Tool[] } | null = useMemo(() => {
    const isDetecting = query.trim() === '' && detectedContentType !== null && (clipboardText || detectedContentType === 'image');
    if (!isDetecting) return null;

    const info = getContentTypeInfo(detectedContentType!);
    const recommended: Tool[] = [];
    for (const id of info.recommendedToolIds) {
      const tool = findTool(id);
      if (tool) {
        recommended.push(tool);
      }
    }

    return { type: info.label, recommended };
  }, [query, detectedContentType, clipboardText]);

  // reset index when detect or filter changes
  useEffect(() => {
    setIdx(0);
  }, [detectSection, filtered]);

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
        } catch (e) {
          console.warn('[clipboard-detect] Failed to read clipboard:', e);
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
  const detectRowOffset = hasDetectRow ? detectSection!.recommended.length : 0;
  const totalCount = filtered.length + detectRowOffset;

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
        if (hasDetectRow && idx < detectRowOffset) {
          handleSelectDetect(detectSection!.recommended[idx].id);
        } else {
          const itemIdx = idx - detectRowOffset;
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
            placeholder="Search tools… (⌘K)"
            className="flex-1 py-3 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>
        <div className="max-h-80 overflow-auto py-1">
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
                  selected={idx === i}
                  onSelect={() => handleSelectDetect(tool.id)}
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
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">No tools found</div>
          ) : (
            filtered.map((tool, i) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                selected={idx === i + detectRowOffset}
                onSelect={() => handleSelectTool(tool.id)}
              />
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-600 flex gap-4">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
