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

function Component() {
  const [input, setInput] = useState(
    '<div class="card">\n  <h1 style="color:red;font-size:24px">Title</h1>\n  <p>Hello <strong>world</strong></p>\n  <button onclick="x">Click</button>\n</div>'
  );

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      return { output: htmlToJsx(input), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  return (
    <div className="flex gap-3 h-full">
      <IOPanel
        title="HTML"
        value={input}
        onChange={setInput}
        placeholder="<div class='x'><p>hi</p></div>"
        extensions={[htmlLang()]}
        actions={
          <>
            <PasteButton onPaste={setInput} />
            <ClearButton onClear={() => setInput('')} disabled={!input} />
          </>
        }
      />
      <IOPanel
        title="JSX"
        value={output}
        readOnly
        placeholder="React JSX appears here"
        extensions={[jsLang()]}
        error={error}
      />
    </div>
  );
}

registerTool({
  meta: {
    id: 'html-to-jsx',
    name: 'HTML → JSX',
    category: 'Convert',
    keywords: ['html', 'jsx', 'react', 'convert']
  },
  component: Component
});
