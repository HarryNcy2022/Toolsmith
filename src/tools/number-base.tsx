import { useState } from 'react';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

function parseAny(input: string, base: number): bigint | null {
  const s = input.trim().replace(/^0[box]/i, '').replace(/_/g, '');
  if (!s) return null;
  try {
    if (base === 10) {
      if (/^-?\d+$/.test(s)) return BigInt(s);
      return null;
    }
    if (base === 16 && /^-?[0-9a-f]+$/i.test(s)) return BigInt(parseInt(s, 16)) * (s.startsWith('-') ? -1n : 1n);
    if (base === 8 && /^-?[0-7]+$/.test(s)) return BigInt(s);
    if (base === 2 && /^-?[01]+$/.test(s)) return BigInt(`0b${s}`);
    return null;
  } catch {
    return null;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <div className="w-20 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <code className="flex-1 text-sm font-mono text-neutral-200 break-all">{value}</code>
      <CopyButton getText={() => value} />
    </div>
  );
}

function Component() {
  const [input, setInput] = useState('');
  const [base, setBase] = useState(10);

  const n = parseAny(input, base);
  const valid = n !== null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-neutral-500">Input</label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
          placeholder="255"
        />
        <select
          value={base}
          onChange={(e) => setBase(Number(e.target.value))}
          className="px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300"
        >
          <option value={2}>Binary</option>
          <option value={8}>Octal</option>
          <option value={10}>Decimal</option>
          <option value={16}>Hex</option>
        </select>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-2">
        {!valid ? (
          <div className="text-sm text-red-400 py-2">Invalid number for the selected base</div>
        ) : (
          <>
            <Row label="Binary" value={n.toString(2)} />
            <Row label="Octal" value={n.toString(8)} />
            <Row label="Decimal" value={n.toString(10)} />
            <Row label="Hex" value={n.toString(16).toUpperCase()} />
            <Row label="Bytes" value={hexToBytes(n.toString(16).replace('-', ''))} />
          </>
        )}
      </div>
    </div>
  );
}

function hexToBytes(hex: string): string {
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes = padded.match(/.{1,2}/g) ?? [];
  return bytes.map((b) => b).join(' ');
}

registerTool({
  meta: {
    id: 'number-base',
    name: 'Number Base Converter',
    category: 'Convert',
    keywords: ['number', 'base', 'binary', 'hex', 'decimal', 'octal']
  },
  component: Component
});
