import { defineBeautifyTool, type BeautifyCtx } from '../components/BeautifyTool';

// prettier + terser are sizable; lazy-load both.
// prettier 3 ships plugins in inconsistent module shapes:
//   - `prettier/plugins/babel` is UMD (CJS)
//   - `prettier/plugins/estree` is ESM
// Vite's interop places the plugin object in different spots, so unwrap each
// with `mod.default ?? mod` before handing them to `format({ plugins })`.
let prettierMod: any = null;
async function loadPrettier() {
  if (!prettierMod) {
    const [standaloneMod, babelMod, estreeMod] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree')
    ]);
    const standalone = (standaloneMod as any).default ?? standaloneMod;
    const babel = (babelMod as any).default ?? babelMod;
    const estree = (estreeMod as any).default ?? estreeMod;
    prettierMod = standalone;
    prettierMod.__plugins = [babel, estree];
  }
  return prettierMod;
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
    beautify: async (s, ctx: BeautifyCtx) => {
      const prettier = await loadPrettier();
      return prettier.format(s, {
        parser: 'babel',
        plugins: prettier.__plugins,
        semi: true,
        singleQuote: true,
        tabWidth: ctx.indent === 0 ? 4 : ctx.indent,
        useTabs: ctx.indent === 0
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
