import { useState } from 'react';
import { useToolState } from '../lib/tool-state';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';
import {
  generateRandomStrings,
  RANDOM_STRING_PRESETS,
  type RandomStringPreset
} from '../lib/random-string';

function Component() {
  const [state, setState] = useToolState('random-string', {
    preset: 'alphanumeric' as RandomStringPreset,
    custom: '',
    length: 32,
    count: 5,
    advanced: false,
    upperMin: 0,
    lowerMin: 0,
    digitMin: 0,
    symMin: 0
  });
  const { preset, custom, length, count, advanced, upperMin, lowerMin, digitMin, symMin } = state;
  const setPreset = (v: RandomStringPreset) => setState({ preset: v });
  const setCustom = (v: string) => setState({ custom: v });
  const setLength = (v: number) => setState({ length: v });
  const setCount = (v: number) => setState({ count: v });
  const setAdvanced = (v: boolean) => setState({ advanced: v });
  const setUpperMin = (v: number) => setState({ upperMin: v });
  const setLowerMin = (v: number) => setState({ lowerMin: v });
  const setDigitMin = (v: number) => setState({ digitMin: v });
  const setSymMin = (v: number) => setState({ symMin: v });
  const [results, setResults] = useState<string[]>([]);

  function regen() {
    setResults(generateRandomStrings({
      preset,
      customCharset: custom,
      length,
      count,
      minimums: advanced && !custom
        ? { uppercase: upperMin, lowercase: lowerMin, digits: digitMin, symbols: symMin }
        : undefined
    }));
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex flex-wrap items-end gap-3 shrink-0">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Charset preset
          <select
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value as RandomStringPreset);
              setCustom('');
            }}
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200"
          >
            {(Object.keys(RANDOM_STRING_PRESETS) as RandomStringPreset[]).map((p) => (
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
        {!custom && (
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={advanced}
              onChange={(e) => setAdvanced(e.target.checked)}
              className="accent-blue-600"
            />
            Advanced
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Length
          <input
            data-toolsmith-focus-input
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

      {advanced && !custom && (
        <div className="flex flex-wrap items-end gap-3 shrink-0">
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Uppercase min
            <input
              type="number"
              min={0}
              max={length}
              value={upperMin}
              onChange={(e) => setUpperMin(Math.max(0, Math.min(length, Number(e.target.value) || 0)))}
              className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Lowercase min
            <input
              type="number"
              min={0}
              max={length}
              value={lowerMin}
              onChange={(e) => setLowerMin(Math.max(0, Math.min(length, Number(e.target.value) || 0)))}
              className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Digits min
            <input
              type="number"
              min={0}
              max={length}
              value={digitMin}
              onChange={(e) => setDigitMin(Math.max(0, Math.min(length, Number(e.target.value) || 0)))}
              className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Symbols min
            <input
              type="number"
              min={0}
              max={length}
              value={symMin}
              onChange={(e) => setSymMin(Math.max(0, Math.min(length, Number(e.target.value) || 0)))}
              className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
            />
          </label>
        </div>
      )}

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
