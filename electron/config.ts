import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

export interface AppConfig {
  hotkey: string;
  historyHotkey: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  hotkey: 'CommandOrControl+Shift+D',
  historyHotkey: 'CommandOrControl+Shift+H'
};

const MODIFIERS = [
  'CommandOrControl',
  'CmdOrCtrl',
  'Control',
  'Ctrl',
  'Command',
  'Cmd',
  'Alt',
  'Option',
  'AltGr',
  'Shift',
  'Super',
  'Meta'
];

const NAMED_KEYS = [
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24',
  'Plus', 'Space', 'Tab', 'Enter', 'Return', 'Escape', 'Esc', 'Backspace',
  'Delete', 'Del', 'Up', 'Down', 'Left', 'Right', 'Home', 'End', 'PageUp',
  'PageDown', 'Insert', 'Capslock', 'Numlock', 'Scrolllock', 'PrintScreen',
  'ContextMenu', 'Power', 'VolumeUp', 'VolumeDown', 'VolumeMute',
  'MediaNextTrack', 'MediaPreviousTrack', 'MediaStop', 'MediaPlayPause',
  'Help', 'Back', 'Forward', 'Reload', 'DevTools'
];

function isModifier(token: string): boolean {
  return MODIFIERS.includes(token);
}

function isValidKey(token: string): boolean {
  if (!token) return false;
  if (/^[A-Za-z0-9]$/.test(token)) return true;
  return NAMED_KEYS.includes(token);
}

/**
 * Validate an Electron accelerator string.
 *
 * Grammar (loosely matches Electron's):
 *   <modifier>('+'<modifier>)* '+' <key>   |   <key>
 * where <modifier> ∈ MODIFIERS and <key> is a single [A-Za-z0-9] char or a
 * known named key. A bare modifier chain with no key is rejected.
 */
export function validateAccelerator(accel: string): { valid: boolean; error?: string } {
  if (typeof accel !== 'string' || accel.trim() === '') {
    return { valid: false, error: 'Accelerator cannot be empty' };
  }

  const parts = accel.split('+');
  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1);

  for (const m of mods) {
    if (!isModifier(m)) {
      return { valid: false, error: `Invalid accelerator: ${accel}` };
    }
  }

  // Final token must be a real key, not just another modifier.
  if (isModifier(key)) {
    return { valid: false, error: `Invalid accelerator: ${accel}` };
  }

  if (!isValidKey(key)) {
    return { valid: false };
  }

  return { valid: true };
}

/**
 * Parse stored config text. Never throws: on parse error or a non-object
 * payload it returns DEFAULT_CONFIG. A partial stored object is merged over
 * the defaults so newly-added keys survive.
 */
export function parseConfig(raw: string | null): AppConfig {
  if (raw == null) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_CONFIG };
    }
    return { ...DEFAULT_CONFIG, ...(parsed as Partial<AppConfig>) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function serializeConfig(cfg: AppConfig): string {
  return JSON.stringify(cfg, null, 2);
}

export function mergeConfig(base: AppConfig, patch: Partial<AppConfig>): AppConfig {
  return { ...base, ...patch };
}

function configPath(): string {
  return join(app.getPath('userData'), 'config.json');
}

export function loadConfigFrom(path: string): AppConfig {
  try {
    const content = readFileSync(path, 'utf-8');
    return parseConfig(content);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfigTo(path: string, cfg: AppConfig): void {
  try {
    writeFileSync(path, serializeConfig(cfg));
  } catch (e) {
    console.warn('[dev-utils] failed to save config', e);
  }
}

export function loadConfig(): AppConfig {
  return loadConfigFrom(configPath());
}

export function saveConfig(cfg: AppConfig): void {
  saveConfigTo(configPath(), cfg);
}
