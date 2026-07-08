interface SwapButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Presentational ⇄ button for bidirectional tools. Styling matches
 * `PasteButton` / `ClearButton` so it reads as part of the same action cluster.
 */
export function SwapButton({ onClick, disabled }: SwapButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Swap input and output"
      className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-40"
    >
      ⇄ Swap
    </button>
  );
}
