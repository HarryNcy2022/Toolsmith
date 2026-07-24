import { useCallback, useEffect, useRef, useState } from 'react';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';
import { addImage, clearAll, deleteImage, getAllImages, updateOrder } from '../lib/image-db';
import type { ImageEntry } from '../lib/image-db';

function Component() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{ dataUrl: string; x: number; y: number } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useToolState for lightweight UI preferences only (not image data)
  useToolState('image-clipboard', {});

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = await getAllImages();
      setImages(entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  function showCopyFeedback(msg: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setCopyFeedback(msg);
    feedbackTimer.current = setTimeout(() => {
      setCopyFeedback(null);
      feedbackTimer.current = null;
    }, 1500);
  }

  async function handlePaste() {
    setError(null);
    try {
      const dataUrl = await window.toolsmith?.readClipboardImage();
      if (!dataUrl) {
        setError('No image found on clipboard');
        return;
      }
      await addImage(dataUrl);
      await loadImages();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteImage(id);
      await loadImages();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Clear all saved images?')) return;
    try {
      await clearAll();
      await loadImages();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCopy(dataUrl: string) {
    try {
      await window.toolsmith?.writeClipboardImage(dataUrl);
      showCopyFeedback('Copied!');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDragStart(e: React.DragEvent, id: number) {
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  async function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    setDragOverIndex(null);
    const draggedId = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(draggedId)) return;

    const fromIndex = images.findIndex(img => img.id === draggedId);
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setImages(reordered);
    try {
      await updateOrder(reordered.map(img => img.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      await loadImages();
    }
  }

  function handleMouseEnter(e: React.MouseEvent, dataUrl: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredImage({ dataUrl, x: rect.right + 12, y: rect.top });
  }

  function handleMouseLeavePreview() {
    setHoveredImage(null);
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex flex-col min-h-0 bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden flex-1">
        {/* Header bar */}
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span>Image Clipboard</span>
            {!loading && (
              <span className="text-[11px] text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5 leading-none">
                {images.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {copyFeedback && (
              <span className="text-[11px] text-green-400">{copyFeedback}</span>
            )}
            <button
              onClick={() => void handlePaste()}
              className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            >
              Paste
            </button>
            <button
              onClick={() => void handleClearAll()}
              disabled={images.length === 0}
              className="px-2.5 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Error bar */}
        {error && (
          <div className="px-3 py-1.5 border-b border-neutral-800 bg-red-950/40 text-red-400 text-xs font-mono shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable grid body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-neutral-500">
              Loading...
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-neutral-600">
              No images saved. Paste an image to get started.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => void handleDrop(e, index)}
                  onClick={() => void handleCopy(img.dataUrl)}
                  onMouseEnter={(e) => handleMouseEnter(e, img.dataUrl)}
                  onMouseLeave={handleMouseLeavePreview}
                  className={`relative w-32 h-24 rounded border overflow-hidden cursor-pointer group shrink-0 bg-neutral-900
                    ${dragOverIndex === index ? 'border-blue-500 ring-1 ring-blue-500' : 'border-neutral-700'}
                    hover:border-neutral-500 transition-colors`}
                >
                  <img
                    src={img.dataUrl}
                    alt={`clipboard image ${index + 1}`}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* Delete button — hidden until hover */}
                  <button
                    onClick={(e) => void handleDelete(img.id, e)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded bg-black/60 text-neutral-300 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-opacity text-xs leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover preview tooltip */}
      {hoveredImage && (
        <div
          className="fixed pointer-events-none z-50 rounded-lg shadow-xl border border-neutral-700 bg-neutral-900"
          style={{ left: hoveredImage.x, top: hoveredImage.y, maxWidth: '24rem', maxHeight: '24rem', width: 'auto', height: 'auto' }}
        >
          <img
            src={hoveredImage.dataUrl}
            alt="preview"
            className="w-auto h-auto max-w-full max-h-96 object-contain"
          />
        </div>
      )}
    </div>
  );
}

registerTool({
  meta: {
    id: 'image-clipboard',
    name: 'Image Clipboard',
    category: 'Inspect',
    keywords: ['image', 'clipboard', 'paste', 'screenshot', 'history', 'screenshots'],
  },
  component: Component,
});
