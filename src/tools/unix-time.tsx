import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(weekOfYear);

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
      <code className="flex-1 text-sm text-neutral-200 font-mono break-all">{value}</code>
      <CopyButton getText={() => value} />
    </div>
  );
}

function Component() {
  const [epoch, setEpoch] = useState<string>(String(Math.floor(Date.now() / 1000)));
  const [tz, setTz] = useState(LOCAL_TZ);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const sec = Number(epoch);
  const valid = !isNaN(sec) && epoch.trim() !== '';

  // auto-detect ms vs s
  const ms = valid ? (epoch.length > 10 ? sec : sec * 1000) : NaN;
  const d = valid ? dayjs(ms).tz(tz) : null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-neutral-500">Epoch</label>
        <input
          value={epoch}
          onChange={(e) => setEpoch(e.target.value)}
          inputMode="numeric"
          className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
          placeholder="1700000000"
        />
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
          <div className="text-sm text-red-400 py-2">Invalid epoch number</div>
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
