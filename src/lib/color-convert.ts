import tinycolor from 'tinycolor2';

export type EditableColorField =
  | 'hex'
  | 'hex8'
  | 'rgb'
  | 'hsl'
  | 'hsv'
  | 'name'
  | 'rgba'
  | 'hsla'
  | 'hwb'
  | 'cmyk';

export interface ColorResults {
  hex: string;
  hex8: string;
  rgb: string;
  hsl: string;
  hsv: string;
  name: string;
  rgba: string;
  hsla: string;
  hwb: string;
  cmyk: string;
}

function parseHsvString(value: string): { h: number; s: number; v: number } | null {
  const match = value.match(/hsv\(\s*([\d.]+)\s*[°,]?\s*([\d.]+)%?\s*[°,]?\s*([\d.]+)%?\s*\)/i);
  if (!match) return null;
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), v: parseFloat(match[3]) };
}

function parseHwbString(value: string): { h: number; w: number; b: number } | null {
  const match = value.match(/hwb\(\s*([\d.]+)\s*[°,]?\s*([\d.]+)%?\s*[°,]?\s*([\d.]+)%?\s*\)/i);
  if (!match) return null;
  return { h: parseFloat(match[1]), w: parseFloat(match[2]), b: parseFloat(match[3]) };
}

function parseCmykString(value: string): { c: number; m: number; y: number; k: number } | null {
  const match = value.match(/cmyk\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/i);
  if (!match) return null;
  return {
    c: parseFloat(match[1]),
    m: parseFloat(match[2]),
    y: parseFloat(match[3]),
    k: parseFloat(match[4])
  };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0;
  let g = 0;
  let b = 0;
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

function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;
  return {
    r: Math.round(255 * (1 - cNorm) * (1 - kNorm)),
    g: Math.round(255 * (1 - mNorm) * (1 - kNorm)),
    b: Math.round(255 * (1 - yNorm) * (1 - kNorm))
  };
}

export function convertColor(input: string): ColorResults | null {
  const color = tinycolor(input);
  if (!color.isValid()) return null;

  const rgb = color.toRgb();
  const hsl = color.toHsl();
  const hsv = color.toHsv();
  const whiteness = (1 - hsv.s) * hsv.v * 100;
  const blackness = (1 - hsv.v) * 100;

  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const key = 1 - Math.max(red, green, blue);
  let cyan: number;
  let magenta: number;
  let yellow: number;
  if (key === 1) {
    cyan = magenta = yellow = 0;
  } else {
    cyan = ((1 - red - key) / (1 - key)) * 100;
    magenta = ((1 - green - key) / (1 - key)) * 100;
    yellow = ((1 - blue - key) / (1 - key)) * 100;
  }

  return {
    hex: color.toHexString(),
    hex8: color.toHex8String(),
    rgb: color.toRgbString(),
    hsl: color.toHslString(),
    hsv: color.toHsvString(),
    name: color.toName() || '(unnamed)',
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a.toFixed(2)})`,
    hsla: `hsla(${hsl.h.toFixed(1)}, ${(hsl.s * 100).toFixed(1)}%, ${(hsl.l * 100).toFixed(1)}%, ${hsl.a.toFixed(2)})`,
    hwb: `hwb(${hsv.h.toFixed(1)}, ${whiteness.toFixed(1)}%, ${blackness.toFixed(1)}%)`,
    cmyk: `cmyk(${cyan.toFixed(1)}%, ${magenta.toFixed(1)}%, ${yellow.toFixed(1)}%, ${(key * 100).toFixed(1)}%)`
  };
}

export function normalizeColorField(field: EditableColorField, value: string): string | null {
  let parsed: tinycolor.Instance | null = null;

  if (field === 'hex' || field === 'hex8' || field === 'rgb' || field === 'hsl' ||
      field === 'rgba' || field === 'hsla' || field === 'name') {
    const color = tinycolor(value);
    if (color.isValid()) parsed = color;
  } else if (field === 'hsv') {
    const hsv = parseHsvString(value);
    if (hsv) {
      const color = tinycolor(hsv);
      if (color.isValid()) parsed = color;
    }
  } else if (field === 'hwb') {
    const hwb = parseHwbString(value);
    if (hwb) {
      const color = tinycolor(hwbToRgb(hwb.h, hwb.w, hwb.b));
      if (color.isValid()) parsed = color;
    }
  } else {
    const cmyk = parseCmykString(value);
    if (cmyk) {
      const color = tinycolor(cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k));
      if (color.isValid()) parsed = color;
    }
  }

  return parsed?.toHexString() ?? null;
}
