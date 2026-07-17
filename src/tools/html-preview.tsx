import { useState, useRef, useEffect } from 'react';
import { useToolState } from '../lib/tool-state';
import { registerTool } from '../lib/registry';
import { html as htmlLang } from '@codemirror/lang-html';
import { SplitPane } from '../components/SplitPane';
import { CodeEditor } from '../components/CodeEditor';
import { useToolSearch } from '../lib/tool-search';
import type { SearchSource } from '../types';
import type { EditorView } from '@codemirror/view';

function scrollTextNodeToMatch(root: Node, charIndex: number, matchLength: number): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let accumulated = 0;
  let lastParent: Element | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.textContent?.length ?? 0;
    if (charIndex < accumulated + len) {
      const offset = charIndex - accumulated;
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, Math.min(offset + matchLength, len));
      const win = node.ownerDocument?.defaultView;
      win?.getSelection()?.removeAllRanges();
      win?.getSelection()?.addRange(range);
      node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    accumulated += len;
    lastParent = node.parentElement;
  }
  lastParent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function Component() {
  const [state, setState] = useToolState<{ input: string }>('html-preview', { input: '' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });

  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { registerSource, unregisterSource } = useToolSearch();

  useEffect(() => {
    const editorSource: SearchSource = {
      id: 'html-preview:editor',
      toolId: 'html-preview',
      label: 'HTML',
      getContent: () => input,
      scrollToMatch: (charIndex, matchLength) => {
        if (!editorView) return;
        editorView.dispatch({
          selection: { anchor: charIndex, head: charIndex + (matchLength ?? 0) },
          scrollIntoView: true,
        });
      },
    };

    const previewSource: SearchSource = {
      id: 'html-preview:preview',
      toolId: 'html-preview',
      label: 'Preview',
      getContent: () => iframeRef.current?.contentDocument?.body?.textContent ?? '',
      scrollToMatch: (charIndex, matchLength) => {
        const body = iframeRef.current?.contentDocument?.body;
        if (body) {
          scrollTextNodeToMatch(body, charIndex, matchLength ?? 0);
        }
      },
    };

    registerSource(editorSource);
    registerSource(previewSource);

    return () => {
      unregisterSource('html-preview:editor');
      unregisterSource('html-preview:preview');
    };
  }, [input, editorView, registerSource, unregisterSource]);

  return (
    <SplitPane orientation="row" id="html-preview" className="h-full">
      <div className="flex flex-col min-h-0 h-full bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          HTML
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder="<h1>Hello</h1>"
            extensions={[htmlLang()]}
            onViewUpdate={setEditorView}
          />
        </div>
      </div>
      <div className="flex flex-col min-h-0 h-full bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          Preview
        </div>
        <div className="flex-1 min-h-0 bg-white overflow-auto">
          <iframe
            ref={iframeRef}
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
