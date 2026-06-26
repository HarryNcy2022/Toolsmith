import { useState } from 'react';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

const PRESETS: Record<string, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  hex: '0123456789abcdef',
  'hex-upper': '0123456789ABCDEF',
  base62: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/'
};

function randomFrom(charset: string, len: number): string {
  const out = new Array(len);
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) out[i] = charset[buf[i] % charset.length];
  return out.join('');
}

function Component() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('alphanumeric');
  const [custom, setCustom] = useState('');
  const [length, setLength] = useState(32);
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<string[]>([]);

  function regen() {
    const charset = custom || PRESETS[preset];
    if (!charset) return;
    setResults(Array.from({ length: count }, () => randomFrom(charset, length)));
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex flex-wrap items-end gap-3 shrink-0">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Charset preset
          <select
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value as keyof typeof PRESETS);
              setCustom('');
            }}
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200"
          >
            {Object.keys(PRESETS).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Custom charset
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="abc123!@"
            className="w-40 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Length
          <input
            type="number"
            min={1}
            max={4096}
            value={length}
            onChange={(e) => setLength(Math.max(1, Math.min(4096, Number(e.target.value) || 1)))}
            className="w-20 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Count
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
          />
        </label>
        <button
          onClick={regen}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white"
        >
          Generate
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-auto">
        {results.length === 0 ? (
          <div className="px-4 py-3 text-sm text-neutral-600">Click Generate</div>
        ) : (
          results.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800/60 last:border-0"
            >
              <code className="flex-1 font-mono text-sm text-neutral-200 break-all">{s}</code>
              <CopyButton getText={() => s} />
            </div>
          ))
        )}
    </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'random-string',
    name: 'Random String',
    category: 'Generate',
    keywords: ['random', 'string', 'password', 'token']
  },
  component: Component
});
