import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { registerTool } from '../lib/registry';
import { CopyButton } from '../components/CopyButton';

const ECC_LEVELS: { id: 'L' | 'M' | 'Q' | 'H'; label: string }[] = [
  { id: 'L', label: 'L (7%)' },
  { id: 'M', label: 'M (15%)' },
  { id: 'Q', label: 'Q (25%)' },
  { id: 'H', label: 'H (30%)' }
];

function Component() {
  const [tab, setTab] = useState<'generate' | 'read'>('generate');

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="inline-flex rounded border border-neutral-800 overflow-hidden self-start shrink-0">
        <button
          onClick={() => setTab('generate')}
          className={`px-3 py-1 text-xs ${tab === 'generate' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Generate
        </button>
        <button
          onClick={() => setTab('read')}
          className={`px-3 py-1 text-xs ${tab === 'read' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'}`}
        >
          Read / Decode
        </button>
      </div>
      {tab === 'generate' ? <Generate /> : <Read />}
    </div>
  );
}

function Generate() {
  const [text, setText] = useState('https://example.com');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [size, setSize] = useState(240);
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) {
      setDataUrl('');
      setError(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, { errorCorrectionLevel: ecc, width: size, margin: 2 })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDataUrl('');
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, ecc, size]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode.png';
    a.click();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
      <div className="flex flex-col gap-3 bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Text / URL
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com"
            className="px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono text-neutral-200 resize-none flex-1 min-h-[80px]"
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Error correction
            <select
              value={ecc}
              onChange={(e) => setEcc(e.target.value as typeof ecc)}
              className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200"
            >
              {ECC_LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Size (px)
            <input
              type="number"
              min={64}
              max={1024}
              step={16}
              value={size}
              onChange={(e) => setSize(Math.max(64, Math.min(1024, Number(e.target.value) || 240)))}
              className="w-24 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-200"
            />
          </label>
        </div>
        {error && <div className="text-xs text-red-400 font-mono">{error}</div>}
      </div>
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
          <span>QR Code</span>
          {dataUrl && (
            <div className="flex gap-1.5">
              <CopyButton getText={() => dataUrl} />
              <button
                onClick={download}
                className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              >
                Download
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-white">
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" className="max-w-full max-h-full" />
          ) : (
            <span className="text-sm text-neutral-400">Enter text to generate</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Read() {
  const [decoded, setDecoded] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load a pasted/uploaded/dropped image: preview it AND attempt to decode.
  // Replaces any previously-created object URL to avoid leaking them.
  function loadImage(blob: Blob) {
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    return decodeFile(blob);
  }

  // Revoke the object URL on unmount so we don't leak it when leaving the tab.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  async function decodeFile(file: Blob) {
    setError(null);
    setDecoded('');
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (!result) {
        setError('No QR code found in image');
        return;
      }
      setDecoded(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function pasteFromClipboard() {
    setError(null);
    setDecoded('');
    try {
      // read() (not readText) is required to access image clipboard items.
      const items = await navigator.clipboard.read();
      const item = items.find((it) => Array.from(it.types).some((t) => t.startsWith('image/')));
      if (!item) {
        setError('No image found on clipboard');
        return;
      }
      const imageType = Array.from(item.types).find((t) => t.startsWith('image/'))!;
      const blob = await item.getType(imageType);
      await loadImage(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
          <span>Image</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => void pasteFromClipboard()}
              className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            >
              Paste
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            >
              Upload
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void loadImage(f);
          }}
        />
        {imageUrl ? (
          <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-neutral-950 overflow-auto">
            <img src={imageUrl} alt="Pasted QR" className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
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
              if (f) void loadImage(f);
            }}
            className={`flex-1 min-h-0 flex items-center justify-center p-6 border-2 border-dashed m-3 rounded-lg text-sm ${
              dragOver ? 'border-blue-500 bg-blue-600/10 text-blue-300' : 'border-neutral-700 text-neutral-500'
            }`}
          >
            Drop QR image here, or click Upload / Paste
          </div>
        )}
      </div>
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
          <span>Decoded content</span>
          {decoded && <CopyButton getText={() => decoded} />}
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {error ? (
            <div className="text-sm text-red-400 font-mono">{error}</div>
          ) : decoded ? (
            <pre className="text-sm font-mono text-neutral-200 whitespace-pre-wrap break-all">{decoded}</pre>
          ) : (
            <span className="text-sm text-neutral-600">Decoded text appears here</span>
          )}
        </div>
      </div>
    </div>
  );
}

registerTool({
  meta: {
    id: 'qr-code',
    name: 'QR Code',
    category: 'Convert',
    keywords: ['qr', 'qrcode', 'barcode', 'generate', 'decode', 'scan']
  },
  component: Component
});
