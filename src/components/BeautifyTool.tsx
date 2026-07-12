import { useEffect, useState } from 'react';
import { usePendingInput } from '../lib/pending-input';
import { useToolState } from '../lib/tool-state';
import { IOPanel, PasteButton, ClearButton } from './IOPanel';
import { registerTool } from '../lib/registry';
import type { ToolMeta } from '../types';
import { SplitPane } from './SplitPane';

export interface BeautifyOptions {
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  extensions?: any[];
  /** hide the minify button (some libs have no real minify, e.g. xml-formatter) */
  noMinify?: boolean;
}

/** Indent width: 2 or 4 spaces, or 0 = tab. (Mirrors json-formatter's convention.) */
export type IndentOption = 2 | 4 | 0;

/** Threaded into every beautify/minify fn so each lib can map it to its own knob. */
export interface BeautifyCtx {
  indent: IndentOption;
}

export type BeautifyFns = {
  // fns may be sync or return a Promise (e.g. html-minifier-terser is async).
  // `ctx` carries the indent selection; minify fns accept it for a uniform call
  // site but typically ignore it (minified output has no indentation).
  beautify: (input: string, ctx: BeautifyCtx) => string | Promise<string>;
  minify?: (input: string, ctx: BeautifyCtx) => string | Promise<string>;
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
    const pending = usePendingInput.getState().consumePendingInput(meta.id);
    const [state, setState] = useToolState(
      meta.id,
      {
        input: '',
        mode: 'beautify' as 'beautify' | 'minify',
        indent: 2 as IndentOption
      },
      pending !== null ? { input: pending } : undefined
    );
    const { input, mode, indent } = state;
    const setInput = (v: string) => setState({ input: v });
    const setMode = (v: 'beautify' | 'minify') => setState({ mode: v });
    const setIndent = (v: IndentOption) => setState({ indent: v });

    // G6: consume pending input even when component stays mounted (same-tool detect)
    useEffect(() => {
      const pending = usePendingInput.getState().consumePendingInput(meta.id);
      if (pending !== null) setInput(pending);
      const unsub = usePendingInput.subscribe((s, prev) => {
        if (s.pending[meta.id] !== undefined && s.pending[meta.id] !== prev.pending[meta.id]) {
          const val = usePendingInput.getState().consumePendingInput(meta.id);
          if (val !== null) setInput(val);
        }
      });
      return unsub;
    }, []);

    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!input) {
        setOutput('');
        setError(null);
        return;
      }
      let cancelled = false;
      const ctx: BeautifyCtx = { indent };
      const fn = mode === 'minify' ? fns.minify : fns.beautify;
      if (mode === 'minify' && !fn) {
        setOutput(input);
        return;
      }
      const run = fn as (s: string, c: BeautifyCtx) => string | Promise<string>;
      try {
        const result = run(input, ctx);
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
    }, [input, mode, indent]);

    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded border border-neutral-800 overflow-hidden">
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
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            Indent
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value) as IndentOption)}
              className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-200"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={0}>Tab</option>
            </select>
          </label>
        </div>
        <SplitPane orientation="row" id={meta.id}>
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
        </SplitPane>
      </div>
    );
  }

  registerTool({ meta, component: Component });
}

