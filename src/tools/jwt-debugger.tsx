import { useMemo, useState } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';
import { json } from '@codemirror/lang-json';

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

interface Decoded {
  header: string;
  payload: string;
  signature: string;
  exp?: string;
  iat?: string;
  error?: string;
}

function decode(token: string): Decoded | null {
  const t = token.trim();
  if (!t) return null;
  const parts = t.split('.');
  if (parts.length < 2) {
    return { header: '', payload: '', signature: '', error: 'Not a JWT: need at least 2 parts (header.payload)' };
  }
  try {
    const header = prettyJson(b64urlDecode(parts[0]));
    const payload = prettyJson(b64urlDecode(parts[1]));
    const signature = parts[2] ?? '(unsigned)';
    let exp: string | undefined;
    let iat: string | undefined;
    try {
      const claims = jwtDecode<JwtPayload>(t);
      if (claims.exp) exp = new Date(claims.exp * 1000).toISOString();
      if (claims.iat) iat = new Date(claims.iat * 1000).toISOString();
    } catch {
      /* payload not valid claims JSON; ignore */
    }
    return { header, payload, signature, exp, iat };
  } catch (e) {
    return {
      header: '',
      payload: '',
      signature: '',
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

function Component() {
  const [token, setToken] = useState('');

  const d = useMemo(() => decode(token), [token]);
  const expired = d?.exp ? new Date(d.exp).getTime() < Date.now() : false;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="shrink-0">
        <IOPanel
          title="Encoded JWT"
          value={token}
          onChange={setToken}
          placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.xxx"
          actions={
            <>
              <PasteButton onPaste={setToken} />
              <ClearButton onClear={() => setToken('')} disabled={!token} />
            </>
          }
          error={d?.error ?? null}
        />
      </div>
      {d && !d.error && (
        <>
          {(d.exp || d.iat) && (
            <div className="shrink-0 flex flex-wrap gap-2 text-xs">
              {d.iat && (
                <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Issued: <code className="text-neutral-200">{d.iat}</code>
                </span>
              )}
              {d.exp && (
                <span
                  className={`px-2 py-1 rounded border ${
                    expired
                      ? 'bg-red-950/40 border-red-800 text-red-400'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                  }`}
                >
                  {expired ? 'Expired' : 'Expires'}: <code className="opacity-90">{d.exp}</code>
                </span>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
            <IOPanel title="Header" value={d.header} readOnly extensions={[json()]} />
            <IOPanel title="Payload" value={d.payload} readOnly extensions={[json()]} />
          </div>
          <div className="shrink-0 text-xs text-neutral-500 px-1">
            Signature: <code className="text-neutral-400 font-mono break-all">{d.signature}</code>
          </div>
        </>
      )}
    </div>
  );
}

registerTool({
  meta: {
    id: 'jwt-debugger',
    name: 'JWT Debugger',
    category: 'Decode',
    keywords: ['jwt', 'json', 'token', 'auth']
  },
  component: Component
});
