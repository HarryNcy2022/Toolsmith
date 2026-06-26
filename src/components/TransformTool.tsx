import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from './IOPanel';
import { registerTool } from '../lib/registry';
import type { ToolMeta } from '../types';

export interface TransformOptions {
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  inputExtensions?: any[];
  outputExtensions?: any[];
  /** controls rendered above input */
  controls?: React.ReactNode;
  /** initial input value */
  initialInput?: string;
}

export type TransformFn = (input: string) => string;

/**
 * Generic single-input → single-output tool with shared layout.
 * transform may throw — error is shown in output panel footer.
 */
export function defineTransformTool(
  meta: ToolMeta,
  transform: TransformFn,
  options: TransformOptions = {}
): void {
  function Component() {
    const [input, setInput] = useState(options.initialInput ?? '');

    const { output, error } = useMemo(() => {
      if (!input) return { output: '', error: null as string | null };
      try {
        return { output: transform(input), error: null };
      } catch (e) {
        return { output: '', error: e instanceof Error ? e.message : String(e) };
      }
    }, [input]);

    return (
      <div className="flex flex-col gap-3 h-full">
        {options.controls && <div className="shrink-0">{options.controls}</div>}
        <div className="flex gap-3 flex-1 min-h-0">
          <IOPanel
            title="Input"
            value={input}
            onChange={setInput}
            placeholder={options.inputPlaceholder ?? 'Paste or type…'}
            extensions={options.inputExtensions}
            error={null}
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
            placeholder={options.outputPlaceholder ?? 'Result appears here'}
            extensions={options.outputExtensions}
            error={error}
          />
        </div>
      </div>
    );
  }

  registerTool({ meta, component: Component });
}
