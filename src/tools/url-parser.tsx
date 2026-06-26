import { useMemo, useState } from 'react';
import { IOPanel, PasteButton, ClearButton } from '../components/IOPanel';
import { registerTool } from '../lib/registry';

function Component() {
  const [input, setInput] = useState('');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    let url: URL;
    try {
      url = new URL(input.trim());
    } catch {
      return { output: '', error: 'Invalid URL' };
    }
    const lines: string[] = [
      `protocol:  ${url.protocol}`,
      `username:  ${url.username || '-'}`,
      `password:  ${url.password ? '•'.repeat(url.password.length) : '-'}`,
      `host:      ${url.host}`,
      `  hostname: ${url.hostname}`,
      `  port:     ${url.port || '-'}`,
      `path:      ${url.pathname}`,
      `hash:      ${url.hash || '-'}`,
      '',
      'Query params:'
    ];
    const params = Array.from(url.searchParams.entries());
    if (params.length === 0) {
      lines.push('  (none)');
    } else {
      params.forEach(([k, v]) => lines.push(`  ${k} = ${v}`));
    }
    return { output: lines.join('\n'), error: null };
  }, [input]);

  return (
    <div className="flex gap-3 h-full">
      <IOPanel
        title="URL"
        value={input}
        onChange={setInput}
        placeholder="https://user:pass@example.com:8080/path?key=value#frag"
        actions={
          <>
            <PasteButton onPaste={setInput} />
            <ClearButton onClear={() => setInput('')} disabled={!input} />
          </>
        }
      />
      <IOPanel title="Parsed" value={output} readOnly placeholder="Breakdown appears here" error={error} />
    </div>
  );
}

registerTool({
  meta: {
    id: 'url-parser',
    name: 'URL Parser',
    category: 'Inspect',
    keywords: ['url', 'parse', 'query', 'params']
  },
  component: Component
});
