import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';

// Renderer is a browser context — no Buffer. Use TextEncoder/TextDecoder.
function strToHex(s: string): string {
  const bytes = new TextEncoder().encode(s);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
}

function hexToStr(hex: string): string {
  const cleaned = hex.replace(/0x/gi, '').replace(/[\s,;:]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
    throw new Error('Invalid hex string (need even number of hex digits)');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function Component() {
  const [state, setState] = useToolState<{ input: string; dir: 'text2hex' | 'hex2text' }>('hex-ascii', { input: '', dir: 'text2hex' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });
  const dir = state.dir;
  const setDir = (v: 'text2hex' | 'hex2text') => setState({ dir: v });

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      return {
        output: dir === 'text2hex' ? strToHex(input) : hexToStr(input),
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
          onClick={() => setDir('text2hex')}
          className={`px-3 py-1 text-xs ${dir === 'text2hex' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Text → Hex
        </button>
        <button
          onClick={() => setDir('hex2text')}
          className={`px-3 py-1 text-xs ${dir === 'hex2text' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Hex → Text
        </button>
      </div>
      <SplitPane orientation="row" id="hex-ascii">
        <IOPanel
          title={dir === 'text2hex' ? 'Text' : 'Hex'}
          value={input}
          onChange={setInput}
          placeholder={dir === 'text2hex' ? 'Hello' : '48 65 6c 6c 6f'}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={dir === 'text2hex' ? 'Hex' : 'Text'}
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
    id: 'hex-ascii',
    name: 'Hex ↔ ASCII',
    category: 'Convert',
    keywords: ['hex', 'ascii', 'binary', 'bytes', 'convert']
  },
  component: Component
});
