import { html_beautify as beautifyHtml } from 'js-beautify';
import { defineBeautifyTool, type BeautifyCtx } from '../components/BeautifyTool';
import { html as htmlLang } from '@codemirror/lang-html';

// html-minifier-terser is async + pulls terser/acorn; lazy-load it.
let minifyMod: typeof import('html-minifier-terser') | null = null;
async function loadMinifier() {
  if (!minifyMod) minifyMod = await import('html-minifier-terser');
  return minifyMod;
}

defineBeautifyTool(
  {
    id: 'html-format',
    name: 'HTML Beautify/Minify',
    category: 'Format',
    keywords: ['html', 'format', 'beautify', 'minify']
  },
  {
    beautify: (s, ctx: BeautifyCtx) =>
      beautifyHtml(s, {
        indent_size: ctx.indent === 0 ? 1 : ctx.indent,
        indent_with_tabs: ctx.indent === 0,
        wrap_line_length: 0
      }),
    minify: async (s) => {
      const { minify } = await loadMinifier();
      return minify(s, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true
      });
    }
  },
  {
    inputPlaceholder: '<div><p>hello</p></div>',
    extensions: [htmlLang()]
  }
);
