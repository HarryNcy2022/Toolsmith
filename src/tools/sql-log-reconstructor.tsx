import { useEffect, useMemo, useState } from 'react';
import { sql } from '@codemirror/lang-sql';
import { format as formatSQL, type SqlLanguage } from 'sql-formatter';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { usePendingInput } from '../lib/pending-input';
import {
  reconstructSqlLog,
  type SqlLiteralDialect,
  type SqlLogFormat
} from '../lib/sql-log-reconstructor';

const FORMATTER_DIALECTS: Record<SqlLiteralDialect, SqlLanguage> = {
  generic: 'sql',
  oracle: 'plsql',
  postgresql: 'postgresql'
};

function Component() {
  const [input, setInput] = useState(() => (
    usePendingInput.getState().consumePendingInput('sql-log-reconstructor') ?? ''
  ));
  const [format, setFormat] = useState<SqlLogFormat>('auto');
  const [dialect, setDialect] = useState<SqlLiteralDialect>('generic');
  const [beautify, setBeautify] = useState(true);

  useEffect(() => {
    const pending = usePendingInput.getState().consumePendingInput('sql-log-reconstructor');
    if (pending !== null) setInput(pending);
    return usePendingInput.subscribe((state, previous) => {
      if (
        state.pending['sql-log-reconstructor'] !== undefined &&
        state.pending['sql-log-reconstructor'] !== previous.pending['sql-log-reconstructor']
      ) {
        const value = usePendingInput.getState().consumePendingInput('sql-log-reconstructor');
        if (value !== null) setInput(value);
      }
    });
  }, []);

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: null, detected: '', bindCount: 0, warnings: [] as string[] };
    try {
      const reconstructed = reconstructSqlLog(input, format, dialect);
      let output = reconstructed.reconstructedSql;
      const warnings = [...reconstructed.warnings];
      if (beautify) {
        try {
          output = formatSQL(output, {
            language: FORMATTER_DIALECTS[dialect],
            keywordCase: 'upper'
          });
        } catch {
          warnings.push('SQL formatting failed; showing reconstructed SQL unchanged.');
        }
      }
      return {
        output,
        error: null,
        detected: reconstructed.format,
        bindCount: reconstructed.parameters.length,
        warnings
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
        detected: '',
        bindCount: 0,
        warnings: [] as string[]
      };
    }
  }, [input, format, dialect, beautify]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Log format
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as SqlLogFormat)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value="auto">Auto detect</option>
            <option value="mybatis">MyBatis / JDBC</option>
            <option value="hibernate">Hibernate</option>
            <option value="manual">Manual SQL + parameters</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Dialect
          <select
            value={dialect}
            onChange={(event) => setDialect(event.target.value as SqlLiteralDialect)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value="generic">Generic SQL</option>
            <option value="oracle">Oracle</option>
            <option value="postgresql">PostgreSQL</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={beautify}
            onChange={(event) => setBeautify(event.target.checked)}
            className="rounded border-neutral-700 bg-neutral-900"
          />
          Beautify
        </label>
        {result.detected && (
          <span className="text-xs text-neutral-500">
            Detected: {result.detected} · {result.bindCount} bind(s)
          </span>
        )}
      </div>
      {result.warnings.length > 0 && (
        <div className="shrink-0 px-3 py-2 rounded border border-amber-900/60 bg-amber-950/30 text-xs text-amber-400">
          {result.warnings.join(' ')}
        </div>
      )}
      <SplitPane orientation="row" id="sql-log-reconstructor">
        <IOPanel
          title="SQL log"
          value={input}
          onChange={setInput}
          placeholder={'Preparing: SELECT * FROM users WHERE id = ?\nParameters: 42(Integer)'}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title="Debug reconstruction"
          value={result.output}
          readOnly
          extensions={[sql()]}
          error={result.error}
          placeholder="Reconstructed SQL appears here"
        />
      </SplitPane>
      <p className="shrink-0 text-[11px] text-neutral-600">
        Debug reconstruction only. Driver conversions, time zones, binary values, and execution plans may differ from prepared execution.
      </p>
    </div>
  );
}

registerTool({
  meta: {
    id: 'sql-log-reconstructor',
    name: 'SQL Log Reconstructor',
    category: 'Convert',
    keywords: ['sql', 'log', 'bind', 'prepared statement', 'hibernate', 'mybatis', 'jdbc']
  },
  component: Component
});
