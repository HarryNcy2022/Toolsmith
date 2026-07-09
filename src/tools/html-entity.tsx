import { useMemo, useState } from 'react';
import he from 'he';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { html as htmlLang } from '@codemirror/lang-html';

function Component() {
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'encode' | 'decode'>('encode');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      return {
        output: dir === 'encode' ? he.encode(input) : he.decode(input),
        error: null
      };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="inline-flex rounded border border-neutral-800 overflow-hidden self-start shrink-0">
        <button
          onClick={() => setDir('encode')}
          className={`px-3 py-1 text-xs ${dir === 'encode' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Encode
        </button>
        <button
          onClick={() => setDir('decode')}
          className={`px-3 py-1 text-xs ${dir === 'decode' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Decode
        </button>
      </div>
      <SplitPane orientation="row" id="html-entity">
        <IOPanel
          title="Input"
          value={input}
          onChange={setInput}
          placeholder={dir === 'encode' ? '<a href="#">Tom & Jerry</a>' : '&lt;a&gt;'}
          extensions={[htmlLang()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel title="Output" value={output} readOnly error={error} />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'html-entity',
    name: 'HTML Entity',
    category: 'Encode',
    keywords: ['html', 'entity', 'escape', 'encode']
  },
  component: Component
});
