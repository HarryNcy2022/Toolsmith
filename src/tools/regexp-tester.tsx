import { useMemo, useState } from 'react';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
}

function highlight(text: string, pattern: string, flags: string) {
  if (!pattern) return { html: escapeHtml(text), matches: [], error: null };
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  } catch (e) {
    return { html: escapeHtml(text), matches: [], error: e instanceof Error ? e.message : String(e) };
  }
  const matches: MatchInfo[] = [];
  let html = '';
  let last = 0;
  let m: RegExpExecArray | null;
  let safety = 0;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
    html += escapeHtml(text.slice(last, m.index));
    html += `<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">${escapeHtml(m[0])}</mark>`;
    last = m.index + m[0].length;
    if (++safety > 5000) break;
  }
  html += escapeHtml(text.slice(last));
  return { html, matches, error: null };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function Component() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set(['g', 'i']));
  const [text, setText] = useState('');

  const flagStr = useMemo(() => [...flags].join(''), [flags]);

  const { html, matches, error } = useMemo(
    () => highlight(text, pattern, flagStr),
    [text, pattern, flagStr]
  );

  function toggleFlag(f: string) {
    setFlags((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded px-2">
          <span className="text-neutral-600 text-sm">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            className="bg-transparent py-1.5 text-sm font-mono text-neutral-200 focus:outline-none w-64"
          />
          <span className="text-neutral-600 text-sm">/</span>
          <span className="text-neutral-500 text-sm font-mono w-12">{flagStr}</span>
        </div>
        <div className="flex gap-1">
          {FLAGS.map((f) => (
            <button
              key={f}
              onClick={() => toggleFlag(f)}
              className={`w-7 h-7 text-xs rounded border ${
                flags.has(f)
                  ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
            Test string
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type text to test against…"
            className="flex-1 min-h-0 p-3 bg-transparent text-sm font-mono text-neutral-200 resize-none focus:outline-none"
          />
        </div>

        <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
            <span>Matches ({matches.length})</span>
            {error && <span className="text-red-400 normal-case">{error}</span>}
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3">
            <pre
              className="text-sm font-mono text-neutral-300 whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: html || '<span class="text-neutral-600">No input</span>' }}
            />
          </div>
          {matches.length > 0 && (
            <div className="border-t border-neutral-800 max-h-40 overflow-auto">
              {matches.slice(0, 100).map((mt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-1.5 border-b border-neutral-800/60 last:border-0 text-xs"
                >
                  <span className="text-neutral-600 w-8">#{i + 1}</span>
                  <code className="text-yellow-300 font-mono flex-1 break-all">{mt.match}</code>
                  <span className="text-neutral-600">@{mt.index}</span>
                  <CopyButton getText={() => mt.match} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'regexp-tester',
    name: 'RegExp Tester',
    category: 'Inspect',
    keywords: ['regex', 'regexp', 'pattern', 'match']
  },
  component: Component
});
