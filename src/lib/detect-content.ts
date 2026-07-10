/**
 * Content-type classifier — determines what kind of content a clipboard string
 * (or image flag) represents and maps it to relevant tool IDs.
 *
 * Pure TypeScript: no React dependencies, no external imports.
 * Used by the Ctrl+K palette to recommend tools for clipboard content.
 */

export type DetectedContentType =
  | 'html'
  | 'css'
  | 'json'
  | 'sql'
  | 'yaml'
  | 'markdown'
  | 'url'
  | 'jwt'
  | 'image'
  | 'string';

export interface ContentTypeInfo {
  type: DetectedContentType;
  /** Display label like "HTML", "CSS", "JSON", "Image", "Pure String" */
  label: string;
  /** Top 3 recommended tool IDs for this content type */
  recommendedToolIds: string[];
}

const LABELS: Record<DetectedContentType, string> = {
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  sql: 'SQL',
  yaml: 'YAML',
  markdown: 'Markdown',
  url: 'URL',
  jwt: 'JWT',
  image: 'Image',
  string: 'Pure String',
};

export const CONTENT_TYPE_TOOLS: Record<
  DetectedContentType,
  { recommended: string[] }
> = {
  html: {
    recommended: ['html-to-jsx', 'html-format', 'html-preview']
  },
  css: {
    recommended: ['css-format', 'scss-format', 'html-format']
  },
  json: {
    recommended: ['json-formatter', 'yaml-json', 'json-to-code']
  },
  sql: {
    recommended: ['sql-format', 'json-formatter', 'yaml-json']
  },
  yaml: {
    recommended: ['yaml-json', 'json-formatter', 'sql-format']
  },
  markdown: {
    recommended: ['markdown-preview', 'html-format', 'html-preview']
  },
  url: {
    recommended: ['url-parser', 'url-encode', 'json-formatter']
  },
  jwt: {
    recommended: ['jwt-debugger', 'base64', 'json-formatter']
  },
  image: {
    recommended: ['base64-image', 'qr-code']
  },
  string: {
    recommended: ['number-base', 'base64', 'url-encode']
  },
};

/**
 * Classify clipboard text (or image flag) into a content type.
 *
 * Detection priority (first match wins):
 *  1. hasImage === true → 'image'
 *  2. Starts with HTML doctype or opening tag → 'html'
 *  3. Starts with `{` or `[` and parses as JSON → 'json'
 *  4. CSS selector pattern or at-rule → 'css'
 *  5. SQL keyword at line start → 'sql'
 *  6. YAML key: value pattern → 'yaml'
 *  7. Markdown heading or inline link → 'markdown'
 *  8. http(s) URL → 'url'
 *  9. JWT (three base64url parts) → 'jwt'
 * 10. Everything else → 'string'
 */
export function detectContentType(
  text: string,
  hasImage: boolean
): DetectedContentType {
  if (hasImage) {
    return 'image';
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return 'string';
  }

  // HTML: doctype or opening tag
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<!DOCTYPE html') ||
    trimmed.startsWith('<')
  ) {
    return 'html';
  }

  // JSON: starts with { or [ and passes parse
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // fall through to other checks
    }
  }

  // CSS: selector followed by {, or @media/@import/:root
  if (
    /^\s*[.#@]?[\w-]+(?:\s*\{)/m.test(trimmed) ||
    /^\s*@(media|import|keyframes|font-face|supports|page)\b/im.test(trimmed) ||
    /^\s*:root\s*\{/im.test(trimmed)
  ) {
    return 'css';
  }

  // SQL: DML/DDL keyword at line start
  if (
    /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/im.test(trimmed)
  ) {
    return 'sql';
  }

  // YAML: key: value heuristic
  if (/^\s*[\w][\w -]*:\s+\S/m.test(trimmed)) {
    return 'yaml';
  }

  // Markdown: heading (#) or inline link [text](url)
  if (/^\s*(#{1,6}\s|\[.+?\]\(.+?\))/.test(trimmed)) {
    return 'markdown';
  }

  // URL
  if (/^\s*https?:\/\//.test(trimmed)) {
    return 'url';
  }

  // JWT: three base64url parts, first part starts with eyJ
  if (
    /^\s*eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(trimmed)
  ) {
    return 'jwt';
  }

  return 'string';
}

/**
 * Return display metadata and tool mappings for a detected content type.
 */
export function getContentTypeInfo(type: DetectedContentType): ContentTypeInfo {
  const tools = CONTENT_TYPE_TOOLS[type];
  return {
    type,
    label: LABELS[type],
    recommendedToolIds: tools.recommended
  };
}
