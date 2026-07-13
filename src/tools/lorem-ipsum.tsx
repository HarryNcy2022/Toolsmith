import { useState } from 'react';
import { useToolState } from '../lib/tool-state';
import { loremIpsum } from 'lorem-ipsum';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

type Unit = 'paragraphs' | 'sentences' | 'words';
type Type = 'lorem' | 'names' | 'emails' | 'urls' | 'tweets';

const FIRST_NAMES = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen','Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Dorothy','Paul','Kimberly','Andrew','Emily','Joshua','Donna'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson'];
const DOMAINS = ['gmail.com','outlook.com','yahoo.com','proton.me','icloud.com','hotmail.com','mail.com','example.org','test.io','dev.net'];
const URL_PATHS = ['blog','docs','about','contact','products','services','login','dashboard','settings','profile','posts','articles','help','support','status','api','docs/v2','community','events','pricing'];
const TLDs = ['com','org','net','io','dev','app','co','me'];

function genName(): string {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

function generateNames(count: number): string {
  return Array.from({length: count}, () => genName()).join('\n');
}

function generateEmails(count: number): string {
  return Array.from({length: count}, () => {
    const parts = genName().toLowerCase().replace(/\s+/g, '.');
    return `${parts}${Math.floor(Math.random() * 99)}@${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}`;
  }).join('\n');
}

function generateUrls(count: number): string {
  return Array.from({length: count}, () => {
    const path = URL_PATHS[Math.floor(Math.random() * URL_PATHS.length)];
    const tld = TLDs[Math.floor(Math.random() * TLDs.length)];
    const words = ['example','sample','test','demo','my','app','web','cloud','data','code'];
    const word = words[Math.floor(Math.random() * words.length)];
    return `https://www.${word}${path.slice(0,4)}.${tld}/${path}`;
  }).join('\n');
}

function generateTweets(count: number): string {
  const subjects = ['I','We','The team','Our developer','The API','This feature','The new update','Users'];
  const verbs = ['just released','launched','fixed','improved','updated','shipped','deployed','announced'];
  const objects = ['a new version','support for v2','the dashboard','performance','the editor','dark mode','export','import'];
  const hashtags = ['#dev','#update','#coding','#productivity','#tools','#webdev','#typescript','#release'];
  return Array.from({length: count}, () => {
    const s = subjects[Math.floor(Math.random()*subjects.length)];
    const v = verbs[Math.floor(Math.random()*verbs.length)];
    const o = objects[Math.floor(Math.random()*objects.length)];
    const h = hashtags[Math.floor(Math.random()*hashtags.length)];
    return `${s} ${v} ${o} ${h}`;
  }).join('\n\n');
}

function Component() {
  const [state, setState] = useToolState('lorem-ipsum', {
    type: 'lorem' as Type,
    unit: 'paragraphs' as Unit,
    count: 3
  });
  const { type, unit, count } = state;
  const setType = (v: Type) => setState({ type: v });
  const setUnit = (v: Unit) => setState({ unit: v });
  const setCount = (v: number) => setState({ count: v });
  const [output, setOutput] = useState('');

  function regen() {
    switch (type) {
      case 'names':
        setOutput(generateNames(count));
        break;
      case 'emails':
        setOutput(generateEmails(count));
        break;
      case 'urls':
        setOutput(generateUrls(count));
        break;
      case 'tweets':
        setOutput(generateTweets(count));
        break;
      default: {
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
        break;
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex flex-wrap items-end gap-3 shrink-0">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Type)}
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200"
          >
            <option value="lorem">Lorem Ipsum</option>
            <option value="names">Names</option>
            <option value="emails">Emails</option>
            <option value="urls">URLs</option>
            <option value="tweets">Tweets</option>
          </select>
        </label>
        {type === 'lorem' && (
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
        )}
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Count
          <input
            data-toolsmith-focus-input
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
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'names', 'emails', 'urls', 'tweets']
  },
  component: Component
});
