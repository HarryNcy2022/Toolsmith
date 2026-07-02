import { useMemo, useState } from 'react';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;

const FLAG_HELP: Record<string, string> = {
  g: 'global — find all matches (not just the first)',
  i: 'ignore case — case-insensitive match',
  m: 'multiline — ^ and $ match line boundaries, not just string ends',
  s: 'dotAll — . matches newlines too',
  u: 'unicode — treat the pattern as Unicode (code points, code units for {...})',
  y: 'sticky — match at the current position (lastIndex)'
};

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

// Expand a String.replace-style replacement template for a single match.
// Supports: $$, $&, $1-$9, $<name>, $`, $'. This is applied per-match so the
// caller controls which matches get substituted (e.g. skipping zero-length
// matches to stay consistent with the Matches panel).
function expandTemplate(tpl: string, m: RegExpExecArray): string {
  const named = (m.groups ?? {}) as Record<string, string>;
  return tpl.replace(/\$(\$|&|`|'|\d+|<[^>]+>)/g, (whole, body: string) => {
    switch (body) {
      case '$':
        return '$';
      case '&':
        return m[0];
      case '`':
        return m.input ? m.input.slice(0, m.index) : '';
      case "'":
        return m.input ? m.input.slice(m.index + m[0].length) : '';
      default:
        if (body[0] === '<') {
          const name = body.slice(1, -1);
          return name in named ? named[name] : whole;
        }
        const n = Number(body);
        return n < m.length && m[n] !== undefined ? (m[n] as string) : '';
    }
  });
}

function Component() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set(['g', 'i']));
  const [text, setText] = useState('');
  const [replacement, setReplacement] = useState('');

  const flagStr = useMemo(() => [...flags].join(''), [flags]);

  const { html, matches, error } = useMemo(
    () => highlight(text, pattern, flagStr),
    [text, pattern, flagStr]
  );

  // VS Code-style pattern → replace: substitute every highlighted match with
  // the user's replacement template ($1, $2, $&, $<name>, $$, $`, $' all work).
  // Mirror the Matches panel exactly: force the global flag, and skip
  // zero-length matches so the replace count equals the highlighted count
  // (otherwise greedy patterns like (.*) would inject an extra substitution
  // for the trailing empty match). Empty replacement deletes matches.
  const { output, replaceError } = useMemo(() => {
    if (!pattern || !text) return { output: '', replaceError: null as string | null };
    try {
      const re = new RegExp(pattern, flagStr.includes('g') ? flagStr : flagStr + 'g');
      let out = '';
      let last = 0;
      let m: RegExpExecArray | null;
      let safety = 0;
      while ((m = re.exec(text)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        out += text.slice(last, m.index);
        out += expandTemplate(replacement, m);
        last = m.index + m[0].length;
        if (++safety > 5000) break;
      }
      out += text.slice(last);
      return { output: out, replaceError: null };
    } catch (e) {
      return { output: '', replaceError: e instanceof Error ? e.message : String(e) };
    }
  }, [text, pattern, flagStr, replacement]);

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
              title={FLAG_HELP[f]}
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
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded px-2 flex-1 min-w-[180px] focus-within:border-blue-500">
          <span className="text-blue-400 text-xs font-medium uppercase tracking-wide">Replace</span>
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="$1, $2, $&, $<name>…"
            className="bg-transparent py-1.5 text-sm font-mono text-emerald-300 focus:outline-none flex-1"
          />
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

      <div className="flex flex-col min-h-0 bg-neutral-950 border border-neutral-800 border-dashed rounded-lg overflow-hidden shrink-0 max-h-48">
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500 border-b border-neutral-800 flex items-center justify-between">
          <span>Output · replace result</span>
          {replaceError && <span className="text-red-400 normal-case">{replaceError}</span>}
          {!replaceError && output && <CopyButton getText={() => output} />}
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {output ? (
            <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap break-words">
              {output}
            </pre>
          ) : (
            <span className="text-xs text-neutral-600">
              {pattern
                ? 'Result will appear here — type a replace template in the “Replace” box above'
                : 'Result will appear here — enter a pattern first'}
            </span>
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
