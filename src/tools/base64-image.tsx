import { useRef, useState } from 'react';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Component() {
  const [dataUrl, setDataUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Not an image file');
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setDataUrl(url);
      setPreview(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function decodeToImage(b64: string) {
    setError(null);
    const trimmed = b64.trim();
    if (!trimmed) {
      setPreview('');
      return;
    }
    // accept both raw data: URL and bare base64
    const url = trimmed.startsWith('data:') ? trimmed : `data:image/png;base64,${trimmed}`;
    setPreview(url);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        {/* drop zone + data url */}
        <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
            <span>Image / Data URL</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              >
                Upload
              </button>
              <CopyButton getText={() => dataUrl} disabled={!dataUrl} />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className={`flex-1 min-h-0 overflow-auto p-3 text-sm font-mono text-neutral-300 ${
              dragOver ? 'bg-blue-600/10' : ''
            }`}
          >
            <textarea
              value={dataUrl}
              onChange={(e) => {
                setDataUrl(e.target.value);
                decodeToImage(e.target.value);
              }}
              placeholder="Paste data:image/... URL, or drop/upload an image →"
              className="w-full h-full min-h-[120px] bg-transparent resize-none focus:outline-none text-neutral-300"
            />
          </div>
          {error && (
            <div className="px-3 py-1.5 border-t border-neutral-800 bg-red-950/40 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* preview */}
        <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
            Preview
          </div>
          <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 bg-[repeating-conic-gradient(#262626_0%_25%,#1a1a1a_0%_50%)] bg-[length:20px_20px]">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="max-w-full max-h-full object-contain"
                onError={() => setError('Could not render image from this data URL')}
              />
            ) : (
              <span className="text-sm text-neutral-600">No image</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'base64-image',
    name: 'Base64 Image',
    category: 'Encode',
    keywords: ['base64', 'image', 'data-url', 'encode', 'decode']
  },
  component: Component
});
