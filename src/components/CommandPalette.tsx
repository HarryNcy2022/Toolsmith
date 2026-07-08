import { useEffect, useMemo, useRef, useState } from 'react';
import { getTools } from '../lib/registry';
import type { Tool } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
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

  // reset index when filter changes
  useEffect(() => {
    setIdx(0);
  }, [filtered]);

  // focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setIdx(0);
      // small delay so the DOM is ready
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[idx]) {
          onSelect(filtered[idx].id);
          onClose();
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
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">No tools found</div>
          ) : (
            filtered.map((tool, i) => (
              <button
                key={tool.id}
                onClick={() => {
                  onSelect(tool.id);
                  onClose();
                }}
                className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
                  i === idx
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <span className="text-xs uppercase tracking-wide text-neutral-600 w-20 shrink-0">
                  {tool.category}
                </span>
                <span className="text-sm">{tool.name}</span>
              </button>
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
