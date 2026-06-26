import { getTools } from '../lib/registry';

interface ToolListProps {
  onSelect: (id: string) => void;
}

export function ToolList({ onSelect }: ToolListProps) {
  const tools = getTools();
  return (
    <div className="flex-1 p-8">
      <h2 className="text-lg font-semibold text-neutral-100 mb-4">Pick a tool</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="text-left p-3 rounded-lg border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 transition-colors"
          >
            <div className="text-sm font-medium text-neutral-200">{t.name}</div>
            <div className="text-xs text-neutral-500">{t.category}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
