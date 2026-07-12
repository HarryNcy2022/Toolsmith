export interface KeyCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

const MODIFIER_TOKENS = [
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
] as const;

// Named non-letter keys Electron accepts as the final token.
const NAMED_KEYS = [
  'Plus',
  'Space',
  'Tab',
  'Backspace',
  'Delete',
  'Enter',
  'Return',
  'Escape',
  'Esc',
  'Up',
  'Down',
  'Left',
  'Right',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Insert',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'F13',
  'F14',
  'F15',
  'F16',
  'F17',
  'F18',
  'F19',
  'F20',
  'F21',
  'F22',
  'F23',
  'F24'
] as const;

const NAMED_KEY_SET = new Set<string>(NAMED_KEYS);
const MODIFIER_SET = new Set<string>(MODIFIER_TOKENS);

function isKeyToken(token: string): boolean {
  if (NAMED_KEY_SET.has(token)) return true;
  if (/^[A-Za-z0-9]$/.test(token)) return true;
  if (/^F([1-9]|[12][0-9]|3[0-4])$/.test(token)) return true;
  return false;
}

/**
 * Validate an Electron accelerator string.
 * Grammar: zero or more modifier tokens joined by '+', then a single key token
 * (a letter/digit, F1-F24, or a named key). Empty string is rejected.
 */
export function validateAccelerator(accel: string): { valid: boolean; error?: string } {
  if (!accel || !accel.trim()) {
    return { valid: false, error: 'Accelerator cannot be empty' };
  }
  const tokens = accel.split('+').map((t) => t.trim());
  if (tokens.length === 0) {
    return { valid: false, error: 'Invalid accelerator: ' + accel };
  }
  let keySeen = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isLast = i === tokens.length - 1;
    if (MODIFIER_SET.has(tok)) {
      if (isLast) {
        // a trailing modifier with no key → invalid
        return { valid: false, error: 'Invalid accelerator: ' + accel };
      }
      continue;
    }
    if (isLast) {
      if (!isKeyToken(tok)) {
        return { valid: false, error: 'Invalid accelerator: ' + accel };
      }
      keySeen = true;
      continue;
    }
    // non-modifier, non-last → invalid
    return { valid: false, error: 'Invalid accelerator: ' + accel };
  }
  if (!keySeen) {
    return { valid: false, error: 'Invalid accelerator: ' + accel };
  }
  return { valid: true };
}

/** Build an Electron accelerator string from a captured key combo. */
export function formatKeysToAccelerator(combo: KeyCombo): string {
  const mods: string[] = [];
  if (combo.ctrl || combo.meta) mods.push('CommandOrControl');
  if (combo.alt) mods.push('Alt');
  if (combo.shift) mods.push('Shift');
  const key = combo.key.length === 1 ? combo.key.toUpperCase() : combo.key;
  return [...mods, key].join('+');
}

/** Parse an Electron accelerator string back into a key combo. */
export function parseAcceleratorToKeys(accel: string): KeyCombo {
  const tokens = accel.split('+').map((t) => t.trim());
  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;
  let key = '';
  for (const tok of tokens) {
    switch (tok) {
      case 'CommandOrControl':
      case 'CmdOrCtrl':
        ctrl = true;
        meta = true;
        break;
      case 'Control':
      case 'Ctrl':
        ctrl = true;
        break;
      case 'Command':
      case 'Cmd':
      case 'Super':
      case 'Meta':
        meta = true;
        break;
      case 'Alt':
      case 'Option':
      case 'AltGr':
        alt = true;
        break;
      case 'Shift':
        shift = true;
        break;
      default:
        key = tok;
    }
  }
  return { ctrl, meta, alt, shift, key };
}
