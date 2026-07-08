import { type ReactNode, useEffect, useState } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

interface SplitPaneProps {
  /** 'row' for side-by-side, 'col' for stacked */
  orientation: 'row' | 'col';
  /** Default size of the first pane, in percentage (0-100). Default 50. */
  defaultSize?: number;
  /** Minimum size of each pane, in percentage (0-100). Default 20. */
  minSize?: number;
  /** Unique id for persisting pane sizes. */
  id: string;
  /** Exactly two children: [left/top pane, right/bottom pane] */
  children: [ReactNode, ReactNode];
  /** Additional classes for the container. Pass 'h-full' when parent is not flex. */
  className?: string;
}

/**
 * Thin wrapper over react-resizable-panels.
 *
 * Renders a resizable split pane on desktop (≥1024px) and a simple
 * vertical stack on mobile, preserving the existing responsive behaviour.
 *
 * Usage:
 * ```tsx
 * <SplitPane orientation="row" id="my-tool">
 *   <IOPanel ... />
 *   <IOPanel ... />
 * </SplitPane>
 * ```
 */
export function SplitPane({
  orientation,
  defaultSize = 50,
  minSize = 20,
  id,
  children,
  className = 'flex-1 min-h-0',
}: SplitPaneProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Persisted layout via localStorage
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id });

  // Mobile: simple vertical stack without resize handles
  if (isMobile) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {children[0]}
        {children[1]}
      </div>
    );
  }

  const panelIds = ['first', 'second'];
  const dir = orientation === 'row' ? 'horizontal' : 'vertical';

  return (
    <Group
      id={id}
      orientation={dir}
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className={className}
    >
      <Panel id={panelIds[0]} defaultSize={defaultSize} minSize={minSize}>
        {children[0]}
      </Panel>
      <Separator
        className={[
          'shrink-0 bg-neutral-800 hover:bg-blue-600 transition-colors',
          'flex items-center justify-center',
          orientation === 'row' ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize',
        ].join(' ')}
      >
        <div
          className={`rounded-full bg-neutral-600 ${
            orientation === 'row' ? 'w-0.5 h-8' : 'w-8 h-0.5'
          }`}
        />
      </Separator>
      <Panel id={panelIds[1]} defaultSize={100 - defaultSize} minSize={minSize}>
        {children[1]}
      </Panel>
    </Group>
  );
}
