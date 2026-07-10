export interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
}

export interface RegexHighlightResult {
  html: string;
  matches: MatchInfo[];
  error: string | null;
}

export interface RegexReplaceResult {
  output: string;
  error: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function globalRegex(pattern: string, flags: string): RegExp {
  return new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
}

export function highlightRegex(text: string, pattern: string, flags: string): RegexHighlightResult {
  if (!pattern) return { html: escapeHtml(text), matches: [], error: null };

  let regex: RegExp;
  try {
    regex = globalRegex(pattern, flags);
  } catch (e) {
    return {
      html: escapeHtml(text),
      matches: [],
      error: e instanceof Error ? e.message : String(e)
    };
  }

  const matches: MatchInfo[] = [];
  let html = '';
  let last = 0;
  let match: RegExpExecArray | null;
  let safety = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex++;
      continue;
    }
    matches.push({ match: match[0], index: match.index, groups: match.slice(1) });
    html += escapeHtml(text.slice(last, match.index));
    html += `<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">${escapeHtml(match[0])}</mark>`;
    last = match.index + match[0].length;
    if (++safety > 5000) break;
  }
  html += escapeHtml(text.slice(last));
  return { html, matches, error: null };
}

function expandTemplate(template: string, match: RegExpExecArray): string {
  const named = (match.groups ?? {}) as Record<string, string>;
  return template.replace(/\$(\$|&|`|'|\d+|<[^>]+>)/g, (whole, body: string) => {
    switch (body) {
      case '$':
        return '$';
      case '&':
        return match[0];
      case '`':
        return match.input ? match.input.slice(0, match.index) : '';
      case "'":
        return match.input ? match.input.slice(match.index + match[0].length) : '';
      default:
        if (body[0] === '<') {
          const name = body.slice(1, -1);
          return name in named ? named[name] : whole;
        }
        const index = Number(body);
        return index < match.length && match[index] !== undefined ? (match[index] as string) : '';
    }
  });
}

export function replaceRegex(
  text: string,
  pattern: string,
  flags: string,
  replacement: string
): RegexReplaceResult {
  if (!pattern || !text) return { output: '', error: null };

  try {
    const regex = globalRegex(pattern, flags);
    let output = '';
    let last = 0;
    let match: RegExpExecArray | null;
    let safety = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      output += text.slice(last, match.index);
      output += expandTemplate(replacement, match);
      last = match.index + match[0].length;
      if (++safety > 5000) break;
    }
    output += text.slice(last);
    return { output, error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e) };
  }
}
