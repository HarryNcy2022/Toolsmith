import { useMemo, useState } from 'react';
import { format as fmtSQL, type SqlLanguage } from 'sql-formatter';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';
import { sql } from '@codemirror/lang-sql';

const DIALECTS: SqlLanguage[] = ['sql', 'mysql', 'postgresql', 'sqlite', 'mariadb', 'bigquery', 'tsql'];

function minifySQL(input: string): string {
  // sql-formatter has no dense mode; strip extra whitespace as a lightweight minify.
  return input
    .replace(/\s*([(),])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function Component() {
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState<SqlLanguage>('sql');
  const [mode, setMode] = useState<'beautify' | 'minify'>('beautify');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'minify') return { output: minifySQL(input), error: null };
      const out = fmtSQL(input, {
        language: dialect,
        keywordCase: 'upper',
        tabWidth: 2
      });
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dialect, mode]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
          <button
            onClick={() => setMode('beautify')}
            className={`px-3 py-1 text-xs ${mode === 'beautify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Beautify
          </button>
          <button
            onClick={() => setMode('minify')}
            className={`px-3 py-1 text-xs ${mode === 'minify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Minify
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Dialect
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlLanguage)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            {DIALECTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title="Input"
          value={input}
          onChange={setInput}
          placeholder="SELECT * FROM users WHERE id=1"
          extensions={[sql()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel title="Output" value={output} readOnly extensions={[sql()]} error={error} />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'sql-format',
    name: 'SQL Formatter',
    category: 'Format',
    keywords: ['sql', 'format', 'beautify', 'query']
  },
  component: Component
});
