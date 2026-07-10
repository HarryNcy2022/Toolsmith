// Hand-rolled HTML ↔ JSX converter. Avoids dead/unmaintained dependencies.
const ATTR_RENAMES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  usemap: 'useMap',
  frameborder: 'frameBorder',
  srcset: 'srcSet',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  textcontent: 'textContent',
  innerhtml: 'innerHTML'
};

const INVERTED_ATTR: Record<string, string> = Object.fromEntries(
  Object.entries(ATTR_RENAMES).map(([key, value]) => [value, key])
);

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function parseStyle(styleStr: string): string {
  const rules = styleStr
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean);
  const pairs: string[] = [];
  for (const rule of rules) {
    const idx = rule.indexOf(':');
    if (idx === -1) continue;
    const prop = rule.slice(0, idx).trim();
    const val = rule.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    const camel = prop.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    pairs.push(`${camel}: ${JSON.stringify(val)}`);
  }
  return `{{ ${pairs.join(', ')} }}`;
}

function convertAttr(name: string, val: string): string {
  let key = ATTR_RENAMES[name.toLowerCase()] ?? name;
  if (name.toLowerCase().startsWith('on') && name.toLowerCase() === name) {
    key = 'on' + name.slice(2).charAt(0).toUpperCase() + name.slice(3);
  }
  if (key === 'style') return `style=${parseStyle(val)}`;
  if (/^[\w-]+$/.test(val)) return `${key}=${val}`;
  return `${key}=${JSON.stringify(val)}`;
}

export function htmlToJsx(html: string): string {
  let out = html.trim();
  out = out.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>]*?)?)(\/?)>/g, (full) => {
    const match = full.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>]*?)?)(\/?)>$/);
    if (!match) return full;
    const closing = full.startsWith('</');
    const tag = match[1].toLowerCase();
    const attrStr = match[2] ?? '';
    const selfClose = match[3] === '/';
    if (closing) return `</${tag}>`;

    const attrs: string[] = [];
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRe.exec(attrStr)) !== null) {
      const [, attrName, attrVal] = attrMatch;
      if (attrVal === undefined) {
        attrs.push(ATTR_RENAMES[attrName.toLowerCase()] ?? attrName);
      } else {
        attrs.push(convertAttr(attrName, attrVal.replace(/^["']|["']$/g, '')));
      }
    }

    const attrPart = attrs.length ? ' ' + attrs.join(' ') : '';
    return VOID_TAGS.has(tag) || selfClose
      ? `<${tag}${attrPart} />`
      : `<${tag}${attrPart}>`;
  });

  return out;
}

function styleObjectToInline(styleStr: string): string {
  const inner = styleStr.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim();
  if (!inner) return '';
  const pairs: string[] = [];
  const pairRe = /(['"]?)([a-zA-Z]+[a-zA-Z0-9]*)\1\s*:\s*('[^']*'|"[^"]*"|-?\d+(?:\.\d+)?(?:px|em|rem|%)?|true|false|null|undefined)\s*,?/g;
  let match: RegExpExecArray | null;
  while ((match = pairRe.exec(inner)) !== null) {
    const prop = match[2];
    let val = match[3];
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    pairs.push(`${prop.replace(/[A-Z]/g, (char) => '-' + char.toLowerCase())}: ${val}`);
  }
  return pairs.join('; ');
}

export function jsxToHtml(jsx: string): string {
  let out = jsx.trim();
  out = out.replace(/\{\/\*([\s\S]*?)\*\/\}/g, '<!--$1-->');

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>]*?)?)>/g, (full) => {
    const match = full.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>]*?)?)>$/);
    if (!match) return full;
    const closing = full.startsWith('</');
    const tag = match[1];
    const attrStr = match[2] ?? '';
    if (closing) return `</${tag}>`;

    const attrs: string[] = [];
    const attrRe = /([a-zA-Z_$][\w]*)(?:\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRe.exec(attrStr)) !== null) {
      const [, attrName, attrVal] = attrMatch;
      const htmlName = INVERTED_ATTR[attrName] ?? attrName;
      if (attrVal === undefined) {
        attrs.push(htmlName);
        continue;
      }

      const isExpr = attrVal.startsWith('{') && attrVal.endsWith('}');
      const innerVal = isExpr ? attrVal.slice(1, -1).trim() : attrVal.replace(/^["']|["']$/g, '');
      if (htmlName === 'style' && isExpr && innerVal.startsWith('{') && innerVal.endsWith('}')) {
        attrs.push(`style="${styleObjectToInline(innerVal)}"`);
        continue;
      }
      if (innerVal === 'true') {
        attrs.push(isExpr ? htmlName : `${htmlName}="${innerVal}"`);
        continue;
      }
      if (innerVal === 'false' && isExpr) continue;

      if (isExpr) {
        if ((innerVal.startsWith("'") && innerVal.endsWith("'")) ||
            (innerVal.startsWith('"') && innerVal.endsWith('"'))) {
          attrs.push(`${htmlName}="${innerVal.slice(1, -1)}"`);
        } else if (/^-?\d+(?:\.\d+)?$/.test(innerVal)) {
          attrs.push(`${htmlName}="${innerVal}"`);
        } else {
          attrs.push(`${htmlName}=${attrVal}`);
        }
      } else {
        attrs.push(`${htmlName}="${innerVal}"`);
      }
    }

    const attrPart = attrs.length ? ' ' + attrs.join(' ') : '';
    if (VOID_TAGS.has(tag.toLowerCase())) return `<${tag}${attrPart}>`;
    return full.endsWith('/>') ? `<${tag}${attrPart} />` : `<${tag}${attrPart}>`;
  });

  return out;
}
