import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SwapButton } from '../components/SwapButton';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';

// Renderer is a browser context (nodeIntegration:false) → no Node Buffer.
// Use TextEncoder/TextDecoder for UTF-8-safe base64.
const enc = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const dec = (s: string) => {
  const bin = atob(s.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const out = new TextDecoder().decode(bytes);
  if (!out) throw new Error('Invalid Base64 input');
  return out;
};

function Component() {
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'encode' | 'decode'>('encode');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      return { output: dir === 'encode' ? enc(input) : dec(input), error: null };
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
      <SplitPane orientation="row" id="base64">
        <IOPanel
          title={dir === 'encode' ? 'Plain text' : 'Base64'}
          value={input}
          onChange={setInput}
          placeholder={dir === 'encode' ? 'Hello world' : 'SGVsbG8gd29ybGQ='}
          actions={
            <>
              <SwapButton
                onClick={() => {
                  setInput(output);
                  setDir((d) => (d === 'encode' ? 'decode' : 'encode'));
                }}
                disabled={!output}
              />
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={dir === 'encode' ? 'Base64' : 'Plain text'}
          value={output}
          readOnly
          error={error}
        />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'base64',
    name: 'Base64 Encode/Decode',
    category: 'Encode',
    keywords: ['base64', 'b64', 'encode', 'decode']
  },
  component: Component
});
