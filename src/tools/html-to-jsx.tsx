import { useMemo } from 'react';
import { html as htmlLang } from '@codemirror/lang-html';
import { javascript as jsLang } from '@codemirror/lang-javascript';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { SplitPane } from '../components/SplitPane';
import { htmlToJsx, jsxToHtml } from '../lib/html-jsx';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';

function Component() {
  const [state, setState] = useToolState('html-to-jsx', { input: '', direction: 'to-jsx' as 'to-jsx' | 'to-html' });
  const input = state.input;
  const setInput = (v: string) => setState({ input: v });
  const direction = state.direction;
  const setDirection = (v: 'to-jsx' | 'to-html') => setState({ direction: v });

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      const convert = direction === 'to-jsx' ? htmlToJsx : jsxToHtml;
      return { output: convert(input), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, direction]);

  const isToJsx = direction === 'to-jsx';
  const inputTitle = isToJsx ? 'HTML' : 'JSX';
  const outputTitle = isToJsx ? 'JSX' : 'HTML';
  const inputLang = isToJsx ? htmlLang : jsLang;
  const outputLang = isToJsx ? jsLang : htmlLang;
  const placeholder = isToJsx ? "<div class='x'><p>hi</p></div>" : '<div className="x"><p>hi</p></div>';

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-1 bg-neutral-800 rounded-lg p-0.5 self-start shrink-0">
        <button
          onClick={() => setDirection('to-jsx')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${direction === 'to-jsx' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          HTML → JSX
        </button>
        <button
          onClick={() => setDirection('to-html')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${direction === 'to-html' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          JSX → HTML
        </button>
      </div>
      <SplitPane orientation="row" id="html-to-jsx">
        <IOPanel
          title={inputTitle}
          value={input}
          onChange={setInput}
          placeholder={placeholder}
          extensions={[inputLang()]}
          actions={
            <>
              <PasteButton onPaste={setInput} />
              <ClearButton onClear={() => setInput('')} disabled={!input} />
            </>
          }
        />
        <IOPanel
          title={outputTitle}
          value={output}
          readOnly
          placeholder={isToJsx ? 'React JSX appears here' : 'HTML appears here'}
          extensions={[outputLang()]}
          error={error}
        />
      </SplitPane>
    </div>
  );
}

registerTool({
  meta: {
    id: 'html-to-jsx',
    name: 'HTML ↔ JSX',
    category: 'Convert',
    keywords: ['html', 'jsx', 'react', 'convert', 'jsx-to-html']
  },
  component: Component
});
