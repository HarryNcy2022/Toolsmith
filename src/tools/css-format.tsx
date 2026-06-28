import { css_beautify as beautifyCss } from 'js-beautify';
import { defineBeautifyTool } from '../components/BeautifyTool';
import { css as cssLang } from '@codemirror/lang-css';

// clean-css lazy-loaded — it references Node fs/url for file rebasing which we
// never use, but bundling it eagerly pulls those externalizations into the
// initial chunk.
// Note: clean-css v5 is CJS where `module.exports = function CleanCSS(...)`.
// Under Vite's ESM interop `(await import('clean-css')).default` is undefined,
// so unwrap with `mod.default ?? mod` to get the constructor.
let minifierMod: any = null;
async function loadMinifier() {
  if (!minifierMod) {
    const mod = await import('clean-css');
    minifierMod = (mod as any).default ?? mod;
  }
  return minifierMod;
}

defineBeautifyTool(
  {
    id: 'css-format',
    name: 'CSS Beautify/Minify',
    category: 'Format',
    keywords: ['css', 'format', 'beautify', 'minify']
  },
  {
    beautify: (s) => beautifyCss(s, { indent_size: 2 }),
    minify: async (s) => {
      const CleanCSS = await loadMinifier();
      const out = await new CleanCSS({ returnPromise: true, level: 2 }).minify(s);
      if (out.errors.length) throw new Error(out.errors.join('; '));
      return out.styles;
    }
  },
  {
    inputPlaceholder: 'body{margin:0;padding:0}',
    extensions: [cssLang()]
  }
);
