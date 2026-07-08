import { useState } from 'react';
import { loremIpsum } from 'lorem-ipsum';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

type Unit = 'paragraphs' | 'sentences' | 'words';

function Component() {
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState('');

  function regen() {
    const text = loremIpsum({
      count,
      format: 'plain',
      units: unit,
      sentenceLowerBound: 5,
      sentenceUpperBound: 15,
      paragraphLowerBound: 3,
      paragraphUpperBound: 7
    } as Parameters<typeof loremIpsum>[0]);
    setOutput(text);
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex flex-wrap items-end gap-3 shrink-0">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Unit
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Count
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-20 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
          />
        </label>
        <button
          onClick={regen}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white"
        >
          Generate
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">Output</span>
          <CopyButton getText={() => output} disabled={!output} />
        </div>
        {output ? (
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-sm text-neutral-200 whitespace-pre-wrap font-sans leading-relaxed">
              {output}
            </pre>
          </div>
        ) : (
          <div className="px-4 py-3 text-sm text-neutral-600">Click Generate</div>
        )}
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    category: 'Generate',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy']
  },
  component: Component
});
