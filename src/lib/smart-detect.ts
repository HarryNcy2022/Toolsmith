/**
 * Clipboard smart-detect: guess which tool matches clipboard text.
 * Returns an array of {toolId, score} sorted by score desc, or null for the top match.
 *
 * Each rule has a score based on pattern specificity so that multi-match
 * detection can present the user with a ranked choice.
 */

interface Rule {
  test: RegExp;
  toolId: string;
  /** Higher = more specific / more confident match */
  score: number;
}

const RULES: Rule[] = [
  // JWT (three base64url parts separated by dots) — most specific
  { test: /^\s*eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, toolId: 'jwt-debugger', score: 150 },
  // cURL command
  { test: /^\s*curl\s+['"]?(https?:\/\/)/im, toolId: 'curl-to-code', score: 130 },
  // UUID v4
  { test: /^\s*[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*$/i, toolId: 'uuid-ulid', score: 120 },
  // Hex color
  { test: /^\s*#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i, toolId: 'color', score: 100 },
  // URL
  { test: /^\s*https?:\/\/[^\s]+/, toolId: 'url-parser', score: 90 },
  // HTML tags (<tag> or </tag>)
  { test: /^\s*</, toolId: 'html-to-jsx', score: 85 },
  // JSON
  { test: /^\s*[{[]/, toolId: 'json-formatter', score: 80 },
  // SQL
  { test: /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i, toolId: 'sql-format', score: 75 },
  // CSS rule (selector followed by {)
  { test: /^\s*[.#@]?[\w-]+(?:\s*\{)/m, toolId: 'css-format', score: 75 },
  // YAML (heuristic: key: value at line start)
  { test: /^\s*[\w][\w -]*:\s+\S/m, toolId: 'yaml-json', score: 70 },
  // Markdown heading or link
  { test: /^\s*(#{1,6}\s|\[.+?\]\(.+?\))/, toolId: 'markdown-preview', score: 65 },
  // Unix epoch (10-13 digit number)
  { test: /^\s*(\d{10}|\d{13})\s*$/, toolId: 'unix-time', score: 60 },
  // Base64 (long alphanumeric+/= string, no spaces, length multiple of 4ish)
  { test: /^\s*[A-Za-z0-9+\/\n]{20,}={0,2}\s*$/, toolId: 'base64', score: 50 },
  // IP address (dotted decimal)
  { test: /^\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\s*$/, toolId: 'number-base', score: 50 },
  // Number base (plain numeric)
  { test: /^\s*-?\d+\s*$/, toolId: 'number-base', score: 40 }
];

/**
 * Run all rules against `text`, return every match scored and sorted descending.
 * Empty array if nothing matches.
 */
export function detectTools(text: string): { toolId: string; score: number }[] {
  if (!text || !text.trim()) return [];
  const matches: { toolId: string; score: number }[] = [];
  for (const rule of RULES) {
    if (rule.test.test(text)) {
      matches.push({ toolId: rule.toolId, score: rule.score });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/** Backward-compatible single-result wrapper. */
export function detectTool(text: string): string | null {
  return detectTools(text)[0]?.toolId ?? null;
}
