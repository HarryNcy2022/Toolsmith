import { useMemo, useState } from 'react';
import yaml from 'js-yaml';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';
import { json } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';

function Component() {
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'yaml2json' | 'json2yaml'>('yaml2json');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (dir === 'yaml2json') {
        const obj = yaml.load(input);
        return { output: JSON.stringify(obj, null, 2), error: null };
      }
      const obj = JSON.parse(input);
      return { output: yaml.dump(obj, { indent: 2, lineWidth: 100 }), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="inline-flex rounded border border-neutral-800 overflow-hidden self-start shrink-0">
        <button
          onClick={() => setDir('yaml2json')}
          className={`px-3 py-1 text-xs ${dir === 'yaml2json' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          YAML → JSON
        </button>
        <button
          onClick={() => setDir('json2yaml')}
          className={`px-3 py-1 text-xs ${dir === 'json2yaml' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          JSON → YAML
        </button>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title={dir === 'yaml2json' ? 'YAML' : 'JSON'}
          value={input}
          onChange={setInput}
          placeholder={dir === 'yaml2json' ? 'key: value' : '{"key":"value"}'}
          extensions={dir === 'yaml2json' ? [yamlLang()] : [json()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={dir === 'yaml2json' ? 'JSON' : 'YAML'}
          value={output}
          readOnly
          extensions={dir === 'yaml2json' ? [json()] : [yamlLang()]}
          error={error}
        />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'yaml-json',
    name: 'YAML ↔ JSON',
    category: 'Convert',
    keywords: ['yaml', 'json', 'convert']
  },
  component: Component
});
