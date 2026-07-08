import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';
import { html as htmlLang } from '@codemirror/lang-html';
import { javascript as jsLang } from '@codemirror/lang-javascript';

// Hand-rolled HTML → JSX converter. Avoids dead/unmaintained deps.
// Handles the common cases: attribute renames, self-closing void tags,
// inline style conversion, style/onclick→camelCase, comments.
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

// inverted map for JSX → HTML direction
const INVERTED_ATTR: Record<string, string> = Object.fromEntries(
  Object.entries(ATTR_RENAMES).map(([k, v]) => [v, k])
);

// void elements that must self-close in JSX
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function parseStyle(styleStr: string): string {
  // "color:red; font-size:12px" → {{ color: 'red', fontSize: '12px' }}
  const rules = styleStr
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean);
  const pairs: string[] = [];
  for (const rule of rules) {
    const idx = rule.indexOf(':');
    if (idx === -1) continue;
    const prop = rule.slice(0, idx).trim();
    const val = rule.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    // kebab-case → camelCase
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    pairs.push(`${camel}: ${JSON.stringify(val)}`);
  }
  return `{{ ${pairs.join(', ')} }}`;
}

function convertAttr(name: string, val: string): string {
  let key = ATTR_RENAMES[name.toLowerCase()] ?? name;
  // on* event handlers: lowercase or with dashes → camelCase (onclick → onClick)
  if (name.toLowerCase().startsWith('on') && name.toLowerCase() === name) {
    key = 'on' + name.slice(2).charAt(0).toUpperCase() + name.slice(3);
  }
  // style="..." → style={{ ... }}
  if (key === 'style') {
    return `style=${parseStyle(val)}`;
  }
  // values with spaces or special chars get quoted; bare words stay bare
  if (/^[\w-]+$/.test(val)) {
    return `${key}=${val}`;
  }
  return `${key}=${JSON.stringify(val)}`;
}

export function htmlToJsx(html: string): string {
  let out = html.trim();

  // HTML comments → JSX expressions
  out = out.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // Process each tag. Match an opening/void/closing tag, rewrite attrs.
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>]*?)?)(\/?)>/g, (full) => {
    const m = full.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>]*?)?)(\/?)>$/);
    if (!m) return full;
    const closing = full.startsWith('</');
    const tag = m[1].toLowerCase();
    const attrStr = m[2] ?? '';
    const selfClose = m[3] === '/';

    if (closing) return `</${tag}>`;

    // parse attributes: name="value" name='value' name=value name
    const attrs: string[] = [];
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(attrStr)) !== null) {
      const [, attrName, attrVal] = am;
      if (attrVal === undefined) {
        // boolean attribute → bare name
        const renamed = ATTR_RENAMES[attrName.toLowerCase()] ?? attrName;
        attrs.push(renamed);
      } else {
        const cleanVal = attrVal.replace(/^["']|["']$/g, '');
        attrs.push(convertAttr(attrName, cleanVal));
      }
    }

    const isVoid = VOID_TAGS.has(tag);
    const attrPart = attrs.length ? ' ' + attrs.join(' ') : '';
    if (isVoid || selfClose) {
      return `<${tag}${attrPart} />`;
    }
    return `<${tag}${attrPart}>`;
  });

  return out;
}

// Style object string → inline style string: {{ color: 'red', fontSize: '14px' }} → color: red; font-size: 14px
function styleObjectToInline(styleStr: string): string {
  // Extract the content between outer {{ ... }}
  const inner = styleStr.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim();
  if (!inner) return '';
  const pairs: string[] = [];
  // Match prop: value pairs (handles strings, numbers, nested braces gracefully)
  const pairRe = /(['"]?)([a-zA-Z]+[a-zA-Z0-9]*)\1\s*:\s*('[^']*'|"[^"]*"|-?\d+(?:\.\d+)?(?:px|em|rem|%)?|true|false|null|undefined)\s*,?/g;
  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(inner)) !== null) {
    const prop = m[2];
    let val = m[3];
    // Strip quotes from string values
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    // camelCase → kebab-case
    const kebab = prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
    pairs.push(`${kebab}: ${val}`);
  }
  return pairs.join('; ');
}

