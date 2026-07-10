export const RANDOM_STRING_PRESETS = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  hex: '0123456789abcdef',
  'hex-upper': '0123456789ABCDEF',
  base62: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/'
} as const;

export type RandomStringPreset = keyof typeof RANDOM_STRING_PRESETS;

export interface RandomStringOptions {
  preset: RandomStringPreset;
  customCharset: string;
  length: number;
  count: number;
  minimums?: {
    uppercase: number;
    lowercase: number;
    digits: number;
    symbols: number;
  };
}

const CHAR_CLASSES = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
} as const;

function randomFrom(charset: string, length: number): string {
  const out = new Array(length);
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) out[i] = charset[values[i] % charset.length];
  return out.join('');
}

function shuffle(value: string): string {
  const chars = value.split('');
  const values = new Uint32Array(Math.max(chars.length - 1, 0));
  crypto.getRandomValues(values);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = values[i - 1] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function fitMinimums(minimums: NonNullable<RandomStringOptions['minimums']>, length: number) {
  let uppercase = minimums.uppercase;
  let lowercase = minimums.lowercase;
  let digits = minimums.digits;
  let symbols = minimums.symbols;
  const sum = uppercase + lowercase + digits + symbols;

  if (sum > length) {
    const scale = length / sum;
    uppercase = Math.floor(uppercase * scale);
    lowercase = Math.floor(lowercase * scale);
    digits = Math.floor(digits * scale);
    symbols = Math.floor(symbols * scale);
  }

  return { uppercase, lowercase, digits, symbols };
}

function generateAdvanced(length: number, minimums: NonNullable<RandomStringOptions['minimums']>): string {
  const fitted = fitMinimums(minimums, length);
  const parts: string[] = [];
  const entries = Object.entries(fitted) as Array<[keyof typeof CHAR_CLASSES, number]>;
  for (const [key, minimum] of entries) {
    if (minimum > 0) parts.push(randomFrom(CHAR_CLASSES[key], minimum));
  }

  const used = Object.values(fitted).reduce((sum, value) => sum + value, 0);
  const remaining = length - used;
  if (remaining > 0) {
    parts.push(randomFrom(Object.values(CHAR_CLASSES).join(''), remaining));
  }
  return shuffle(parts.join(''));
}

export function generateRandomStrings(options: RandomStringOptions): string[] {
  const charset = options.customCharset || RANDOM_STRING_PRESETS[options.preset];
  if (!charset) return [];

  return Array.from({ length: options.count }, () =>
    options.minimums && !options.customCharset
      ? generateAdvanced(options.length, options.minimums)
      : randomFrom(charset, options.length)
  );
}
