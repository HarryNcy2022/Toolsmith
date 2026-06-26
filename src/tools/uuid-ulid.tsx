import { useState } from 'react';
import { ulid } from 'ulid';
import { uuidv7 } from 'uuidv7';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

type Kind = 'uuid-v4' | 'uuid-v7' | 'ulid';

function generate(kind: Kind): string {
  switch (kind) {
    case 'uuid-v4':
      return crypto.randomUUID();
    case 'uuid-v7':
      return uuidv7();
    case 'ulid':
      return ulid();
  }
}

function decodeUlid(id: string): { time: string } | { error: string } {
  const cleaned = id.trim().toUpperCase();
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(cleaned)) {
    return { error: 'Not a valid ULID (26 chars, Crockford base32)' };
  }
  // first 10 chars = 48-bit timestamp ms
  const alpha = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let ms = 0;
  for (let i = 0; i < 10; i++) ms = ms * 32 + alpha.indexOf(cleaned[i]);
  return { time: new Date(ms).toISOString() };
}

function Component() {
  const [kind, setKind] = useState<Kind>('uuid-v4');
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [ids, setIds] = useState<string[]>(() => [crypto.randomUUID()]);

  function regen() {
    const next = Array.from({ length: count }, () => generate(kind));
    setIds(
      next.map((id) => {
        let out = id;
        if (kind === 'uuid-v4' || kind === 'uuid-v7') {
          out = hyphens ? out : out.replace(/-/g, '');
          out = uppercase ? out.toUpperCase() : out;
        } else {
          out = uppercase ? out.toUpperCase() : out;
        }
        return out;
      })
    );
  }

  const decodeInfo =
    kind === 'ulid' && ids[0] ? decodeUlid(ids[0]) : null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-neutral-200"
        >
          <option value="uuid-v4">UUID v4</option>
          <option value="uuid-v7">UUID v7</option>
          <option value="ulid">ULID</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          Count
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-16 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-neutral-200"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="accent-blue-500"
          />
          Uppercase
        </label>
        {(kind === 'uuid-v4' || kind === 'uuid-v7') && (
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={hyphens}
              onChange={(e) => setHyphens(e.target.checked)}
              className="accent-blue-500"
            />
            Hyphens
          </label>
        )}
        <button
          onClick={regen}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white"
        >
          Generate
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-auto">
        {ids.map((id, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800/60 last:border-0"
          >
            <code className="flex-1 font-mono text-sm text-neutral-200 break-all">{id}</code>
            <CopyButton getText={() => id} />
          </div>
        ))}
      </div>

      {decodeInfo && (
        <div className="shrink-0 px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm">
          {'error' in decodeInfo ? (
            <span className="text-red-400">{decodeInfo.error}</span>
          ) : (
            <span className="text-neutral-400">
              Embedded timestamp: <code className="text-neutral-200">{decodeInfo.time}</code>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

registerTool({
  meta: {
    id: 'uuid-ulid',
    name: 'UUID/ULID Generator',
    category: 'Generate',
    keywords: ['uuid', 'ulid', 'guid', 'v4', 'v7', 'id']
  },
  component: Component
});
