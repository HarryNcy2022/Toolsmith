import formatter from 'xml-formatter';
import { defineBeautifyTool } from '../components/BeautifyTool';
import { xml as xmlLang } from '@codemirror/lang-xml';

defineBeautifyTool(
  {
    id: 'xml-format',
    name: 'XML Beautify',
    category: 'Format',
    keywords: ['xml', 'format', 'beautify', 'svg', 'rss']
  },
  {
    beautify: (s) =>
      formatter(s, {
        indentation: '  ',
        collapseContent: true,
        lineSeparator: '\n'
      }),
    // xml-formatter has no minify; collapse to a single line as a lightweight minify
    minify: (s) => s.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim()
  },
  {
    inputPlaceholder: '<root><item>text</item></root>',
    extensions: [xmlLang()]
  }
);
