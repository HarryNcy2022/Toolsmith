import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';

// Escape control chars to backslash sequences; reverse for unescape.
// Uses JSON.stringify trick on a single-quoted string to get a correct escape map,
// then trims the surrounding quotes.
const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  '"': '\\"',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\b': '\\b',
  '\f': '\\f',
  '\u0000': '\\0'
};

function escape(s: string): string {
  return s.replace(/[\\"\n\r\t\b\f\u0000]/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

function unescape(s: string): string {
  return s.replace(/\\(\\|["'nrtbf0])/g, (_, ch: string) => {
    const rev: Record<string, string> = {
      '\\': '\\',
      '"': '"',
      "'": "'",
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      0: '\u0000'
    };
    return rev[ch] ?? ch;
  });
}

function Component() {
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'escape' | 'unescape'>('escape');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      return { output: dir === 'escape' ? escape(input) : unescape(input), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="inline-flex rounded border border-neutral-800 overflow-hidden self-start shrink-0">
        <button
          onClick={() => setDir('escape')}
          className={`px-3 py-1 text-xs ${dir === 'escape' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Escape
        </button>
        <button
          onClick={() => setDir('unescape')}
          className={`px-3 py-1 text-xs ${dir === 'unescape' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Unescape
        </button>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title="Input"
          value={input}
          onChange={setInput}
          placeholder={dir === 'escape' ? 'line1\nline2\ttab' : 'line1\\nline2\\ttab'}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel title="Output" value={output} readOnly error={error} />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'backslash-escape',
    name: 'Backslash Escape',
    category: 'Encode',
    keywords: ['escape', 'unescape', 'backslash', 'string']
  },
  component: Component
});
