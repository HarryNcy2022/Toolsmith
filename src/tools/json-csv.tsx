import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';
import { json } from '@codemirror/lang-json';

function Component() {
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'json2csv' | 'csv2json'>('json2csv');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (dir === 'json2csv') {
        const data = JSON.parse(input);
        const arr = Array.isArray(data) ? data : [data];
        return { output: Papa.unparse(arr), error: null };
      }
      const res = Papa.parse(input, { header: true, skipEmptyLines: true });
      return { output: JSON.stringify(res.data, null, 2), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="inline-flex rounded border border-neutral-800 overflow-hidden self-start shrink-0">
        <button
          onClick={() => setDir('json2csv')}
          className={`px-3 py-1 text-xs ${dir === 'json2csv' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          JSON → CSV
        </button>
        <button
          onClick={() => setDir('csv2json')}
          className={`px-3 py-1 text-xs ${dir === 'csv2json' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          CSV → JSON
        </button>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title={dir === 'json2csv' ? 'JSON' : 'CSV'}
          value={input}
          onChange={setInput}
          placeholder={dir === 'json2csv' ? '[{"a":1,"b":2}]' : 'a,b\n1,2'}
          extensions={dir === 'json2csv' ? [json()] : undefined}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={dir === 'json2csv' ? 'CSV' : 'JSON'}
          value={output}
          readOnly
          extensions={dir === 'json2csv' ? undefined : [json()]}
          error={error}
        />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'json-csv',
    name: 'JSON ↔ CSV',
    category: 'Convert',
    keywords: ['json', 'csv', 'convert', 'table']
  },
  component: Component
});
