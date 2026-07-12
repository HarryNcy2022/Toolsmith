import { useMemo, useState, useRef, useEffect } from 'react';
import { useToolState } from '../lib/tool-state';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';
import {
  convertColor,
  normalizeColorField,
  type EditableColorField
} from '../lib/color-convert';

function EditableRow({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <div className="w-28 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-blue-600/30"
      />
      <CopyButton getText={() => value} />
    </div>
  );
}

type FieldKey = 'input' | EditableColorField;

function Component() {
  const [state, setState] = useToolState('color', { input: '' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });
  const lastEditedField = useRef<FieldKey | null>(null);

  const results = useMemo(() => convertColor(input), [input]);

  // Reset the edit guard after every render so any field can be edited next
  useEffect(() => {
    lastEditedField.current = null;
  });

  // ── Edit handlers ─────────────────────────────────────────────

  function handleTextChange(value: string) {
    lastEditedField.current = 'input';
    setInput(value);
  }

  function handlePickerChange(value: string) {
    lastEditedField.current = 'input';
    setInput(value);
  }

  function handleRowChange(field: EditableColorField, value: string) {
    // Guard: skip if we're still responding to the last edit from this field
    if (lastEditedField.current === field) return;
    lastEditedField.current = field;

    const normalized = normalizeColorField(field, value);
    if (normalized) setInput(normalized);
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={results?.hex ?? '#000000'}
          onChange={(e) => handlePickerChange(e.target.value)}
          className="w-10 h-10 rounded border border-neutral-800 bg-transparent cursor-pointer"
        />
        <input
          value={input}
          onChange={(e) => handleTextChange(e.target.value)}
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
            <EditableRow label="HEX" value={results.hex} onChange={(v) => handleRowChange('hex', v)} />
            <EditableRow label="HEX (alpha)" value={results.hex8} onChange={(v) => handleRowChange('hex8', v)} />
            <EditableRow label="RGB" value={results.rgb} onChange={(v) => handleRowChange('rgb', v)} />
            <EditableRow label="RGBA" value={results.rgba} onChange={(v) => handleRowChange('rgba', v)} />
            <EditableRow label="HSL" value={results.hsl} onChange={(v) => handleRowChange('hsl', v)} />
            <EditableRow label="HSLA" value={results.hsla} onChange={(v) => handleRowChange('hsla', v)} />
            <EditableRow label="HSB (HSV)" value={results.hsv} onChange={(v) => handleRowChange('hsv', v)} />
            <EditableRow label="HWB" value={results.hwb} onChange={(v) => handleRowChange('hwb', v)} />
            <EditableRow label="CMYK" value={results.cmyk} onChange={(v) => handleRowChange('cmyk', v)} />
            <EditableRow label="Name" value={results.name} onChange={(v) => handleRowChange('name', v)} />
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
