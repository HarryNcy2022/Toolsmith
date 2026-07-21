import { useEffect, useState, useCallback } from 'react';
import { formatAcceleratorForDisplay } from '../lib/accelerator';
import { useHistoryStore } from '../lib/history';
import { canSaveAll } from '../lib/settings';
import { detectPlatform } from '../lib/platform';
import { DEFAULT_HOTKEY, DEFAULT_HISTORY_HOTKEY } from '../lib/hotkey-config';
import { useHotkeyField } from '../lib/use-hotkey-field';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SettingsModal({ open, onClose, onSaved }: SettingsModalProps): JSX.Element | null {
  const [historyMsg, setHistoryMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  const globalField = useHotkeyField('hotkey', DEFAULT_HOTKEY);
  const historyField = useHotkeyField('historyHotkey', DEFAULT_HISTORY_HOTKEY);

  // Clear save feedback whenever user edits either field.
  useEffect(() => {
    setMsg(null);
  }, [globalField.value, historyField.value]);

  const canSave = canSaveAll(globalField.value, historyField.value);

  const handleSaveAll = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setMsg(null);
    try {
      const [r1, r2] = await Promise.all([
        window.toolsmith?.setConfig('hotkey', globalField.value),
        window.toolsmith?.setConfig('historyHotkey', historyField.value),
      ]);
      if (r1?.success && r2?.success) {
        setMsg('Saved');
        onSaved?.();
      } else {
        setMsg(r1?.error ?? r2?.error ?? 'Failed to save hotkeys');
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to save hotkeys');
    } finally {
      setSaving(false);
    }
  }, [canSave, globalField.value, historyField.value, onSaved]);

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

  const platform = detectPlatform();

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
                onKeyDown={globalField.handler}
                className={"outline-none min-w-0 text-left px-3 py-1 rounded border " + (globalField.error ? "border-red-500" : "border-neutral-700") + " bg-neutral-900 text-neutral-100 text-sm focus:border-blue-600 focus:text-neutral-200 transition-colors select-none"}
              >
                {globalField.error ? (
                  <span className="text-red-400">{globalField.error}</span>
                ) : globalField.value ? (
                  formatAcceleratorForDisplay(globalField.value, platform)
                ) : (
                  <span className="text-neutral-600">Press a shortcut…</span>
                )}
              </div>
              <button
                type="button"
                onClick={globalField.reset}
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
                onKeyDown={historyField.handler}
                className={"outline-none min-w-0 text-left px-3 py-1 rounded border " + (historyField.error ? "border-red-500" : "border-neutral-700") + " bg-neutral-900 text-neutral-100 text-sm focus:border-blue-600 focus:text-neutral-200 transition-colors select-none"}
              >
                {historyField.error ? (
                  <span className="text-red-400">{historyField.error}</span>
                ) : historyField.value ? (
                  formatAcceleratorForDisplay(historyField.value, platform)
                ) : (
                  <span className="text-neutral-600">Press a shortcut…</span>
                )}
              </div>
              <button
                type="button"
                onClick={historyField.reset}
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
