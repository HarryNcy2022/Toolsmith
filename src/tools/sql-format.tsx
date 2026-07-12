import { useMemo, useState } from 'react';
import { format as fmtSQL, type SqlLanguage } from 'sql-formatter';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';
import { sql } from '@codemirror/lang-sql';

const DIALECTS: SqlLanguage[] = ['sql', 'mysql', 'postgresql', 'sqlite', 'mariadb', 'bigquery', 'tsql'];

// Indent width: 2 or 4 spaces, or 0 = tab.
type IndentOption = 2 | 4 | 0;
type CaseOption = 'preserve' | 'upper' | 'lower';

function minifySQL(input: string): string {
  // sql-formatter has no dense mode; strip extra whitespace as a lightweight minify.
  return input
    .replace(/\s*([(),])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function Component() {
  const [state, setState] = useToolState<{
    input: string; dialect: SqlLanguage; mode: 'beautify' | 'minify'; indent: IndentOption;
    keywordCase: CaseOption; identifierCase: CaseOption;
  }>('sql-format', { input: '', dialect: 'sql', mode: 'beautify', indent: 2, keywordCase: 'upper', identifierCase: 'preserve' });
  const input = state.input; const setInput = (v: string) => setState({ input: v });
  const dialect = state.dialect; const setDialect = (v: SqlLanguage) => setState({ dialect: v });
  const mode = state.mode; const setMode = (v: 'beautify' | 'minify') => setState({ mode: v });
  const indent = state.indent; const setIndent = (v: IndentOption) => setState({ indent: v });
  const keywordCase = state.keywordCase; const setKeywordCase = (v: CaseOption) => setState({ keywordCase: v });
  const identifierCase = state.identifierCase; const setIdentifierCase = (v: CaseOption) => setState({ identifierCase: v });

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'minify') return { output: minifySQL(input), error: null };
      const out = fmtSQL(input, {
        language: dialect,
        keywordCase,
        identifierCase,
        tabWidth: indent === 0 ? 4 : indent,
        useTabs: indent === 0
      });
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dialect, mode, indent, keywordCase, identifierCase]);

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
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value) as IndentOption)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={0}>Tab</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Keywords
          <select
            value={keywordCase}
            onChange={(e) => setKeywordCase(e.target.value as CaseOption)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value="upper">UPPER</option>
            <option value="lower">lower</option>
            <option value="preserve">Preserve</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Identifiers
          <select
            value={identifierCase}
            onChange={(e) => setIdentifierCase(e.target.value as CaseOption)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value="preserve">Preserve</option>
            <option value="upper">UPPER</option>
            <option value="lower">lower</option>
          </select>
        </label>
      </div>
      <SplitPane orientation="row" id="sql-format">
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
      </SplitPane>
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
