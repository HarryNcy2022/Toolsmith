import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';

type SortBy = 'az' | 'za' | 'length-asc' | 'length-desc' | 'natural' | 'numeric';

function process(input: string, sortBy: SortBy, opts: { dedupe: boolean; trim: boolean; reverse: boolean; removeEmpty: boolean }): string {
  let lines = input.split(/\r?\n/);
  if (opts.removeEmpty) lines = lines.filter((l) => l.trim() !== '');
  if (opts.trim) lines = lines.map((l) => l.trim());
  if (opts.dedupe) lines = Array.from(new Set(lines));

  const cmp: Record<SortBy, (a: string, b: string) => number> = {
    az: (a, b) => a.localeCompare(b),
    za: (a, b) => b.localeCompare(a),
    'length-asc': (a, b) => a.length - b.length || a.localeCompare(b),
    'length-desc': (a, b) => b.length - a.length || a.localeCompare(b),
    natural: (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    numeric: (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)
  };
  lines.sort(cmp[sortBy]);
  if (opts.reverse) lines.reverse();
  return lines.join('\n');
}

function Component() {
  const [state, setState] = useToolState<{
    input: string; sortBy: SortBy; dedupe: boolean; trim: boolean; reverse: boolean; removeEmpty: boolean;
  }>('line-sort', { input: '', sortBy: 'az', dedupe: false, trim: false, reverse: false, removeEmpty: false });
  const input = state.input; const setInput = (v: string) => setState({ input: v });
  const sortBy = state.sortBy; const setSortBy = (v: SortBy) => setState({ sortBy: v });
  const dedupe = state.dedupe; const setDedupe = (v: boolean) => setState({ dedupe: v });
  const trim = state.trim; const setTrim = (v: boolean) => setState({ trim: v });
  const reverse = state.reverse; const setReverse = (v: boolean) => setState({ reverse: v });
  const removeEmpty = state.removeEmpty; const setRemoveEmpty = (v: boolean) => setState({ removeEmpty: v });

  const output = useMemo(() => {
    if (!input) return '';
    return process(input, sortBy, { dedupe, trim, reverse, removeEmpty });
  }, [input, sortBy, dedupe, trim, reverse, removeEmpty]);

  const inCount = input ? input.split(/\r?\n/).length : 0;
  const outCount = output ? output.split(/\r?\n/).length : 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
        <label className="flex items-center gap-1.5 text-neutral-400">
          Sort
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="length-asc">Length ↑</option>
            <option value="length-desc">Length ↓</option>
            <option value="natural">Natural</option>
            <option value="numeric">Numeric</option>
          </select>
        </label>
        {[
          ['dedupe', dedupe, setDedupe],
          ['trim', trim, setTrim],
          ['reverse', reverse, setReverse],
          ['remove empty', removeEmpty, setRemoveEmpty]
        ].map(([label, val, setVal]) => (
          <label key={label as string} className="flex items-center gap-1.5 text-neutral-400">
            <input
              type="checkbox"
              checked={val as boolean}
              onChange={(e) => (setVal as (b: boolean) => void)(e.target.checked)}
              className="accent-blue-500"
            />
            {label as string}
          </label>
        ))}
      </div>
      <SplitPane orientation="row" id="line-sort">
        <IOPanel
          title={`Input (${inCount} lines)`}
          value={input}
          onChange={setInput}
          placeholder="one line per row"
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel title={`Output (${outCount} lines)`} value={output} readOnly />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'line-sort',
    name: 'Line Sort / Dedupe',
    category: 'Inspect',
    keywords: ['sort', 'dedupe', 'unique', 'lines', 'list']
  },
  component: Component
});
