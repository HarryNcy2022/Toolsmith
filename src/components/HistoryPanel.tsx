import { useEffect } from 'react';
import { useHistoryStore } from '../lib/history';

interface HistoryPanelProps {
  toolId: string;
  open: boolean;
  onClose: () => void;
  onLoad?: (input: string) => void;
}

export function HistoryPanel({
  toolId,
  open,
  onClose,
  onLoad
}: HistoryPanelProps): JSX.Element | null {
  const entries = useHistoryStore((s) => s.getAll(toolId));
  const removeOne = useHistoryStore((s) => s.removeOne);
  const clearAll = useHistoryStore((s) => s.clearAll);

  // Close on Escape while the panel is open.
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
        aria-label="Input history"
        className="w-[460px] max-w-[92vw] max-h-[80vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-neutral-100">History</h2>
            <span className="text-[10px] text-neutral-600">{toolId}</span>
          </div>
          <button
            type="button"
            onClick={() => clearAll(toolId)}
            className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
          >
            Clear all
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-500 text-center">
            No history for this tool
          </div>
        ) : (
          <ul>
            {entries.map((entry, index) => (
              <li
                key={`${entry.ts}-${index}`}
                onClick={() => {
                  onLoad?.(entry.input);
                  onClose();
                }}
                className="group relative flex items-center border-b border-neutral-800/50 last:border-0 cursor-pointer hover:bg-neutral-800 transition-colors"
              >
                <div className="flex-1 min-w-0 px-3 py-2">
                  <div className="truncate text-sm text-neutral-300">
                    {entry.input.slice(0, 80)}
                  </div>
                  <div className="text-[10px] text-neutral-600">
                    {new Date(entry.ts).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOne(toolId, index);
                  }}
                  aria-label="Remove entry"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-700/50 text-neutral-400 outline-none hover:bg-red-500/20 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-400/60 transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    aria-hidden="true"
                    className="block shrink-0"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
