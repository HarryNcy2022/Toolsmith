import {
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  validateAccelerator,
  formatKeysToAccelerator,
  type KeyCombo,
} from './accelerator';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']);

export function useHotkeyField(
  configKey: string,
  defaultValue: string
): {
  value: string;
  error: string | null;
  handler: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
  reset: () => void;
  isDefault: boolean;
} {
  const [value, setValue] = useState<string>(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.toolsmith
      ?.getConfig(configKey)
      .then((stored) => {
        if (cancelled) return;
        const resolved =
          typeof stored === 'string' && stored.trim().length > 0
            ? stored
            : defaultValue;
        setValue(resolved);
        const v = validateAccelerator(resolved);
        setError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
      })
      .catch(() => {
        if (cancelled) return;
        setValue(defaultValue);
        setError(null);
      });
    return () => {
      cancelled = true;
    };
  }, [configKey, defaultValue]);

  const handler = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (MODIFIER_KEYS.has(e.key)) return;

      const combo: KeyCombo = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
        key: e.key,
      };
      const accel = formatKeysToAccelerator(combo);
      setValue(accel);
      const v = validateAccelerator(accel);
      setError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
    },
    []
  );

  const reset = useCallback(() => {
    setValue(defaultValue);
    setError(null);
  }, [defaultValue]);

  return { value, error, handler, reset, isDefault: value === defaultValue };
}
