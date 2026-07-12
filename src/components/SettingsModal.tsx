import { useEffect, useState, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  validateAccelerator,
  formatKeysToAccelerator,
  type KeyCombo
} from '../lib/accelerator';
import { useHistoryStore } from '../lib/history';

const DEFAULT_HOTKEY = 'CommandOrControl+Shift+D';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']);

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps): JSX.Element | null {
  const [captured, setCaptured] = useState<string>(DEFAULT_HOTKEY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [hotkeyMsg, setHotkeyMsg] = useState<string | null>(null);
  const [historyMsg, setHistoryMsg] = useState<string | null>(null);

  const captureValid = validateAccelerator(captured).valid;

  // Initialize the captured hotkey from storage whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    window.devutils
      ?.getConfig('hotkey')
      .then((stored) => {
        if (cancelled) return;
        const value =
          typeof stored === 'string' && stored.trim().length > 0
            ? stored
            : DEFAULT_HOTKEY;
        setCaptured(value);
        const v = validateAccelerator(value);
        setError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
      })
      .catch(() => {
        if (cancelled) return;
        setCaptured(DEFAULT_HOTKEY);
        setError(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

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

  const handleCaptureKeyDown = useCallback(
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
      setCaptured(accel);
      const v = validateAccelerator(accel);
      setError(v.valid ? null : (v.error ?? 'Invalid accelerator'));
      setHotkeyMsg(null);
    },
    []
  );

  const handleSave = useCallback(async () => {
    const v = validateAccelerator(captured);
    if (!v.valid) return;
    setSaving(true);
    setHotkeyMsg(null);
    try {
      const res = await window.devutils?.setConfig('hotkey', captured);
      if (res?.success) {
        setHotkeyMsg('Saved');
      } else {
        setHotkeyMsg(res?.error ?? 'Failed to save hotkey');
      }
    } catch (err) {
      setHotkeyMsg(err instanceof Error ? err.message : 'Failed to save hotkey');
    } finally {
      setSaving(false);
    }
  }, [captured]);

  const handleReset = useCallback(() => {
    setCaptured(DEFAULT_HOTKEY);
    setError(null);
    setHotkeyMsg(null);
  }, []);

  const handleClearHistory = useCallback(() => {
    useHistoryStore.getState().clearAll();
    setHistoryMsg('Cleared');
    window.setTimeout(() => setHistoryMsg(null), 2500);
  }, []);

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
          {/* Global hotkey */}
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Global hotkey
            </h3>
            <p className="text-xs text-neutral-600">
              Click the box below and press a key combination to capture it.
            </p>
            <div
              tabIndex={0}
              role="textbox"
              aria-label="Capture hotkey"
              onKeyDown={handleCaptureKeyDown}
              className="outline-none px-3 py-2 rounded border border-neutral-700 bg-neutral-900 text-neutral-100 text-sm focus:border-blue-600 focus:text-neutral-200 transition-colors select-none"
            >
              {captured || (
                <span className="text-neutral-600">Press a shortcut…</span>
              )}
            </div>
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <p className="text-xs text-neutral-600">
                Captured: {captured}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={!captureValid || saving}
                className="px-2.5 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
              >
                Reset to default
              </button>
              {hotkeyMsg && (
                <span
                  className={
                    hotkeyMsg === 'Saved'
                      ? 'text-xs text-green-400'
                      : 'text-xs text-red-400'
                  }
                >
                  {hotkeyMsg}
                </span>
              )}
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

          {/* Preferences placeholder */}
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Preferences
            </h3>
            <p className="text-xs text-neutral-600">More preferences coming soon.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
