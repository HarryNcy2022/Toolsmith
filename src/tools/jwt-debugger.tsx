import { useMemo, useState } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import HmacSHA384 from 'crypto-js/hmac-sha384';
import HmacSHA512 from 'crypto-js/hmac-sha512';
import { enc } from 'crypto-js';
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

export type VerifyState =
  | { kind: 'unsupported'; alg: string }
  | { kind: 'needSecret'; unsigned?: boolean }
  | { kind: 'result'; valid: boolean; expected: string; unsigned: boolean };

/**
 * Verify an HS256/384/512 JWT signature against a secret. Recomputes the HMAC
 * over the raw `header.payload` base64url segments (NOT the decoded JSON) and
 * compares it to the third segment. For unsigned (2-part) tokens we report what
 * the expected signature *would* be given the secret. Returns `unsupported`
 * for non-HS algorithms (RS-ES variants need `jose`, deferred to P3).
 */
function verifySignature(token: string, secret: string): VerifyState | null {
  const t = token.trim();
  if (!t) return null;
  const parts = t.split('.');
  if (parts.length < 2) return null;

  let alg: string;
  try {
    const header = JSON.parse(b64urlDecode(parts[0]));
    alg = typeof header?.alg === 'string' ? header.alg : '';
  } catch {
    return null;
  }

  const hmacFn =
    alg === 'HS256' ? HmacSHA256 : alg === 'HS384' ? HmacSHA384 : alg === 'HS512' ? HmacSHA512 : null;

  if (!hmacFn) {
    return { kind: 'unsupported', alg: alg || 'unknown' };
  }

  const unsigned = parts.length < 3 || !parts[2];
  if (!secret) return { kind: 'needSecret', unsigned };

  const signingInput = `${parts[0]}.${parts[1]}`;
  // crypto-js Base64url output may carry padding; JWT signatures are unpadded.
  const expected = hmacFn(signingInput, secret).toString(enc.Base64url).replace(/=+$/, '');
  const given = parts[2] ?? '';
  return { kind: 'result', valid: !unsigned && given === expected, expected, unsigned };
}

function Component() {
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');

  const d = useMemo(() => decode(token), [token]);
  const expired = d?.exp ? new Date(d.exp).getTime() < Date.now() : false;
  const verify = useMemo(() => (d && !d.error ? verifySignature(token, secret) : null), [token, secret, d]);

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
          <div className="shrink-0 flex flex-col gap-2 text-xs px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-500">Signature:</span>
              <code className="text-neutral-400 font-mono break-all flex-1 min-w-0">
                {d.signature}
              </code>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-neutral-400">
                Secret
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="enter secret to verify HS256/384/512"
                  className="w-72 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-200 font-mono"
                />
              </label>
              {verify?.kind === 'needSecret' && (
                <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  enter a secret to verify{verify.unsigned ? ' (token is unsigned)' : ''}
                </span>
              )}
              {verify?.kind === 'unsupported' && (
                <span
                  className="px-2 py-1 rounded border bg-neutral-900 border-neutral-700 text-neutral-400"
                  title="RS*/ES* verification needs the jose dependency (deferred to P3)"
                >
                  verify not supported for {verify.alg}
                </span>
              )}
              {verify?.kind === 'result' &&
                (verify.unsigned ? (
                  <span className="px-2 py-1 rounded border bg-yellow-950/40 border-yellow-800 text-yellow-400">
                    unsigned token — expected sig would be:{' '}
                    <code className="font-mono break-all">{verify.expected}</code>
                  </span>
                ) : verify.valid ? (
                  <span className="px-2 py-1 rounded border bg-emerald-950/40 border-emerald-800 text-emerald-400">
                    ✓ signature valid
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded border bg-red-950/40 border-red-800 text-red-400">
                    ✗ signature mismatch (expected <code className="font-mono break-all">{verify.expected}</code>)
                  </span>
                ))}
            </div>
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
