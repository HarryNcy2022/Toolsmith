import { useState } from 'react';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

function parseAny(input: string, base: number): bigint | null {
  const s = input.trim().replace(/^0[box]/i, '').replace(/_/g, '');
  if (!s) return null;
  // Per-base digit validation, then parse via BigInt on a prefixed literal.
  // Using BigInt (not parseInt) avoids the 32-bit truncation that silently
  // broke large hex values before; the 0x/0o/0b prefix is re-added because
  // line above strips a leading 0b/0o/0x for display normalization.
  const digitRe: Record<number, RegExp> = {
    16: /^-?[0-9a-f]+$/i,
    10: /^-?\d+$/,
    8: /^-?[0-7]+$/,
    2: /^-?[01]+$/
  };
  const prefix: Record<number, string> = { 16: '0x', 8: '0o', 2: '0b' };
  const re = digitRe[base];
  if (!re || !re.test(s)) return null;
  try {
    if (base === 10) return BigInt(s);
    const neg = s.startsWith('-');
    return BigInt((neg ? '-' : '') + prefix[base] + (neg ? s.slice(1) : s));
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
  const empty = input.trim() === '';
  // In the render branch below, `valid` guarantees `n` is non-null, but TS
  // can't narrow across the ternary, so capture a typed non-null view.
  const value = n as bigint;

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
        {!valid && !empty ? (
          <div className="text-sm text-red-400 py-2">Invalid number for the selected base</div>
        ) : empty ? (
          <div className="text-sm text-neutral-600 py-2">Enter a number to convert</div>
        ) : (
          <>
            <Row label="Binary" value={value.toString(2)} />
            <Row label="Octal" value={value.toString(8)} />
            <Row label="Decimal" value={value.toString(10)} />
            <Row label="Hex" value={value.toString(16).toUpperCase()} />
            <Row label="Bytes" value={hexToBytes(value.toString(16).replace('-', ''))} />
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
