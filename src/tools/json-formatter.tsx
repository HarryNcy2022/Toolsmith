import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { json } from '@codemirror/lang-json';

type Indent = 2 | 4 | 0;

/** Recursively sort object keys at every depth; arrays keep their order. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Lightweight JSON repair pass for common copy-paste artifacts. Off by default
 * so strict validation still matters. Covers: trailing commas and Python-style
 * True/False/None literals. (NaN/Infinity/single-quotes need `jsonrepair`.)
 *
 * Walks char-by-char tracking string boundaries so trailing-comma removal
 * never corrupts JSON string values (e.g. `"hello,]}"` stays untouched).
 */
function autoRepair(input: string): string {
  let result = '';
  let inString = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    // Toggle inString on unescaped double-quote (even preceding backslashes)
    if (ch === '"') {
      let bs = 0;
      for (let j = i - 1; j >= 0 && input[j] === '\\'; j--) bs++;
      if (bs % 2 === 0) inString = !inString;
    }
    if (inString) {
      result += ch;
    } else if (ch === ',') {
      // Skip comma if followed by optional whitespace then } or ]
      let j = i + 1;
      while (j < input.length && (input[j] === ' ' || input[j] === '\t' || input[j] === '\n' || input[j] === '\r')) j++;
      if (j < input.length && (input[j] === '}' || input[j] === ']')) continue;
      result += ch;
    } else {
      result += ch;
    }
  }
  return result
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');
}

function prettify(
  input: string,
  indent: Indent,
  opts: { sortKeys: boolean; autoRepair: boolean }
): { output: string; error: string | null } {
  try {
    const src = opts.autoRepair ? autoRepair(input) : input;
    let parsed: unknown = JSON.parse(src);
    if (opts.sortKeys) parsed = sortKeys(parsed);
    return { output: JSON.stringify(parsed, null, indent === 0 ? '\t' : indent), error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e) };
  }
}

function minify(
  input: string,
  opts: { sortKeys: boolean; autoRepair: boolean }
): { output: string; error: string | null } {
  try {
    const src = opts.autoRepair ? autoRepair(input) : input;
    let parsed: unknown = JSON.parse(src);
    if (opts.sortKeys) parsed = sortKeys(parsed);
    return { output: JSON.stringify(parsed), error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e) };
  }
}

function Component() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<Indent>(2);
  const [mode, setMode] = useState<'prettify' | 'minify'>('prettify');
  const [sortKeysOn, setSortKeysOn] = useState(false);
  const [autoRepairOn, setAutoRepairOn] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    const opts = { sortKeys: sortKeysOn, autoRepair: autoRepairOn };
    return mode === 'prettify' ? prettify(input, indent, opts) : minify(input, opts);
  }, [input, indent, mode, sortKeysOn, autoRepairOn]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
          <button
            onClick={() => setMode('prettify')}
            className={`px-3 py-1 text-xs ${mode === 'prettify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Prettify
          </button>
          <button
            onClick={() => setMode('minify')}
            className={`px-3 py-1 text-xs ${mode === 'minify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Minify
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value) as Indent)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={0}>Tab</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={sortKeysOn}
            onChange={(e) => setSortKeysOn(e.target.checked)}
            className="accent-blue-600"
          />
          Sort keys
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRepairOn}
            onChange={(e) => setAutoRepairOn(e.target.checked)}
            className="accent-blue-600"
          />
          Auto-repair
        </label>
      </div>
      <SplitPane orientation="row" id="json-formatter">
        <IOPanel
          title="Input"
          value={input}
          onChange={setInput}
          placeholder='{"hello":"world"}'
          extensions={[json()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title="Output"
          value={output}
          readOnly
          placeholder="Formatted JSON"
          extensions={[json()]}
          error={error}
        />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'json-formatter',
    name: 'JSON Format/Validate',
    category: 'Format',
    keywords: ['json', 'pretty', 'minify', 'validate', 'beautify']
  },
  component: Component
});
