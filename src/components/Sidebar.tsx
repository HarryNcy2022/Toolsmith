import { useMemo, useState } from 'react';
import { getTools, groupByCategory } from '../lib/registry';
import type { ToolCategory } from '../types';

const CATEGORY_ORDER: ToolCategory[] = [
  'Format',
  'Encode',
  'Decode',
  'Convert',
  'Generate',
  'Inspect',
  'Time'
];

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeId, onSelect }: SidebarProps) {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tools = getTools().filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.keywords?.some((k) => k.includes(q))
      );
    });
    return groupByCategory(tools);
  }, [query]);

  return (
    <aside className="flex flex-col bg-neutral-950 border-r border-neutral-800 h-full min-w-[180px]">
      <div className="p-3 border-b border-neutral-800">
        <div className="text-sm font-semibold text-neutral-100 mb-2">Toolsmith</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="w-full px-2.5 py-1.5 text-sm bg-neutral-900 border border-neutral-800 rounded text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
        />
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {CATEGORY_ORDER.map((cat) => {
          const tools = grouped[cat];
          if (!tools?.length) return null;
          return (
            <div key={cat} className="mb-2">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
                {cat}
              </div>
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                    activeId === t.id
                      ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border-l-2 border-transparent'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
