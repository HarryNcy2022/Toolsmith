import { useState, useEffect } from 'react';
import { CopyButton } from './CopyButton';
import { CodeEditor } from './CodeEditor';

interface IOPanelProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  extensions?: any[];
  error?: string | null;
  actions?: React.ReactNode;
}

export function IOPanel({
  title,
  value,
  onChange,
  readOnly = false,
  placeholder,
  extensions,
  error,
  actions
}: IOPanelProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/80">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">{title}</span>
        <div className="flex items-center gap-1.5">
          {actions}
          <CopyButton getText={() => value} disabled={readOnly ? !value : false} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <CodeEditor
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          extensions={extensions}
        />
      </div>
      {error && (
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
