import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';
import { IndentOption } from '../components/BeautifyTool';
import { json } from '@codemirror/lang-json';

/**
 * Recursively flatten nested objects/arrays to dotted keys so papaparse doesn't
 * stringify them as `[object Object]`. `{"a":{"b":1}}` → `{"a.b":1}`,
 * arrays → `{"a.0":…}`. Non-plain values are JSON-stringified so they survive
 * the round trip as scalars.
 */
function flatten(value: unknown, prefix: string, out: Record<string, string>): void {
  if (value === null || typeof value !== 'object') {
    out[prefix] = String(value);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out[prefix] = '[]';
      return;
    }
    value.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
    return;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    out[prefix] = '{}';
    return;
  }
  for (const k of keys) {
    const next = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v !== null && typeof v === 'object') {
      flatten(v, next, out);
    } else if (typeof v === 'string') {
      out[next] = v;
    } else {
      out[next] = JSON.stringify(v);
    }
  }
}

function flattenRow(row: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  flatten(row, '', out);
  return out;
}

function Component() {
  const [state, setState] = useToolState<{ input: string; dir: 'json2csv' | 'csv2json'; indent: IndentOption; flattenNested: boolean }>('json-csv', { input: '', dir: 'json2csv', indent: 2, flattenNested: false });
  const input = state.input; const setInput = (v: string) => setState({ input: v });
  const dir = state.dir; const setDir = (v: 'json2csv' | 'csv2json') => setState({ dir: v });
  const indent = state.indent; const setIndent = (v: IndentOption) => setState({ indent: v });
  const flattenNested = state.flattenNested; const setFlattenNested = (v: boolean) => setState({ flattenNested: v });

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (dir === 'json2csv') {
        const data = JSON.parse(input);
        const arr = Array.isArray(data) ? data : [data];
        const rows = flattenNested ? arr.map(flattenRow) : arr;
        return { output: Papa.unparse(rows), error: null };
      }
      const res = Papa.parse(input, { header: true, skipEmptyLines: true });
      return { output: JSON.stringify(res.data, null, indent === 0 ? '\t' : indent), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir, indent, flattenNested]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
          <button
            onClick={() => setDir('json2csv')}
            className={`px-3 py-1 text-xs ${dir === 'json2csv' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            JSON → CSV
          </button>
          <button
            onClick={() => setDir('csv2json')}
            className={`px-3 py-1 text-xs ${dir === 'csv2json' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            CSV → JSON
          </button>
        </div>
        {dir === 'csv2json' && (
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            Indent
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value) as 2 | 4 | 0)}
              className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={0}>Tab</option>
            </select>
          </label>
        )}
        {dir === 'json2csv' && (
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={flattenNested}
              onChange={(e) => setFlattenNested(e.target.checked)}
              className="accent-blue-600"
            />
            Flatten nested
          </label>
        )}
      </div>
      <SplitPane orientation="row" id="json-csv">
        <IOPanel
          title={dir === 'json2csv' ? 'JSON' : 'CSV'}
          value={input}
          onChange={setInput}
          placeholder={dir === 'json2csv' ? '[{"a":1,"b":2}]' : 'a,b\n1,2'}
          extensions={dir === 'json2csv' ? [json()] : undefined}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={dir === 'json2csv' ? 'CSV' : 'JSON'}
          value={output}
          readOnly
          extensions={dir === 'json2csv' ? undefined : [json()]}
          error={error}
        />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'json-csv',
    name: 'JSON ↔ CSV',
    category: 'Convert',
    keywords: ['json', 'csv', 'convert', 'table']
  },
  component: Component
});
