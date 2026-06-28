import { useEffect, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from './IOPanel';
import { registerTool } from '../lib/registry';
import type { ToolMeta } from '../types';

export interface BeautifyOptions {
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  extensions?: any[];
  /** hide the minify button (some libs have no real minify, e.g. xml-formatter) */
  noMinify?: boolean;
}

export type BeautifyFns = {
  // fns may be sync or return a Promise (e.g. html-minifier-terser is async)
  beautify: (input: string) => string | Promise<string>;
  minify?: (input: string) => string | Promise<string>;
};

/**
 * Shared layout for code beautify/minify tools.
 * Pass beautify + optional minify fns; the toggle and IOPanels are wired for you.
 * Supports both sync and async transform fns.
 */
export function defineBeautifyTool(
  meta: ToolMeta,
  fns: BeautifyFns,
  options: BeautifyOptions = {}
): void {
  function Component() {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'beautify' | 'minify'>('beautify');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!input) {
        setOutput('');
        setError(null);
        return;
      }
      let cancelled = false;
      const fn = mode === 'minify' ? fns.minify : fns.beautify;
      if (mode === 'minify' && !fn) {
        setOutput(input);
        return;
      }
      const run = fn as (s: string) => string | Promise<string>;
      try {
        const result = run(input);
        if (typeof result === 'string') {
          if (!cancelled) {
            setOutput(result);
            setError(null);
          }
        } else {
          result
            .then((out) => {
              if (!cancelled) {
                setOutput(out);
                setError(null);
              }
            })
            .catch((e) => {
              if (!cancelled) {
                setOutput('');
                setError(e instanceof Error ? e.message : String(e));
              }
            });
        }
      } catch (e) {
        if (!cancelled) {
          setOutput('');
          setError(e instanceof Error ? e.message : String(e));
        }
      }
      return () => {
        cancelled = true;
      };
    }, [input, mode]);

    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="inline-flex rounded border border-neutral-800 overflow-hidden self-start shrink-0">
          <button
            onClick={() => setMode('beautify')}
            className={`px-3 py-1 text-xs ${mode === 'beautify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
          >
            Beautify
          </button>
          {!options.noMinify && fns.minify && (
            <button
              onClick={() => setMode('minify')}
              className={`px-3 py-1 text-xs ${mode === 'minify' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
            >
              Minify
            </button>
          )}
        </div>
        <div className="flex gap-3 flex-1 min-h-0">
          <IOPanel
            title="Input"
            value={input}
            onChange={setInput}
            placeholder={options.inputPlaceholder ?? 'Paste code…'}
            extensions={options.extensions}
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
            placeholder={options.outputPlaceholder ?? 'Formatted output'}
            extensions={options.extensions}
            error={error}
          />
        </div>
      </div>
    );
  }

  registerTool({ meta, component: Component });
}