function jsxToHtml(jsx: string): string {
  let out = jsx.trim();

  // 1. JSX comments → HTML comments: {/* comment */} → <!-- comment -->
  out = out.replace(/\{\/\*([\s\S]*?)\*\/\}/g, '<!--$1-->');

  // 2. Process tags — handle attrs, style objects, boolean attrs, void tags
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>]*?)?)>/g, (full) => {
    const m = full.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>]*?)?)>$/);
    if (!m) return full;
    const closing = full.startsWith('</');
    const tag = m[1];
    const attrStr = m[2] ?? '';

    if (closing) return `</${tag}>`;

    // Parse JSX attributes
    const attrs: string[] = [];
    // Match: name=value (with JSX expression values), or bare boolean attrs
    const attrRe = /([a-zA-Z_$][\w]*)(?:\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(attrStr)) !== null) {
      const [, attrName, attrVal] = am;

      // Invert known renames: className → class, htmlFor → for, etc.
      let htmlName = INVERTED_ATTR[attrName] ?? attrName;

      if (attrVal === undefined) {
        // Bare attribute: keep as-is
        attrs.push(htmlName);
        continue;
      }

      const isExpr = attrVal.startsWith('{') && attrVal.endsWith('}');
      const innerVal = isExpr ? attrVal.slice(1, -1).trim() : attrVal.replace(/^["']|["']$/g, '');

      // Style objects: style={{ color: 'red' }}
      if (htmlName === 'style' && isExpr && innerVal.startsWith('{') && innerVal.endsWith('}')) {
        const inlineStyle = styleObjectToInline(innerVal);
        if (inlineStyle) {
          attrs.push(`style="${inlineStyle}"`);
        } else {
          attrs.push(`style=""`);
        }
        continue;
      }

      // Boolean attributes: disabled={true} → disabled, checked={false} → remove
      if (innerVal === 'true') {
        // expression boolean true → bare attribute
        if (isExpr) {
          attrs.push(htmlName);
        } else {
          attrs.push(`${htmlName}="${innerVal}"`);
        }
        continue;
      }
      if (innerVal === 'false' && isExpr) {
        // checked={false} → skip the attribute entirely
        continue;
      }

      // Attribute expressions: foo={"bar"} → foo="bar", foo={42} → foo="42"
      if (isExpr) {
        // Check if it's a string expression (quoted inside braces)
        if ((innerVal.startsWith("'") && innerVal.endsWith("'")) ||
            (innerVal.startsWith('"') && innerVal.endsWith('"'))) {
          const strVal = innerVal.slice(1, -1);
          attrs.push(`${htmlName}="${strVal}"`);
        } else if (/^-?\d+(?:\.\d+)?$/.test(innerVal)) {
          // Numeric expression
          attrs.push(`${htmlName}="${innerVal}"`);
        } else {
          // Complex expression — wrap back for safety
          attrs.push(`${htmlName}=${attrVal}`);
        }
      } else {
        // Regular quoted value
        attrs.push(`${htmlName}="${innerVal}"`);
      }
    }

    const isVoid = VOID_TAGS.has(tag.toLowerCase());
    const attrPart = attrs.length ? ' ' + attrs.join(' ') : '';
    if (isVoid) {
      // Void tags: remove self-closing slash, just <tag attrs>
      return `<${tag}${attrPart}>`;
    }
    // Check for self-closing non-void tag in source — preserve
    const selfClose = full.endsWith('/>');
    return selfClose ? `<${tag}${attrPart} />` : `<${tag}${attrPart}>`;
  });

  return out;
}

function Component() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'to-jsx' | 'to-html'>('to-jsx');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      const fn = direction === 'to-jsx' ? htmlToJsx : jsxToHtml;
      return { output: fn(input), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, direction]);

  const isToJsx = direction === 'to-jsx';
  const inputTitle = isToJsx ? 'HTML' : 'JSX';
  const outputTitle = isToJsx ? 'JSX' : 'HTML';
  const inputLang = isToJsx ? htmlLang : jsLang;
  const outputLang = isToJsx ? jsLang : htmlLang;
  const placeholder = isToJsx ? "<div class='x'><p>hi</p></div>" : '<div className="x"><p>hi</p></div>';

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-1 bg-neutral-800 rounded-lg p-0.5 self-start shrink-0">
        <button
          onClick={() => setDirection('to-jsx')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${direction === 'to-jsx' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          HTML → JSX
        </button>
        <button
          onClick={() => setDirection('to-html')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${direction === 'to-html' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          JSX → HTML
        </button>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        <IOPanel
          title={inputTitle}
          value={input}
          onChange={setInput}
          placeholder={placeholder}
          extensions={[inputLang()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={outputTitle}
          value={output}
          readOnly
          placeholder={isToJsx ? 'React JSX appears here' : 'HTML appears here'}
          extensions={[outputLang()]}
          error={error}
        />
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'html-to-jsx',
    name: 'HTML ↔ JSX',
    category: 'Convert',
    keywords: ['html', 'jsx', 'react', 'convert', 'jsx-to-html']
  },
  component: Component
});
