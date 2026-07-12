import { useMemo, useState } from 'react';
import { useToolState } from '../lib/tool-state';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SwapButton } from '../components/SwapButton';
import { SplitPane } from '../components/SplitPane';
import { registerTool } from '../lib/registry';

function Component() {
  const [state, setState] = useToolState<{ input: string; dir: 'encode' | 'decode'; component: 'full' | 'component' }>('url-encode', {
    input: '',
    dir: 'encode',
    component: 'full'
  });
  const { input, dir, component } = state;
  const setInput = (v: string) => setState({ input: v });
  const setDir = (v: 'encode' | 'decode') => setState({ dir: v });
  const setComponent = (v: 'full' | 'component') => setState({ component: v });

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (dir === 'encode') {
        return {
          output:
            component === 'component'
              ? encodeURIComponent(input)
              : encodeURI(input),
          error: null
        };
      }
      return {
        output:
          component === 'component' ? decodeURIComponent(input) : decodeURI(input),
        error: null
      };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir, component]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
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
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
          <button
            onClick={() => setComponent('full')}
            className={`px-3 py-1 text-xs ${component === 'full' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Full URI
          </button>
          <button
            onClick={() => setComponent('component')}
            className={`px-3 py-1 text-xs ${component === 'component' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Component
          </button>
        </div>
      </div>
      <SplitPane orientation="row" id="url-encode">
        <IOPanel
          title="Input"
          value={input}
          onChange={setInput}
          placeholder="https://example.com/?q=hello world"
          actions={
            <>
              <SwapButton
                onClick={() => {
                  setInput(output);
                  setDir(dir === 'encode' ? 'decode' : 'encode');
                }}
                disabled={!output}
              />
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
    id: 'url-encode',
    name: 'URL Encode/Decode',
    category: 'Encode',
    keywords: ['url', 'uri', 'percent', 'encode', 'decode']
  },
  component: Component
});
