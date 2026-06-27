import { useEffect, useState } from 'react';
import { quicktype, jsonInputForTargetLanguage, InputData } from 'quicktype-core';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';

const TARGETS = [
  'typescript',
  'go',
  'rust',
  'java',
  'csharp',
  'python',
  'swift',
  'kotlin',
  'ruby',
  'cpp',
  'schema-json',
  'elm'
] as const;

async function convert(jsonStr: string, lang: string, topName: string): Promise<string> {
  // validate JSON first so we get a friendly error
  JSON.parse(jsonStr);
  const jsonInput = jsonInputForTargetLanguage(lang as any);
  await jsonInput.addSource({ name: topName, samples: [jsonStr] });
  const inputData = new InputData();
  inputData.addInput(jsonInput);
  const result = await quicktype({
    // quicktype's `lang` is a strict union of supported IDs; our TARGETS list is a subset.
    lang: lang as any,
    inputData,
    rendererOptions: { 'just-types': 'true' } as any
  });
  return (result.lines as string[]).join('\n');
}

function Component() {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<string>('typescript');
  const [out, setOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // quicktype is async; run via effect instead of useMemo
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
    convert(input, target, 'Root')
      .then((code) => {
        if (!cancelled) {
          setOut(code);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setOut('');
          setError(e instanceof Error ? e.message : String(e));
        }
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
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {busy && <span className="text-neutral-600 ml-2">converting…</span>}
      </label>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title="JSON"
          value={input}
          onChange={setInput}
          placeholder='{"name":"Alice","age":30,"tags":["a","b"]}'
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel title="Generated types" value={out} readOnly placeholder="Type definitions appear here" error={error} />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'json-to-code',
    name: 'JSON → Code',
    category: 'Convert',
    keywords: ['json', 'code', 'types', 'schema', 'quicktype', 'convert']
  },
  component: Component
});
