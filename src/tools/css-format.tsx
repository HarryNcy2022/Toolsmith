import { css_beautify as beautifyCss } from 'js-beautify';
import { defineBeautifyTool } from '../components/BeautifyTool';
import { css as cssLang } from '@codemirror/lang-css';

// clean-css lazy-loaded — it references Node fs/url for file rebasing which we
// never use, but bundling it eagerly pulls those externalizations into the
// initial chunk.
let minifierMod: typeof import('clean-css') | null = null;
async function loadMinifier() {
  if (!minifierMod) minifierMod = (await import('clean-css')).default;
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
