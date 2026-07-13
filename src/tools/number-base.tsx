import { useState, useRef } from 'react';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';
import { CopyButton } from '../components/CopyButton';

function parseAny(input: string, base: number): bigint | null {
  const s = input.trim().replace(/_/g, '');
  if (!s) return null;
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = 0n;
  const str = s.toLowerCase();
  const start = str[0] === '-' ? 1 : 0;
  if (start === 1 && str.length < 2) return null;
  for (let i = start; i < str.length; i++) {
    const digit = digits.indexOf(str[i]);
    if (digit === -1 || digit >= base) return null;
    result = result * BigInt(base) + BigInt(digit);
  }
  return str[0] === '-' ? -result : result;
}

function hexToBytes(hex: string): string {
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes = padded.match(/.{1,2}/g) ?? [];
  return bytes.join(' ');
}

function EditableRow({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <div className="w-20 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      {readOnly ? (
        <div className="flex-1 px-2 py-1 text-sm font-mono text-neutral-200">{value}</div>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-blue-600/30"
        />
      )}
      <CopyButton getText={() => value} />
    </div>
  );
}

function Component() {
  const [state, setState] = useToolState<{ input: string; base: number; customBase: number }>('number-base', { input: '', base: 10, customBase: 16 });
  const input = state.input; const setInput = (v: string) => setState({ input: v });
  const base = state.base; const setBase = (v: number) => setState({ base: v });
  const customBase = state.customBase; const setCustomBase = (v: number) => setState({ customBase: v });
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const lastEdited = useRef<string | null>(null);

  const actualBase = base === -1 ? customBase : base;
  const n = parseAny(input, actualBase);
  const valid = n !== null;
  const empty = input.trim() === '';
  const value = n as bigint;

  const rows = [
    { label: 'Binary', key: 'binary', rowBase: 2 },
    { label: 'Octal', key: 'octal', rowBase: 8 },
    { label: 'Decimal', key: 'decimal', rowBase: 10 },
    { label: 'Hex', key: 'hex', rowBase: 16 },
    ...(base === -1
      ? [{ label: `Base-${customBase}`, key: 'custom' as const, rowBase: customBase }]
      : []),
    { label: 'Bytes', key: 'bytes', rowBase: 16, readOnly: true },
  ];

  function getRowValue(key: string): string {
    if (lastEdited.current === key && editDrafts[key] !== undefined) {
      return editDrafts[key];
    }
    switch (key) {
      case 'binary':
        return value?.toString(2) ?? '';
      case 'octal':
        return value?.toString(8) ?? '';
      case 'decimal':
        return value?.toString(10) ?? '';
      case 'hex':
        return value?.toString(16).toUpperCase() ?? '';
      case 'custom':
        return value?.toString(customBase) ?? '';
      case 'bytes':
        return value ? hexToBytes(value.toString(16).replace('-', '')) : '';
      default:
        return '';
    }
  }

  function handleInputChange(newValue: string) {
    lastEdited.current = 'input';
    setEditDrafts({});
    setInput(newValue);
  }

  function handleBaseChange(newBase: number) {
    setEditDrafts({});
    lastEdited.current = 'input';
    setBase(newBase);
  }

  function handleCustomBaseChange(raw: string) {
    const v = parseInt(raw, 10);
    if (isNaN(v)) return;
    const clamped = Math.min(36, Math.max(2, v));
    setCustomBase(clamped);
  }

  function handleRowChange(key: string, rowBase: number, newValue: string) {
    lastEdited.current = key;
    setEditDrafts((prev) => ({ ...prev, [key]: newValue }));

    const parsed = parseAny(newValue, rowBase);
    if (parsed !== null) {
      setInput(parsed.toString(actualBase));
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-neutral-500">Input</label>
        <input
          data-toolsmith-focus-input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
          placeholder={base === -1 ? `Enter base-${customBase} number` : '255'}
        />
        <select
          value={base}
          onChange={(e) => handleBaseChange(Number(e.target.value))}
          className="px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300"
        >
          <option value={2}>Binary</option>
          <option value={8}>Octal</option>
          <option value={10}>Decimal</option>
          <option value={16}>Hex</option>
          <option value={-1}>Custom</option>
        </select>
        {base === -1 && (
          <input
            type="number"
            min={2}
            max={36}
            value={customBase}
            onChange={(e) => handleCustomBaseChange(e.target.value)}
            className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-300 text-center focus:outline-none focus:border-neutral-600"
          />
        )}
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-2">
        {!valid && !empty ? (
          <div className="text-sm text-red-400 py-2">Invalid number for the selected base</div>
        ) : empty ? (
          <div className="text-sm text-neutral-600 py-2">Enter a number to convert</div>
        ) : (
          <>
            {rows.map((r) => (
              <EditableRow
                key={r.key}
                label={r.label}
                value={getRowValue(r.key)}
                onChange={(r as { readOnly?: boolean }).readOnly ? undefined : (v) => handleRowChange(r.key, r.rowBase, v)}
                readOnly={(r as { readOnly?: boolean }).readOnly}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
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
