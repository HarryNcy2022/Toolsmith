import { useMemo, useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { registerTool } from '../lib/registry';
import { markdown as mdLang } from '@codemirror/lang-markdown';
import { CodeEditor } from '../components/CodeEditor';
import { SplitPane } from '../components/SplitPane';
import { useToolState } from '../lib/tool-state';
import { useToolSearch } from '../lib/tool-search';
import type { SearchSource } from '../types';
import type { EditorView } from '@codemirror/view';

marked.setOptions({ gfm: true, breaks: false });

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
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    accumulated += len;
    lastParent = node.parentElement;
  }
  lastParent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function Component() {
  const [state, setState] = useToolState<{ input: string }>('markdown-preview', { input: '' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });

  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { registerSource, unregisterSource } = useToolSearch();

  useEffect(() => {
    const editorSource: SearchSource = {
      id: 'markdown-preview:editor',
      toolId: 'markdown-preview',
      label: 'Markdown',
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
      id: 'markdown-preview:preview',
      toolId: 'markdown-preview',
      label: 'Preview',
      getContent: () => previewRef.current?.textContent ?? '',
      scrollToMatch: (charIndex, matchLength) => {
        if (previewRef.current) {
          scrollTextNodeToMatch(previewRef.current, charIndex, matchLength ?? 0);
        }
      },
    };

    registerSource(editorSource);
    registerSource(previewSource);

    return () => {
      unregisterSource('markdown-preview:editor');
      unregisterSource('markdown-preview:preview');
    };
  }, [input, editorView, registerSource, unregisterSource]);

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
          <CodeEditor value={input} onChange={setInput} extensions={[mdLang()]} placeholder="# Hello" onViewUpdate={setEditorView} />
        </div>
      </div>
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
          Preview
        </div>
        <div className="flex-1 min-h-0 overflow-auto bg-neutral-900">
          <div
            ref={previewRef}
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
