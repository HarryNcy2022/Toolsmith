import { useEffect, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';

// curlconverter is heavy (bundles a WASM bash parser via tree-sitter, uses
// top-level await). Lazy-load on first use so it lands in its own chunk and
// doesn't bloat the initial bundle or block app startup.
type CurlConverter = {
  toJavaScript(cmd: string): string;
  toPython(cmd: string): string;
  toGo(cmd: string): string;
  toRust(cmd: string): string;
  toJava(cmd: string): string;
  toCSharp(cmd: string): string;
  toPhp(cmd: string): string;
  toRuby(cmd: string): string;
  toSwift(cmd: string): string;
  toDart(cmd: string): string;
  toHTTP(cmd: string): string;
};

let cached: CurlConverter | null = null;
async function load(): Promise<CurlConverter> {
  if (cached) return cached;
  cached = await import('curlconverter');
  return cached;
}

const TARGETS: { id: string; label: string; fn: keyof CurlConverter }[] = [
  { id: 'javascript', label: 'JavaScript', fn: 'toJavaScript' },
  { id: 'python', label: 'Python', fn: 'toPython' },
  { id: 'go', label: 'Go', fn: 'toGo' },
  { id: 'rust', label: 'Rust', fn: 'toRust' },
  { id: 'java', label: 'Java', fn: 'toJava' },
  { id: 'csharp', label: 'C#', fn: 'toCSharp' },
  { id: 'php', label: 'PHP', fn: 'toPhp' },
  { id: 'ruby', label: 'Ruby', fn: 'toRuby' },
  { id: 'swift', label: 'Swift', fn: 'toSwift' },
  { id: 'dart', label: 'Dart', fn: 'toDart' },
  { id: 'http', label: 'HTTP', fn: 'toHTTP' }
];

function Component() {
  const [state, setState] = useToolState<{ input: string; target: string }>('curl-to-code', { input: '', target: 'javascript' });
  const input = state.input; const setInput = (v: string) => setState({ input: v });
  const target = state.target; const setTarget = (v: string) => setState({ target: v });
  const [out, setOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOut('');
      setError(null);
      setBusy(false);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    const t = TARGETS.find((x) => x.id === target);
    if (!t) {
      setError('Unknown target');
      setBusy(false);
      return;
    }
    const fnName = t.fn;
    load()
      .then((mod) => {
        if (cancelled) return;
        try {
          setOut((mod[fnName] as (c: string) => string)(input));
        } catch (e) {
          setOut('');
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [input, target]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <label className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0">
        Target language
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
        >
          {TARGETS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {busy && <span className="text-neutral-600 ml-2">converting…</span>}
      </label>
      <SplitPane orientation="row" id="curl-to-code">
        <IOPanel
          title="cURL command"
          value={input}
          onChange={setInput}
          placeholder={'curl https://api.example.com -H \'Authorization: Bearer x\' -d \'{"k":1}\''}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel title="Output" value={out} readOnly placeholder="Generated code appears here" error={error} />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'curl-to-code',
    name: 'cURL → Code',
    category: 'Convert',
    keywords: ['curl', 'code', 'http', 'request', 'convert']
  },
  component: Component
});
