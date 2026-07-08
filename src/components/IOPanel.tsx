import { useCallback, useEffect, useRef, useState } from 'react';
import { CopyButton } from './CopyButton';
import { CodeEditor } from './CodeEditor';
import { useHistoryStore } from '../lib/history';
import { useActiveToolId } from '../lib/active-tool';

interface IOPanelProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  extensions?: any[];
  error?: string | null;
  actions?: React.ReactNode;
  /** toolId for input history; omit to disable history tracking */
  toolId?: string;
}

export function IOPanel({
  title,
  value,
  onChange,
  readOnly = false,
  placeholder,
  extensions,
  error,
  actions,
  toolId
}: IOPanelProps) {
  const push = useHistoryStore((s) => s.push);
  const getAll = useHistoryStore((s) => s.getAll);
  const contextToolId = useActiveToolId();
  const resolvedToolId = toolId || contextToolId;
  const history = resolvedToolId ? getAll(resolvedToolId) : [];
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // push to history on change (debounced via last-value check)
  const lastPushed = useRef('');
  useEffect(() => {
    if (resolvedToolId && onChange && value && value !== lastPushed.current) {
      lastPushed.current = value;
      const tid = resolvedToolId;
      // push on a delay so we don't record every keystroke
      const timer = setTimeout(() => push(tid, value), 1000);
      return () => clearTimeout(timer);
    }
  }, [value, resolvedToolId, onChange, push]);

  // close dropdown on outside click
  useEffect(() => {
    if (!showHistory) return;
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showHistory]);

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/80">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">{title}</span>
        <div className="flex items-center gap-1.5">
          {actions}
          {/* history dropdown — only for writable panels with toolId */}
          {!readOnly && resolvedToolId && history.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
                title="Input history"
              >
                History
              </button>
              {showHistory && (
                <div className="absolute right-0 top-full mt-1 w-72 max-h-60 overflow-auto bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-40">
                  {history.map((entry, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onChange?.(entry.input);
                        setShowHistory(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-neutral-300 hover:bg-neutral-800 border-b border-neutral-800/50 last:border-0 truncate"
                    >
                      {entry.input.slice(0, 80)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <CopyButton getText={() => value} disabled={readOnly ? !value : false} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto relative">
        <CodeEditor
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          extensions={extensions}
        />
        {readOnly && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm z-10">
            <div className="p-3 text-xs font-mono text-red-400 whitespace-pre-wrap break-words max-w-full max-h-full overflow-auto">
              {error}
            </div>
          </div>
        )}
      </div>
      {error && !(readOnly && error) && (
        <div className="px-3 py-1.5 border-t border-neutral-800 bg-red-950/40 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  );
}

interface PasteButtonProps {
  onPaste: (text: string) => void;
}

export function PasteButton({ onPaste }: PasteButtonProps) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          onPaste(await navigator.clipboard.readText());
        } catch {
          /* clipboard blocked */
        } finally {
          setBusy(false);
        }
      }}
      className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
    >
      {busy ? '…' : 'Paste'}
    </button>
  );
}

interface ClearButtonProps {
  onClear: () => void;
  disabled?: boolean;
}

export function ClearButton({ onClear, disabled }: ClearButtonProps) {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={disabled}
      className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-40"
    >
      Clear
    </button>
  );
}

/** Auto-read clipboard once on mount; lets user paste-and-go typical dev workflows. */
export function useClipboardGuess(): string | null {
  const [clip, setClip] = useState<string | null>(null);
  useEffect(() => {
    navigator.clipboard
      ?.readText()
      .then((t) => setClip(t ?? null))
      .catch(() => setClip(null));
  }, []);
  return clip;
}
