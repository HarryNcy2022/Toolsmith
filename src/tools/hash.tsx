import { useMemo, useState } from 'react';
import CryptoJS from 'crypto-js';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';
import { useToolState } from '../lib/tool-state';

const ALGOS = ['MD5', 'SHA1', 'SHA224', 'SHA256', 'SHA384', 'SHA512', 'SHA3', 'RIPEMD160'] as const;
type Algo = (typeof ALGOS)[number];

function hash(input: string, algo: Algo): string {
  switch (algo) {
    case 'MD5':
      return CryptoJS.MD5(input).toString();
    case 'SHA1':
      return CryptoJS.SHA1(input).toString();
    case 'SHA224':
      return CryptoJS.SHA224(input).toString();
    case 'SHA256':
      return CryptoJS.SHA256(input).toString();
    case 'SHA384':
      return CryptoJS.SHA384(input).toString();
    case 'SHA512':
      return CryptoJS.SHA512(input).toString();
    case 'SHA3':
      return CryptoJS.SHA3(input, { outputLength: 256 }).toString();
    case 'RIPEMD160':
      return CryptoJS.RIPEMD160(input).toString();
  }
}

function Component() {
  const [state, setState] = useToolState<{ input: string }>('hash', { input: '' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });

  const results = useMemo(
    () => ALGOS.map((a) => ({ algo: a, out: input ? hash(input, a) : '' })),
    [input]
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <textarea
        data-toolsmith-focus-input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Text to hash…"
        className="shrink-0 h-28 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-200 resize-none focus:outline-none focus:border-neutral-600"
      />
      <div className="flex-1 min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-auto">
        {results.map(({ algo, out }) => (
          <div
            key={algo}
            className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800/60 last:border-0"
          >
            <div className="w-24 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{algo}</div>
            <code className="flex-1 text-sm font-mono text-neutral-200 break-all">{out || '—'}</code>
            <CopyButton getText={() => out} disabled={!out} />
          </div>
        ))}
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'hash',
    name: 'Hash Generator',
    category: 'Generate',
    keywords: ['hash', 'md5', 'sha', 'sha256', 'digest', 'checksum']
  },
  component: Component
});
