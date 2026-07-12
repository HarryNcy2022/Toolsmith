import { useEffect, useState } from 'react';
import { useToolState } from '../lib/tool-state';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);

const TZS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney'
];

// Default to the user's local IANA zone, and make sure it's selectable even
// if it isn't in the curated TZS list above (otherwise the <select> would
// render the default with no matching option).
const LOCAL_TZ = dayjs.tz.guess();
const TZ_OPTIONS = TZS.includes(LOCAL_TZ) ? TZS : [LOCAL_TZ, ...TZS];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-neutral-800/60 last:border-0">
      <div className="w-40 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="flex-1">
        <code className="block text-sm text-neutral-200 font-mono break-all">{value}</code>
      </div>
      <CopyButton getText={() => value} />
    </div>
  );
}

const MODES = [
  { id: 'epoch' as const, label: 'Epoch' },
  { id: 'iso' as const, label: 'ISO 8601' },
  { id: 'rfc' as const, label: 'RFC 2822' },
];

const PLACEHOLDERS: Record<string, string> = {
  epoch: '1700000000',
  iso: '2024-01-01T00:00:00Z',
  rfc: 'Mon, 01 Jan 2024 00:00:00 +0000',
};

type InputMode = 'epoch' | 'iso' | 'rfc';

function Component() {
  const [input, setInput] = useState<string>('');
  const [opt, setOpt] = useToolState('unix-time', {
    inputMode: 'epoch' as InputMode,
    tz: LOCAL_TZ
  });
  const { inputMode, tz } = opt;
  const setInputMode = (v: InputMode) => setOpt({ inputMode: v });
  const setTz = (v: string) => setOpt({ tz: v });
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  let ms: number;
  let d: dayjs.Dayjs | null;
  let valid = false;
  let errorMsg = '';

  if (inputMode === 'epoch') {
    const sec = Number(input);
    valid = !isNaN(sec) && input.trim() !== '';
    ms = valid ? (input.length > 10 ? sec : sec * 1000) : NaN;
    d = valid ? dayjs(ms).tz(tz) : null;
    if (!valid) errorMsg = 'Invalid epoch number';
  } else if (inputMode === 'iso') {
    const parsed = dayjs(input.trim());
    valid = parsed.isValid();
    ms = valid ? parsed.valueOf() : NaN;
    d = valid ? parsed.tz(tz) : null;
    if (!valid) errorMsg = 'Invalid ISO 8601 date string';
  } else {
    // rfc
    const parsed = dayjs(input.trim(), 'ddd, DD MMM YYYY HH:mm:ss ZZ');
    valid = parsed.isValid();
    ms = valid ? parsed.valueOf() : NaN;
    d = valid ? parsed.tz(tz) : null;
    if (!valid) errorMsg = 'Invalid RFC 2822 date string';
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-neutral-500">Input</label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          inputMode={inputMode === 'epoch' ? 'numeric' : 'text'}
          className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
          placeholder={PLACEHOLDERS[inputMode]}
        />
        <button
          onClick={() => {
            if (inputMode === 'epoch') setInput(String(now));
            else if (inputMode === 'iso') setInput(dayjs(now * 1000).toISOString());
            else setInput(dayjs(now * 1000).format('ddd, DD MMM YYYY HH:mm:ss ZZ'));
          }}
          className="px-2.5 py-1.5 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
        >
          Now
        </button>
        <div className="flex rounded-lg overflow-hidden border border-neutral-700">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setInputMode(m.id)}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                inputMode === m.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <select
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300"
        >
          {TZ_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="px-1 text-xs text-neutral-600">Now: {now}</div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-2">
        {!valid || !d ? (
          <div className="text-sm text-red-400 py-2">{errorMsg}</div>
        ) : (
          <>
            <Row label="ISO 8601" value={d.toISOString()} />
            <Row label="UTC" value={dayjs(ms).utc().format('YYYY-MM-DD HH:mm:ss')} />
            <Row label={`${tz}`} value={d.format('YYYY-MM-DD HH:mm:ss')} />
            <Row label="Relative" value={d.fromNow()} />
            <Row label="Day" value={d.format('dddd')} />
            <Row label="Week" value={`Week ${d.week()} of ${d.year()}`} />
            <Row label="ms epoch" value={String(ms)} />
          </>
        )}
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'unix-time',
    name: 'Unix Time Converter',
    category: 'Time',
    keywords: ['epoch', 'timestamp', 'date', 'time', 'unix']
  },
  component: Component
});
