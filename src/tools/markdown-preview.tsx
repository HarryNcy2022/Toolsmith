import { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { registerTool } from '../lib/registry';
import { markdown as mdLang } from '@codemirror/lang-markdown';
import { CodeEditor } from '../components/CodeEditor';
import { SplitPane } from '../components/SplitPane';

marked.setOptions({ gfm: true, breaks: false });

function Component() {
  const [input, setInput] = useState('');

  const html = useMemo(() => {
    try {
      const raw = marked.parse(input, { async: false }) as string;
      return DOMPurify.sanitize(raw);
    } catch (e) {
      return `<pre style="color:#f87171">${e instanceof Error ? e.message : String(e)}</pre>`;
    }
  }, [input]);

  return (
    <SplitPane orientation="row" id="markdown-preview" className="h-full">
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          Markdown
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={input} onChange={setInput} extensions={[mdLang()]} placeholder="# Hello" />
        </div>
      </div>
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          Preview
        </div>
        <div className="flex-1 min-h-0 overflow-auto bg-neutral-900">
          <div
            className="markdown-body p-6"
            // marked output is sanitized via DOMPurify before injection
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </SplitPane>
  );
}

registerTool({
  meta: {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    category: 'Format',
    keywords: ['markdown', 'md', 'preview', 'gfm', 'render']
  },
  component: Component
});
