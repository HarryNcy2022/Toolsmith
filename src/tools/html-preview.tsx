import { useState } from 'react';
import { registerTool } from '../lib/registry';
import { html as htmlLang } from '@codemirror/lang-html';
import { SplitPane } from '../components/SplitPane';
import { CodeEditor } from '../components/CodeEditor';

function Component() {
  const [input, setInput] = useState(
    '<div style="font-family:system-ui;padding:2rem;text-align:center">\n  <h1 style="color:#3b82f6">Hello</h1>\n  <p>Edit me on the left</p>\n</div>'
  );

  return (
    <SplitPane orientation="row" id="html-preview" className="h-full">
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          HTML
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder="<h1>Hello</h1>"
            extensions={[htmlLang()]}
          />
        </div>
      </div>
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          Preview
        </div>
        <div className="flex-1 min-h-0 bg-white overflow-auto">
          <iframe
            title="html-preview"
            // sandbox blocks scripts but allows styling — safe for an offline tool
            sandbox="allow-same-origin"
            srcDoc={input}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </SplitPane>
  );
}

registerTool({
  meta: {
    id: 'html-preview',
    name: 'HTML Preview',
    category: 'Format',
    keywords: ['html', 'preview', 'render', 'iframe']
  },
  component: Component
});
