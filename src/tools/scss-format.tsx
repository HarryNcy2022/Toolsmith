import { css_beautify as beautifyCss } from 'js-beautify';
import { defineBeautifyTool } from '../components/BeautifyTool';
import { css as cssLang } from '@codemirror/lang-css';

// sass ships ~8MB with native bindings. Lazy-load so it lands in its own chunk
// and doesn't bloat the initial bundle (renderer-side native bindings are fine
// in Electron — they're available via the main-process Node runtime).
let sassMod: typeof import('sass') | null = null;
async function loadSass() {
  if (!sassMod) sassMod = await import('sass');
  return sassMod;
}

defineBeautifyTool(
  {
    id: 'scss-format',
    name: 'SCSS Beautify/Minify',
    category: 'Format',
    keywords: ['scss', 'sass', 'format', 'beautify', 'minify', 'css']
  },
  {
    // SCSS: compile to CSS then beautify the output. (Beautifying raw SCSS syntax
    // directly is unreliable, so we compile first.)
    beautify: async (s) => {
      const sass = await loadSass();
      const compiled = sass.compileString(s).css;
      return beautifyCss(compiled, { indent_size: 2 });
    },
    minify: async (s) => {
      const sass = await loadSass();
      const compiled = sass.compileString(s).css;
      return compiled
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
    }
  },
  {
    inputPlaceholder: '$color: #333;\n.btn { color: $color; &:hover { color: #000; } }',
    extensions: [cssLang()]
  }
);
