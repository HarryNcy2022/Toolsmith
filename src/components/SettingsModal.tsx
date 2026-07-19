import { useEffect, useState, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  validateAccelerator,
  formatKeysToAccelerator,
  formatAcceleratorForDisplay,
  type KeyCombo
} from '../lib/accelerator';
import { useHistoryStore } from '../lib/history';
import { canSaveAll } from '../lib/settings';

const DEFAULT_HOTKEY = 'CommandOrControl+Shift+D';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']);

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps): JSX.Element | null {
  const [historyMsg, setHistoryMsg] = useState<string | null>(null);
  const [hotkey, setHotkey] = useState<string>(DEFAULT_HOTKEY);
  const [historyHotkey, setHistoryHotkey] = useState<string>('CommandOrControl+Shift+H');
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.toolsmith
      ?.getConfig('hotkey')
      .then((stored) => {
        if (cancelled) return;
        const value =
          typeof stored === 'string' && stored.trim().length > 0
            ? stored
            : DEFAULT_HOTKEY;
        setHotkey(value);
        const v = validateAccelerator(value);
        setHotkeyError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
      })
      .catch(() => {
        if (cancelled) return;
        setHotkey(DEFAULT_HOTKEY);
        setHotkeyError(null);
      });
    window.toolsmith
      ?.getConfig('historyHotkey')
      .then((stored) => {
        if (cancelled) return;
        const defaultValue = 'CommandOrControl+Shift+H';
        const value =
          typeof stored === 'string' && stored.trim().length > 0
            ? stored
            : defaultValue;
        setHistoryHotkey(value);
        const v = validateAccelerator(value);
        setHistoryError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
      })
      .catch(() => {
        if (cancelled) return;
        setHistoryHotkey('CommandOrControl+Shift+H');
        setHistoryError(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const makeCaptureHandler = useCallback(
    (
      setValue: React.Dispatch<React.SetStateAction<string>>,
      setError: React.Dispatch<React.SetStateAction<string | null>>
    ) =>
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        // Let Escape bubble so the modal-level handler closes the dialog.
        if (e.key === 'Escape') return;
        // Capture the keystroke so the underlying app never sees it.
        e.preventDefault();
        e.stopPropagation();

        // Pure modifier presses must not produce a final accelerator.
        if (MODIFIER_KEYS.has(e.key)) return;

        const combo: KeyCombo = {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
          key: e.key
        };
        const accel = formatKeysToAccelerator(combo);
        setValue(accel);
        const v = validateAccelerator(accel);
        setError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
        setMsg(null);
      },
    []
  );

  const hotkeyHandler = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) =>
      makeCaptureHandler(setHotkey, setHotkeyError)(e),
    [makeCaptureHandler]
  );

  const historyHandler = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) =>
      makeCaptureHandler(setHistoryHotkey, setHistoryError)(e),
    [makeCaptureHandler]
  );

  const resetHotkey = useCallback(() => {
    setHotkey(DEFAULT_HOTKEY);
    setHotkeyError(null);
    setMsg(null);
  }, []);

  const resetHistory = useCallback(() => {
    setHistoryHotkey('CommandOrControl+Shift+H');
    setHistoryError(null);
    setMsg(null);
  }, []);

  const canSave = canSaveAll(hotkey, historyHotkey);

  const handleSaveAll = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setMsg(null);
    try {
      const [r1, r2] = await Promise.all([
        window.toolsmith?.setConfig('hotkey', hotkey),
        window.toolsmith?.setConfig('historyHotkey', historyHotkey)
      ]);
      if (r1?.success && r2?.success) {
        setMsg('Saved');
      } else {
        setMsg(r1?.error ?? r2?.error ?? 'Failed to save hotkeys');
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to save hotkeys');
    } finally {
      setSaving(false);
    }
  }, [canSave, hotkey, historyHotkey]);

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleClearHistory = useCallback(() => {
    useHistoryStore.getState().clearAll();
    setHistoryMsg('Cleared');
    window.setTimeout(() => setHistoryMsg(null), 2500);
  }, []);

  const platform: 'mac' | 'win' | 'linux' | 'unknown' =
    typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent || '')
      ? 'mac'
      : 'win';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="w-[460px] max-w-[92vw] max-h-[88vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Keyboard shortcuts
            </h3>

            {/* Keyboard shortcuts: shared grid so both capture boxes share one
                equal-width column (table-like, no <table>). Columns:
                [label auto] [capture box 1fr] [reset auto]. */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-3 items-center">
              <div className="flex flex-col">
                <span className="text-sm text-neutral-200" title="Click the box below and press a key combination to capture it.">Global hotkey</span>
              </div>
              <div
                tabIndex={0}
                role="textbox"
                aria-label="Capture global hotkey"
                onKeyDown={hotkeyHandler}
                className={"outline-none min-w-0 text-left px-3 py-1 rounded border " + (hotkeyError ? "border-red-500" : "border-neutral-700") + " bg-neutral-900 text-neutral-100 text-sm focus:border-blue-600 focus:text-neutral-200 transition-colors select-none"}
              >
                {hotkeyError ? (
                  <span className="text-red-400">{hotkeyError}</span>
                ) : hotkey ? (
                  formatAcceleratorForDisplay(hotkey, platform)
                ) : (
                  <span className="text-neutral-600">Press a shortcut…</span>
                )}
              </div>
              <button
                type="button"
                onClick={resetHotkey}
                className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
              >
                Reset
              </button>

              <div className="flex flex-col">
                <span className="text-sm text-neutral-200" title="Opens the per-tool history panel for the active tool. This is a window shortcut, not an OS global shortcut.">History panel hotkey</span>
              </div>
              <div
                tabIndex={0}
                role="textbox"
                aria-label="Capture history panel hotkey"
                onKeyDown={historyHandler}
                className={"outline-none min-w-0 text-left px-3 py-1 rounded border " + (historyError ? "border-red-500" : "border-neutral-700") + " bg-neutral-900 text-neutral-100 text-sm focus:border-blue-600 focus:text-neutral-200 transition-colors select-none"}
              >
                {historyError ? (
                  <span className="text-red-400">{historyError}</span>
                ) : historyHotkey ? (
                  formatAcceleratorForDisplay(historyHotkey, platform)
                ) : (
                  <span className="text-neutral-600">Press a shortcut…</span>
                )}
              </div>
              <button
                type="button"
                onClick={resetHistory}
                className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {msg && (
                <span
                  className={
                    msg === 'Saved' ? 'text-xs text-green-400' : 'text-xs text-red-400'
                  }
                >
                  {msg}
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={!canSave || saving}
                className="px-2.5 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>

          {/* Input history */}
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Input history
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
              >
                Clear all input history
              </button>
              {historyMsg && (
                <span className="text-xs text-green-400">{historyMsg}</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
