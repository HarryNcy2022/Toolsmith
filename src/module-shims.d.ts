// Type shims for libs that ship no .d.ts. Signatures cover our actual usage only.

declare module 'html-minifier-terser' {
  interface MinifyOptions {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
    removeRedundantAttributes?: boolean;
    removeScriptTypeAttributes?: boolean;
    removeStyleLinkTypeAttributes?: boolean;
    useShortDoctype?: boolean;
    minifyCSS?: boolean;
    minifyJS?: boolean;
    [key: string]: unknown;
  }
  export function minify(input: string, options?: MinifyOptions): Promise<string>;
}

declare module 'xml-formatter' {
  interface FormatOptions {
    indentation?: string;
    collapseContent?: boolean;
    lineSeparator?: string;
    [key: string]: unknown;
  }
  function formatter(xml: string, options?: FormatOptions): string;
  export default formatter;
}
