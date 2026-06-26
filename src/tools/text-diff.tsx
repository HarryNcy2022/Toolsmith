import { useMemo, useState } from 'react';
import { diffLines, diffWordsWithSpace, diffChars } from 'diff';
import { registerTool } from '../lib/registry';

type Granularity = 'line' | 'word' | 'char';

function Component() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [gran, setGran] = useState<Granularity>('line');

  const parts = useMemo(() => {
    if (!left && !right) return [];
    const fn =
      gran === 'line' ? diffLines : gran === 'word' ? diffWordsWithSpace : diffChars;
    return fn(left, right);
  }, [left, right, gran]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const p of parts) {
      if (p.added) added += p.value.split('\n').filter(Boolean).length;
      if (p.removed) removed += p.value.split('\n').filter(Boolean).length;
    }
    return { added, removed };
  }, [parts]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Granularity</span>
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
          {(['line', 'word', 'char'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGran(g)}
              className={`px-3 py-1 text-xs capitalize ${gran === g ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="text-xs ml-auto">
          <span className="text-emerald-400">+{stats.added}</span>
          <span className="text-neutral-600 mx-2">·</span>
          <span className="text-red-400">-{stats.removed}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <textarea
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="Original"
          className="w-full p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-200 resize-none focus:outline-none focus:border-neutral-600"
        />
        <textarea
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder="Changed"
          className="w-full p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-200 resize-none focus:outline-none focus:border-neutral-600"
        />
      </div>

      <div className="flex-1 min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-auto p-3">
        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
          {parts.length === 0 ? (
            <span className="text-neutral-600">No input</span>
          ) : (
            parts.map((p, i) => (
              <span
                key={i}
                className={
                  p.added
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : p.removed
                    ? 'bg-red-500/20 text-red-300 line-through opacity-70'
                    : 'text-neutral-400'
                }
              >
                {p.value}
              </span>
            ))
          )}
        </pre>
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'text-diff',
    name: 'Text Diff',
    category: 'Inspect',
    keywords: ['diff', 'compare', 'text']
  },
  component: Component
});
