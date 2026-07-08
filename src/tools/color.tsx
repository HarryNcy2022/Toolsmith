import { useMemo, useState, useRef, useEffect } from 'react';
import tinycolor from 'tinycolor2';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

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

// ── Color string parsers ─────────────────────────────────────────

function parseHsvString(s: string): { h: number; s: number; v: number } | null {
  const m = s.match(/hsv\(\s*([\d.]+)\s*[°,]?\s*([\d.]+)%?\s*[°,]?\s*([\d.]+)%?\s*\)/i);
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), v: parseFloat(m[3]) };
}

function parseHwbString(s: string): { h: number; w: number; b: number } | null {
  const m = s.match(/hwb\(\s*([\d.]+)\s*[°,]?\s*([\d.]+)%?\s*[°,]?\s*([\d.]+)%?\s*\)/i);
  if (!m) return null;
  return { h: parseFloat(m[1]), w: parseFloat(m[2]), b: parseFloat(m[3]) };
}

function parseCmykString(s: string): { c: number; m: number; y: number; k: number } | null {
  const m = s.match(/cmyk\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/i);
  if (!m) return null;
  return { c: parseFloat(m[1]), m: parseFloat(m[2]), y: parseFloat(m[3]), k: parseFloat(m[4]) };
}

// ── Color space converters ───────────────────────────────────────

function hwbToRgb(h: number, w: number, b: number): { r: number; g: number; b: number } {
  const hNorm = h / 360;
  const wNorm = w / 100;
  const bNorm = b / 100;

  const sum = wNorm + bNorm;
  if (sum >= 1) {
    const gray = Math.round((wNorm / sum) * 255);
    return { r: gray, g: gray, b: gray };
  }

  const v = 1 - bNorm;
  const s = wNorm === 0 ? 0 : 1 - wNorm / v;
  return hsvToRgb(hNorm, s, v);
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;
  return {
    r: Math.round(255 * (1 - cNorm) * (1 - kNorm)),
    g: Math.round(255 * (1 - mNorm) * (1 - kNorm)),
    b: Math.round(255 * (1 - yNorm) * (1 - kNorm)),
  };
}

// ── Component ────────────────────────────────────────────────────

type FieldKey = 'input' | 'hex' | 'hex8' | 'rgb' | 'hsl' | 'hsv' | 'name' | 'rgba' | 'hsla' | 'hwb' | 'cmyk';

function Component() {
  const [input, setInput] = useState('#3b82f6');
  const lastEditedField = useRef<FieldKey | null>(null);

  const results = useMemo(() => {
    const c = tinycolor(input);
    if (!c.isValid()) return null;

    const rgb = c.toRgb();
    const hsl = c.toHsl();
    const hsv = c.toHsv();

    // HWB
    const w = (1 - hsv.s) * hsv.v * 100;
    const b = (1 - hsv.v) * 100;

    // CMYK
    const rn = rgb.r / 255, gn = rgb.g / 255, bn = rgb.b / 255;
    const k = 1 - Math.max(rn, gn, bn);
    let c_, m_, y_;
    if (k === 1) {
      c_ = m_ = y_ = 0;
    } else {
      c_ = ((1 - rn - k) / (1 - k)) * 100;
      m_ = ((1 - gn - k) / (1 - k)) * 100;
      y_ = ((1 - bn - k) / (1 - k)) * 100;
    }

    return {
      hex: c.toHexString(),
      hex8: c.toHex8String(),
      rgb: c.toRgbString(),
      hsl: c.toHslString(),
      hsv: c.toHsvString(),
      name: c.toName() || '(unnamed)',
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a.toFixed(2)})`,
      hsla: `hsla(${hsl.h.toFixed(1)}, ${(hsl.s * 100).toFixed(1)}%, ${(hsl.l * 100).toFixed(1)}%, ${hsl.a.toFixed(2)})`,
      hwb: `hwb(${hsv.h.toFixed(1)}, ${w.toFixed(1)}%, ${b.toFixed(1)}%)`,
      cmyk: `cmyk(${c_.toFixed(1)}%, ${m_.toFixed(1)}%, ${y_.toFixed(1)}%, ${(k * 100).toFixed(1)}%)`,
    };
  }, [input]);

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

  function handleRowChange(field: Exclude<FieldKey, 'input'>, value: string) {
    // Guard: skip if we're still responding to the last edit from this field
    if (lastEditedField.current === field) return;
    lastEditedField.current = field;

    let parsed: tinycolor.Instance | null = null;

    // Fields that tinycolor can parse natively
    if (field === 'hex' || field === 'hex8' || field === 'rgb' || field === 'hsl' || field === 'rgba' || field === 'hsla' || field === 'name') {
      const tc = tinycolor(value);
      if (tc.isValid()) parsed = tc;
    } else if (field === 'hsv') {
      const p = parseHsvString(value);
      if (p) {
        const tc = tinycolor(p);
        if (tc.isValid()) parsed = tc;
      }
    } else if (field === 'hwb') {
      const p = parseHwbString(value);
      if (p) {
        const r = hwbToRgb(p.h, p.w, p.b);
        const tc = tinycolor(r);
        if (tc.isValid()) parsed = tc;
      }
    } else if (field === 'cmyk') {
      const p = parseCmykString(value);
      if (p) {
        const r = cmykToRgb(p.c, p.m, p.y, p.k);
        const tc = tinycolor(r);
        if (tc.isValid()) parsed = tc;
      }
    }

    if (parsed) {
      setInput(parsed.toHexString());
    }
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
