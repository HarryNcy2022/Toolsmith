import { defineBeautifyTool } from '../components/BeautifyTool';

// prettier + terser are sizable; lazy-load both.
let prettierMod: typeof import('prettier/standalone') | null = null;
async function loadPrettier() {
  if (!prettierMod) {
    const [standalone, babel, estree] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree')
    ]);
    // stash plugins on a holder to keep refs
    prettierMod = standalone;
    (prettierMod as any).__plugins = [babel.default ?? babel, estree.default ?? estree];
  }
  return prettierMod as typeof import('prettier/standalone') & { __plugins: any[] };
}

let terserMod: typeof import('terser') | null = null;
async function loadTerser() {
  if (!terserMod) terserMod = await import('terser');
  return terserMod;
}

defineBeautifyTool(
  {
    id: 'js-format',
    name: 'JS Beautify/Minify',
    category: 'Format',
    keywords: ['javascript', 'js', 'format', 'beautify', 'minify', 'prettier']
  },
  {
    beautify: async (s) => {
      const prettier = await loadPrettier();
      return prettier.format(s, {
        parser: 'babel',
        plugins: (prettier as any).__plugins,
        semi: true,
        singleQuote: true
      });
    },
    minify: async (s) => {
      const { minify } = await loadTerser();
      const out = await minify(s, { compress: true, mangle: true, format: { comments: false } });
      return out.code ?? '';
    }
  },
  {
    inputPlaceholder: 'const x=1;function f(){return x*2;}'
  }
);
