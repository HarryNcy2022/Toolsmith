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

  const results = useMemo(
    () => CASES.map((c) => ({ ...c, out: input ? c.fn(input) : '' })),
    [input]
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter some text…"
        className="shrink-0 px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
      />
      <div className="flex-1 min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-auto">
        {results.map(({ label, out }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800/60 last:border-0"
          >
            <div className="w-36 shrink-0 text-xs text-neutral-500">{label}</div>
            <code className="flex-1 text-sm font-mono text-neutral-200 break-all">{out || '—'}</code>
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
