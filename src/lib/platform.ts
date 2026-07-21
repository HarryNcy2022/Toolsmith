export type Platform = 'mac' | 'win' | 'linux' | 'unknown';

export const MAC_MODIFIER_SYMBOLS = {
  meta: '\u2318',
  ctrl: '\u2303',
  alt: '\u2325',
  shift: '\u21E7',
} as const;

export const WIN_MODIFIER_LABELS = {
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
} as const;

type MacModifierMap = typeof MAC_MODIFIER_SYMBOLS;
type WinModifierMap = typeof WIN_MODIFIER_LABELS;

export const PLATFORM_KEY_MAP: Record<Platform, MacModifierMap | WinModifierMap> = {
  mac: MAC_MODIFIER_SYMBOLS,
  win: WIN_MODIFIER_LABELS,
  linux: WIN_MODIFIER_LABELS,
  unknown: WIN_MODIFIER_LABELS,
};

export function detectPlatform(): Platform {
  if (
    typeof navigator !== 'undefined' &&
    /Mac/i.test(navigator.platform || navigator.userAgent || '')
  ) {
    return 'mac';
  }
  return 'win';
}
