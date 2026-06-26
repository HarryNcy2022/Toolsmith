import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';
import { json } from '@codemirror/lang-json';

type Indent = 2 | 4 | 0;

function prettify(input: string, indent: Indent): { output: string; error: string | null } {
  try {
    const parsed = JSON.parse(input);
    return { output: JSON.stringify(parsed, null, indent === 0 ? '\t' : indent), error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e) };
  }
}

function minify(input: string): { output: string; error: string | null } {
  try {
    return { output: JSON.stringify(JSON.parse(input)), error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e) };
  }
}

function Component() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<Indent>(2);
  const [mode, setMode] = useState<'prettify' | 'minify'>('prettify');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    return mode === 'prettify' ? prettify(input, indent) : minify(input);
  }, [input, indent, mode]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 shrink-0">
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
          <button
            onClick={() => setMode('prettify')}
            className={`px-3 py-1 text-xs ${mode === 'prettify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Prettify
          </button>
          <button
            onClick={() => setMode('minify')}
            className={`px-3 py-1 text-xs ${mode === 'minify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Minify
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value) as Indent)}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={0}>Tab</option>
          </select>
        </label>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title="Input"
          value={input}
          onChange={setInput}
          placeholder='{"hello":"world"}'
          extensions={[json()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title="Output"
          value={output}
          readOnly
          placeholder="Formatted JSON"
          extensions={[json()]}
          error={error}
        />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'json-formatter',
    name: 'JSON Format/Validate',
    category: 'Format',
    keywords: ['json', 'pretty', 'minify', 'validate', 'beautify']
  },
  component: Component
});
