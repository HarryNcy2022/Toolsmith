export const DEFAULT_HOTKEY = 'CommandOrControl+Shift+D';
export const DEFAULT_HISTORY_HOTKEY = 'CommandOrControl+Shift+H';

export interface HotkeyFieldConfig {
  configKey: string;
  defaultValue: string;
  label: string;
  description: string;
  ariaLabel: string;
}

export const HOTKEY_FIELDS: HotkeyFieldConfig[] = [
  {
    configKey: 'hotkey',
    defaultValue: DEFAULT_HOTKEY,
    label: 'Global hotkey',
    description: 'Click the box below and press a key combination to capture it.',
    ariaLabel: 'Capture global hotkey',
  },
  {
    configKey: 'historyHotkey',
    defaultValue: DEFAULT_HISTORY_HOTKEY,
    label: 'History panel hotkey',
    description:
      'Opens the per-tool history panel for the active tool. This is a window shortcut, not an OS global shortcut.',
    ariaLabel: 'Capture history panel hotkey',
  },
];
