import { useCallback, useEffect, useRef, useState } from 'react';
import { registerTool } from '../lib/registry';
import { useToolState } from '../lib/tool-state';
import { useImageTransfer } from '../lib/image-transfer-store';
import { loadFabric } from '../lib/fabric-loader';

type ToolMode = 'select' | 'arrow' | 'highlight';
type Fabric = typeof import('fabric');
type FabricLine = InstanceType<Fabric['Line']>;
type FabricRect = InstanceType<Fabric['Rect']>;
type FabricObject = InstanceType<Fabric['Object']>;

// State type kept inline in useToolState call below

function Component() {
  const [state, setState] = useToolState<{ mode: ToolMode; hasImage: boolean }>('image-annotator', {
    mode: 'select',
    hasImage: false,
  });
  const { mode, hasImage } = state;

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricModRef = useRef<Fabric | null>(null);
  const canvasRef = useRef<InstanceType<Fabric['Canvas']> | null>(null);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const prevModeRef = useRef<string>('');
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const previewObjRef = useRef<FabricObject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricReady, setFabricReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const transferImage = useImageTransfer((s) => s.image);
  const clearTransferImage = useImageTransfer((s) => s.setImage);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  }

  // --- Undo / Redo ---
  const saveState = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON(['name']));
    undoStackRef.current = [...undoStackRef.current.slice(-49), json];
    redoStackRef.current = [];
  }, []);

  function undo() {
    const c = canvasRef.current;
    if (!c || undoStackRef.current.length === 0) return;
    const current = JSON.stringify(c.toJSON(['name']));
    redoStackRef.current = [...redoStackRef.current.slice(-49), current];
    const prev = undoStackRef.current.pop()!;
    c.loadFromJSON(JSON.parse(prev), () => {
      c.renderAll();
    });
  }

  function redo() {
    const c = canvasRef.current;
    if (!c || redoStackRef.current.length === 0) return;
    const current = JSON.stringify(c.toJSON(['name']));
    undoStackRef.current = [...undoStackRef.current.slice(-49), current];
    const next = redoStackRef.current.pop()!;
    c.loadFromJSON(JSON.parse(next), () => {
      c.renderAll();
    });
  }

  // --- Image loading ---
  const loadImageOntoCanvas = useCallback((dataUrl: string) => {
    const F = fabricModRef.current;
    const c = canvasRef.current;
    if (!F || !c) return;

    const img = new window.Image();
    img.onload = () => {
      const fImg = new F.Image(img);
      // Center + scale image to fit canvas, add as movable layer
      const cw = c.width;
      const ch = c.height;
      const fitScale = Math.min(cw / img.width, ch / img.height, 1);
      fImg.set({
        scaleX: fitScale,
        scaleY: fitScale,
        originX: 'center',
        originY: 'center',
        left: cw / 2,
        top: ch / 2,
        selectable: true,
        evented: true,
        name: 'image-layer',
      });
      fImg.setCoords();
      c.add(fImg);
      c.renderAll();
      undoStackRef.current = [];
      redoStackRef.current = [];
      setState({ hasImage: true });
    };
    img.onerror = () => setError('Could not load image');
    img.src = dataUrl;
  }, [setState]);

  async function pasteFromClipboard() {
    try {
      const dataUrl = await window.toolsmith?.readClipboardImage();
      if (dataUrl) {
        loadImageOntoCanvas(dataUrl);
        showFeedback('Pasted');
      } else {
        setError('No image on clipboard');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleFileUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Not an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        loadImageOntoCanvas(reader.result);
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  }

  // Import from image-clipboard history
  useEffect(() => {
    if (transferImage) {
      loadImageOntoCanvas(transferImage);
      clearTransferImage(null);
    }
  }, [transferImage, loadImageOntoCanvas, clearTransferImage]);

  // --- Fabric init ---
  useEffect(() => {
    let disposed = false;

    async function init() {
      const F = await loadFabric();
      if (disposed || !canvasElRef.current) return;
      fabricModRef.current = F;

      const c = new F.Canvas(canvasElRef.current, {
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: '#1a1a1a',
      });
      canvasRef.current = c;

      function onMouseDown(e: Record<string, unknown>) {
        const curMode = modeRef.current;
        // Fabric v7 uses scenePoint (pointer was v5/v6 API)
        const ev = e as { scenePoint?: { x: number; y: number }; target?: unknown };
        if (curMode !== 'arrow' && curMode !== 'highlight') return;
        if (!ev.scenePoint) return;
        drawStartRef.current = { x: ev.scenePoint.x, y: ev.scenePoint.y };

        const F2 = fabricModRef.current!;
        if (curMode === 'arrow') {
          const line = new F2.Line(
            [ev.scenePoint.x, ev.scenePoint.y, ev.scenePoint.x, ev.scenePoint.y],
            { stroke: '#ff3333', strokeWidth: 3, selectable: false, evented: false }
          );
          c.add(line);
          previewObjRef.current = line;
        } else {
          const rect = new F2.Rect({
            left: ev.scenePoint.x,
            top: ev.scenePoint.y,
            width: 0,
            height: 0,
            originX: 'left',
            originY: 'top',
            fill: 'rgba(255, 230, 0, 0.25)',
            stroke: 'rgba(255, 230, 0, 0.5)',
            strokeWidth: 1,
            selectable: false,
            evented: false,
          });
          c.add(rect);
          previewObjRef.current = rect;
        }
        c.renderAll();
      }

      function onMouseMove(e: Record<string, unknown>) {
        const curMode = modeRef.current;
        const ev = e as { scenePoint?: { x: number; y: number } };
        if (!drawStartRef.current || !previewObjRef.current || !ev.scenePoint) return;
        const start = drawStartRef.current;
        const F2 = fabricModRef.current!;

        if (curMode === 'arrow') {
          const lineObj = previewObjRef.current as FabricLine;
          lineObj.set({ x2: ev.scenePoint.x, y2: ev.scenePoint.y });
        } else {
          const rectObj = previewObjRef.current as FabricRect;
          const left = Math.min(start.x, ev.scenePoint.x);
          const top = Math.min(start.y, ev.scenePoint.y);
          rectObj.set({ left, top, width: Math.abs(ev.scenePoint.x - start.x), height: Math.abs(ev.scenePoint.y - start.y) });
        }
        previewObjRef.current.setCoords();
        c.renderAll();
      }

      function onMouseUp(e: Record<string, unknown>) {
        const curMode = modeRef.current;
        const ev = e as { scenePoint?: { x: number; y: number } };
        if (!drawStartRef.current || !previewObjRef.current || !ev.scenePoint) return;
        const start = drawStartRef.current;
        const F2 = fabricModRef.current!;

        // Remove preview object
        c.remove(previewObjRef.current);

        if (curMode === 'arrow') {
          const dx = ev.scenePoint.x - start.x;
          const dy = ev.scenePoint.y - start.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 5) {
            drawStartRef.current = null;
            previewObjRef.current = null;
            c.renderAll();
            return;
          }

          const line = new F2.Line([start.x, start.y, ev.scenePoint.x, ev.scenePoint.y], {
            stroke: '#ff3333',
            strokeWidth: 3,
            selectable: true,
            evented: true,
            name: 'arrow-line',
          });

          // Arrowhead triangle at endpoint
          const angle = Math.atan2(dy, dx);
          const arrowSize = 12;
          const tip = { x: ev.scenePoint.x, y: ev.scenePoint.y };
          const left = {
            x: tip.x - arrowSize * Math.cos(angle - Math.PI / 6),
            y: tip.y - arrowSize * Math.sin(angle - Math.PI / 6),
          };
          const right = {
            x: tip.x - arrowSize * Math.cos(angle + Math.PI / 6),
            y: tip.y - arrowSize * Math.sin(angle + Math.PI / 6),
          };
          const arrowhead = new F2.Polygon(
            [
              { x: tip.x, y: tip.y },
              { x: left.x, y: left.y },
              { x: right.x, y: right.y },
            ],
            { fill: '#ff3333', selectable: true, evented: true, name: 'arrow-head' }
          );

          const group = new F2.Group([line, arrowhead], {
            selectable: true,
            evented: true,
            name: 'arrow',
          });
          c.add(group);
        } else if (curMode === 'highlight') {
          const rect = new F2.Rect({
            left: Math.min(start.x, ev.scenePoint.x),
            top: Math.min(start.y, ev.scenePoint.y),
            width: Math.abs(ev.scenePoint.x - start.x),
            height: Math.abs(ev.scenePoint.y - start.y),
            originX: 'left',
            originY: 'top',
            fill: 'rgba(255, 230, 0, 0.25)',
            stroke: 'rgba(255, 230, 0, 0.5)',
            strokeWidth: 1,
            selectable: true,
            evented: true,
            name: 'highlight',
          });
          if (rect.width > 3 && rect.height > 3) {
            c.add(rect);
          }
        }

        drawStartRef.current = null;
        previewObjRef.current = null;
        c.renderAll();
        saveState();
      }

      c.on('mouse:down', onMouseDown);
      c.on('mouse:move', onMouseMove);
      c.on('mouse:up', onMouseUp);

      setFabricReady(true);

      return {
        canvas: c,
        detach: () => {
          c.off('mouse:down', onMouseDown);
          c.off('mouse:move', onMouseMove);
          c.off('mouse:up', onMouseUp);
        },
      };
    }

    const cleanupPromise = init();

    return () => {
      disposed = true;
      cleanupPromise.then((result) => {
        if (!result) return;
        result.detach();
        // Only dispose if no newer init replaced this canvas
        if (canvasRef.current === result.canvas) {
          result.canvas.dispose();
          canvasRef.current = null;
          fabricModRef.current = null;
          setFabricReady(false);
        }
      });
    };
    // mode ref avoids re-creating canvas, eslint exhaustive deps disabled intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  // Re-init canvas when mode changes
  useEffect(() => {
    if (!fabricReady) return;
    const c = canvasRef.current;
    if (!c) return;
    // Only re-init if mode actually changed
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;

    // For select mode, enable selection. For drawing modes, show crosshair
    if (mode === 'select') {
      c.selection = true;
      c.isDrawingMode = false;
      if (canvasElRef.current) {
        canvasElRef.current.style.cursor = 'default';
      }
    } else {
      c.selection = false;
      c.discardActiveObject();
      c.renderAll();
      if (canvasElRef.current) {
        canvasElRef.current.style.cursor = 'crosshair';
      }
    }
  }, [mode, fabricReady]);

  // ResizeObserver for canvas sizing
  useEffect(() => {
    if (!fabricReady) return;
    const container = containerRef.current;
    const c = canvasRef.current;
    if (!container || !c) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && c.getObjects().length === 0) {
          c.setDimensions({ width, height });
          c.renderAll();
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [fabricReady]);

  // Delete selected objects
  function deleteSelected() {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObjects();
    if (active.length === 0) return;
    saveState();
    active.forEach((obj) => c.remove(obj));
    c.discardActiveObject();
    c.renderAll();
    // Check if any objects remain (image is now a regular object)
    if (c.getObjects().length === 0) {
      setState({ hasImage: false });
    }
  }

  // Select all
  function selectAll() {
    const c = canvasRef.current;
    if (!c) return;
    const all = c.getObjects();
    if (all.length === 0) return;
    const F = fabricModRef.current;
    if (!F) return;
    const sel = new F.ActiveSelection(all, { canvas: c });
    c.setActiveObject(sel);
    c.renderAll();
  }

  // Deselect all
  function deselectAll() {
    const c = canvasRef.current;
    if (!c) return;
    c.discardActiveObject();
    c.renderAll();
  }

  // Export flattened PNG
  async function exportFlattened() {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const dataUrl = c.toDataURL({ format: 'png', multiplier: 1 });
      await window.toolsmith?.writeClipboardImage(dataUrl);
      showFeedback('Exported!');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Clear canvas
  function clearCanvas() {
    const c = canvasRef.current;
    if (!c) return;
    saveState();
    c.clear();
    c.backgroundColor = '#1a1a1a';
    c.renderAll();
    undoStackRef.current = [];
    redoStackRef.current = [];
    setState({ hasImage: false });
  }

  // --- Render ---
  const modeButtons: { mode: ToolMode; label: string }[] = [
    { mode: 'select', label: 'Select' },
    { mode: 'arrow', label: 'Arrow' },
    { mode: 'highlight', label: 'Highlight' },
  ];

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg shrink-0">
        {/* Import group */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => void pasteFromClipboard()}
            disabled={!fabricReady}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Paste image from clipboard"
          >
            Paste
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            title="Upload image file"
          >
            Upload
          </button>
          <button
            onClick={() => {
              const img = useImageTransfer.getState().image;
              if (img) loadImageOntoCanvas(img);
              else setError('No image in clipboard history');
            }}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            title="Import from Clipboard History"
          >
            History
          </button>
          <span className="w-px h-5 bg-neutral-700 mx-1" />
        </div>

        {/* Mode buttons */}
        <div className="flex gap-0.5 items-center">
          {modeButtons.map((b) => (
            <button
              key={b.mode}
              onClick={() => setState({ mode: b.mode })}
              className={`px-2 py-1 text-xs rounded ${
                mode === b.mode
                  ? 'bg-blue-600 text-white'
                  : 'border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
              }`}
            >
              {b.label}
            </button>
          ))}
          <span className="w-px h-5 bg-neutral-700 mx-1" />
        </div>

        {/* Actions group */}
        <div className="flex gap-1 items-center">
          <button
            onClick={deleteSelected}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-red-500 hover:text-red-400"
            title="Delete selected objects"
          >
            Delete
          </button>
          <button
            onClick={selectAll}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            title="Select all"
          >
            All
          </button>
          <button
            onClick={deselectAll}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            title="Deselect all"
          >
            None
          </button>
          <span className="w-px h-5 bg-neutral-700 mx-1" />
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 items-center">
          <button
            onClick={undo}
            disabled={undoStackRef.current.length === 0}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            ↩
          </button>
          <button
            onClick={redo}
            disabled={redoStackRef.current.length === 0}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            ↪
          </button>
          <span className="w-px h-5 bg-neutral-700 mx-1" />
        </div>

        {/* Export / Clear */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => void exportFlattened()}
            disabled={!hasImage}
            className="px-2.5 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export flattened PNG to clipboard"
          >
            Export
          </button>
          <button
            onClick={clearCanvas}
            className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            title="Clear canvas"
          >
            Clear
          </button>
        </div>

        {/* Feedback badge */}
        {feedback && (
          <span className="ml-auto text-[11px] text-green-400 font-medium">{feedback}</span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
        }}
      />

      {/* Error display */}
      {error && (
        <div className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 text-xs font-mono border border-red-900/50 shrink-0">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-red-200">×</button>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 rounded-lg border border-neutral-800 overflow-hidden relative bg-[repeating-conic-gradient(#262626_0%_25%,#1a1a1a_0%_50%)] bg-[length:20px_20px]"
      >
        <canvas ref={canvasElRef} />

        {/* Empty state overlay */}
        {!fabricReady ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
            Loading...
          </div>
        ) : !hasImage ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-600 pointer-events-none">
            Paste an image, upload a file, or import from Clipboard History
          </div>
        ) : null}
      </div>

      {/* Status bar */}
      {hasImage && (
        <div className="text-[11px] text-neutral-500 px-1 shrink-0">
          Mode: {mode} — {canvasRef.current?.getObjects().length ?? 0} objects
        </div>
      )}
    </div>
  );
}

registerTool({
  meta: {
    id: 'image-annotator',
    name: 'Image Annotator',
    category: 'Convert',
    keywords: ['image', 'annotate', 'arrow', 'highlight', 'markup', 'draw', 'canvas', 'screenshot', 'annotation'],
  },
  component: Component,
});
