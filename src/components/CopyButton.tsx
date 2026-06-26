import { useState } from 'react';

interface CopyButtonProps {
  getText: () => string | null | undefined;
  label?: string;
  disabled?: boolean;
}

export function CopyButton({ getText, label = 'Copy', disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const text = getText();
    if (text == null) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard may be blocked; fall back to a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        /* ignore */
      }
      ta.remove();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
        copied
          ? 'border-emerald-600 text-emerald-400'
          : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-40 disabled:hover:border-neutral-700 disabled:hover:text-neutral-400'
      }`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
