import { useMemo } from 'react';
import { useToolState } from '../lib/tool-state';
import { registerTool } from '../lib/registry';
import { SplitPane } from '../components/SplitPane';
import { CopyButton } from '../components/CopyButton';
import { highlightRegex, replaceRegex } from '../lib/regexp';

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;

const FLAG_HELP: Record<string, string> = {
  g: 'global — find all matches (not just the first)',
  i: 'ignore case — case-insensitive match',
  m: 'multiline — ^ and $ match line boundaries, not just string ends',
  s: 'dotAll — . matches newlines too',
  u: 'unicode — treat the pattern as Unicode (code points, code units for {...})',
  y: 'sticky — match at the current position (lastIndex)'
};

function Component() {
  const [state, setState] = useToolState('regexp-tester', {
    pattern: '',
    flags: ['g', 'i'] as string[],
    text: '',
    replacement: ''
  });
  const { pattern, flags, text, replacement } = state;
  const setPattern = (v: string) => setState({ pattern: v });
  const setText = (v: string) => setState({ text: v });
  const setReplacement = (v: string) => setState({ replacement: v });

  const flagStr = useMemo(() => (flags as string[]).join(''), [flags]);

  const { html, matches, error } = useMemo(
    () => highlightRegex(text, pattern, flagStr),
    [text, pattern, flagStr]
  );

  // VS Code-style pattern → replace: substitute every highlighted match with
  // the user's replacement template ($1, $2, $&, $<name>, $$, $`, $' all work).
  // Mirror the Matches panel exactly: force the global flag, and skip
  // zero-length matches so the replace count equals the highlighted count
  // (otherwise greedy patterns like (.*) would inject an extra substitution
  // for the trailing empty match). Empty replacement deletes matches.
  const { output, error: replaceError } = useMemo(
    () => replaceRegex(text, pattern, flagStr, replacement),
    [text, pattern, flagStr, replacement]
  );

  function toggleFlag(f: string) {
    setState({ flags: flags.includes(f) ? flags.filter((x) => x !== f) : [...flags, f] });
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
                flags.includes(f)
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

      <SplitPane orientation="row" id="regexp-tester">
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
      </SplitPane>

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
