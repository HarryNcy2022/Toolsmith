/**
 * Clipboard smart-detect: guess which tool matches clipboard text.
 * Returns a tool id, or null if nothing matches.
 *
 * Order matters — first match wins. Most-specific patterns first.
 */
const RULES: { test: RegExp; toolId: string }[] = [
  // cURL command
  { test: /^\s*curl\s+['"]?(https?:\/\/)/im, toolId: 'curl-to-code' },
  // JWT (three base64url parts separated by dots)
  { test: /^\s*eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, toolId: 'jwt-debugger' },
  // Unix epoch (10-13 digit number)
  { test: /^\s*(\d{10}|\d{13})\s*$/, toolId: 'unix-time' },
  // UUID v4
  { test: /^\s*[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*$/i, toolId: 'uuid-ulid' },
  // URL
  { test: /^\s*https?:\/\/[^\s]+/, toolId: 'url-parser' },
  // JSON
  { test: /^\s*[{[]/, toolId: 'json-formatter' },
  // SQL
  { test: /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i, toolId: 'sql-format' },
  // YAML (heuristic: key: value at line start)
  { test: /^\s*[\w][\w -]*:\s+\S/m, toolId: 'yaml-json' },
  // Hex color
  { test: /^\s*#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i, toolId: 'color' },
  // Base64 (long alphanumeric+/= string, no spaces, length multiple of 4ish)
  { test: /^\s*[A-Za-z0-9+/\n]{20,}={0,2}\s*$/, toolId: 'base64' },
  // Number base (plain numeric)
  { test: /^\s*-?\d+\s*$/, toolId: 'number-base' }
];

export function detectTool(text: string): string | null {
  if (!text || !text.trim()) return null;
  for (const rule of RULES) {
    if (rule.test.test(text)) return rule.toolId;
  }
  return null;
}
