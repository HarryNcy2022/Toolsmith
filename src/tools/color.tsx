import { useMemo, useState } from 'react';
import tinycolor from 'tinycolor2';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <div className="w-28 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <code className="flex-1 text-sm font-mono text-neutral-200 break-all">{value}</code>
      <CopyButton getText={() => value} />
    </div>
  );
}

function Component() {
  const [input, setInput] = useState('#3b82f6');

  const results = useMemo(() => {
    const c = tinycolor(input);
    if (!c.isValid()) return null;
    return {
      hex: c.toHexString(),
      hex8: c.toHex8String(),
      rgb: c.toRgbString(),
      hsl: c.toHslString(),
      hsv: c.toHsvString(),
      name: c.toName() || '(unnamed)'
    };
  }, [input]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={results?.hex ?? '#000000'}
          onChange={(e) => setInput(e.target.value)}
          className="w-10 h-10 rounded border border-neutral-800 bg-transparent cursor-pointer"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="#3b82f6 / rgb(59,130,246) / blue"
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
        />
        {results && (
          <div
            className="w-10 h-10 rounded border border-neutral-800"
            style={{ backgroundColor: results.hex }}
          />
        )}
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-2">
        {!results ? (
          <div className="text-sm text-red-400 py-2">Invalid color</div>
        ) : (
          <>
            <Row label="HEX" value={results.hex} />
            <Row label="HEX (alpha)" value={results.hex8} />
            <Row label="RGB" value={results.rgb} />
            <Row label="HSL" value={results.hsl} />
            <Row label="HSB (HSV)" value={results.hsv} />
            <Row label="Name" value={results.name} />
          </>
        )}
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'color',
    name: 'Color Converter',
    category: 'Convert',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'picker']
  },
  component: Component
});
