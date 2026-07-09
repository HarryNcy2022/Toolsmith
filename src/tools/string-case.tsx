import { useMemo, useState } from 'react';
import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase
} from 'change-case';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

const CASES: { label: string; fn: (s: string) => string }[] = [
  { label: 'camelCase', fn: (s) => camelCase(s) },
  { label: 'PascalCase', fn: (s) => pascalCase(s) },
  { label: 'snake_case', fn: (s) => snakeCase(s) },
  { label: 'CONSTANT_CASE', fn: (s) => constantCase(s) },
  { label: 'kebab-case', fn: (s) => kebabCase(s) },
  { label: 'dot.case', fn: (s) => dotCase(s) },
  { label: 'path/case', fn: (s) => pathCase(s) },
  { label: 'Capital Case', fn: (s) => capitalCase(s) },
  { label: 'Sentence case', fn: (s) => sentenceCase(s) },
  { label: 'no case', fn: (s) => noCase(s) },
  { label: 'lower case', fn: (s) => noCase(s).toLowerCase() },
  { label: 'UPPER CASE', fn: (s) => noCase(s).toUpperCase() }
];

function Component() {
  const [input, setInput] = useState('');
  const [lineByLine, setLineByLine] = useState(true);

  const results = useMemo(
    () =>
      CASES.map((c) => ({
        ...c,
        out: input ? (lineByLine ? input.split('\n').map((l) => c.fn(l)).join('\n') : c.fn(input)) : ''
      })),
    [input, lineByLine]
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter some text…"
        rows={3}
        className="shrink-0 px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none"
      />
      <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer shrink-0">
        <input type="checkbox" checked={lineByLine} onChange={(e) => setLineByLine(e.target.checked)}
          className="rounded border-neutral-700 bg-neutral-800" />
        Line-by-line
      </label>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 flex-1 min-h-0 overflow-auto">
        {results.map(({ label, out }) => (
          <div
            key={label}
            className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 flex flex-col gap-1.5"
          >
            <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
            <div className="text-sm font-mono text-neutral-200 break-all whitespace-pre-wrap min-h-[3em]">
              {out || <span className="text-neutral-600">—</span>}
            </div>
            <CopyButton getText={() => out} disabled={!out} />
          </div>
        ))}
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'string-case',
    name: 'String Case',
    category: 'Convert',
    keywords: ['case', 'camel', 'snake', 'kebab', 'pascal']
  },
  component: Component
});
