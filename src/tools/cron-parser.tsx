import { useMemo } from 'react';
import cronParser from 'cron-parser';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';
import { useToolState } from '../lib/tool-state';

const SAMPLES = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Sun 5:30am', value: '30 5 * * 0' }
];

const FIELD_NAMES = ['minute', 'hour', 'day-of-month', 'month', 'day-of-week'];

function describe(expr: string): {
  fields?: string[];
  next?: string[];
  prev?: string;
  error?: string;
} {
  try {
    const it = cronParser.parse(expr, { currentDate: new Date() });
    const next5: string[] = [];
    for (let i = 0; i < 5; i++) {
      const iso = it.next().toISOString();
      if (iso) next5.push(iso);
    }
    const fields = FIELD_NAMES.map((name) => {
      const key = name === 'day-of-month' ? 'dayOfMonth' : name === 'day-of-week' ? 'dayOfWeek' : name;
      const f = (it.fields as any)[key];
      // cron-parser v5 exposes each field as a class instance (e.g. CronMinute);
      // the raw number[] lives at `.values`. v4 returned the array directly, so
      // handle both shapes for safety.
      const arr = f && typeof f === 'object' && 'values' in f ? f.values : f;
      return Array.isArray(arr) ? arr.join(', ') : String(arr);
    });
    let prev: string | undefined;
    try {
      const prevIt = cronParser.parse(expr, { currentDate: new Date() });
      prev = prevIt.prev().toISOString() ?? undefined;
    } catch {
      /* ignore prev error */
    }
    return { fields, next: next5, prev };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function Component() {
  const [state, setState] = useToolState<{ input: string }>('cron-parser', { input: '' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });

  const result = useMemo(() => (input.trim() ? describe(input.trim()) : null), [input]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Examples:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setInput(s.value)}
            className="px-2 py-0.5 text-xs rounded border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200 font-mono"
          >
            {s.label} <span className="text-neutral-600">{s.value}</span>
          </button>
        ))}
      </div>
      <SplitPane orientation="row" id="cron-parser">
        <IOPanel
          title="Cron expression"
          value={input}
          onChange={setInput}
          placeholder="*/5 * * * *  (min hour day month weekday)"
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <div className="flex flex-col min-h-0 flex-1 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
            Breakdown
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
            {!result ? (
              <span className="text-sm text-neutral-600">Enter a cron expression</span>
            ) : result.error ? (
              <div className="text-sm text-red-400 font-mono">{result.error}</div>
            ) : (
              <>
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Fields</div>
                  <div className="space-y-1">
                    {FIELD_NAMES.map((name, i) => (
                      <div key={name} className="flex items-center gap-3 py-1 border-b border-neutral-800/60">
                        <div className="w-32 shrink-0 text-xs text-neutral-500">{name}</div>
                        <code className="text-sm font-mono text-neutral-200 break-all">{result.fields?.[i]}</code>
                      </div>
                    ))}
                  </div>
                </div>
                {result.prev && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Last run</div>
                    <code className="text-sm font-mono text-emerald-400">{result.prev}</code>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Next 5 runs</div>
                  <div className="space-y-1">
                    {result.next?.map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-neutral-600 w-6 text-xs">#{i + 1}</span>
                        <code className="text-sm font-mono text-blue-400 flex-1 break-all">{t}</code>
                        <CopyButton getText={() => t} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'cron-parser',
    name: 'Cron Parser',
    category: 'Inspect',
    keywords: ['cron', 'crontab', 'schedule', 'parser']
  },
  component: Component
});
