// Type shims for libs that ship no .d.ts. Signatures cover our actual usage only.

declare module 'html-minifier-terser' {
  interface MinifyOptions {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
    removeRedundantAttributes?: boolean;
    removeScriptTypeAttributes?: boolean;
    removeStyleLinkTypeAttributes?: boolean;
    useShortDoctype?: boolean;
    minifyCSS?: boolean;
    minifyJS?: boolean;
    [key: string]: unknown;
  }
  export function minify(input: string, options?: MinifyOptions): Promise<string>;
}

declare module 'fabric' {
  import { Canvas } from 'fabric';

  export interface ICanvasOptions {
    selection?: boolean;
    preserveObjectStacking?: boolean;
    [key: string]: unknown;
  }

  export interface IEvent<E extends Event = Event> {
    e: E;
    target?: Object;
    subTargets?: Object[];
    selected?: Object[];
    scenePoint?: { x: number; y: number };
    viewportPoint?: { x: number; y: number };
    [key: string]: unknown;
  }

  export class Object {
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    selectable: boolean;
    evented: boolean;
    visible: boolean;
    name?: string;
    set(options: Record<string, unknown>): this;
    setCoords(): void;
    clone(callback: (obj: Object) => void): void;
    toJSON(propertiesToInclude?: string[]): Record<string, unknown>;
    on(event: string, handler: (e: IEvent) => void): void;
  }

  export class Rect extends Object {
    constructor(options?: Record<string, unknown>);
    rx?: number;
    ry?: number;
  }

  export class Line extends Object {
    constructor(points: [number, number, number, number], options?: Record<string, unknown>);
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  export class Polygon extends Object {
    constructor(points: { x: number; y: number }[], options?: Record<string, unknown>);
  }

  export class Group extends Object {
    constructor(objects: Object[], options?: Record<string, unknown>);
    getObjects(): Object[];
    forEachObject(callback: (obj: Object) => void): void;
  }

  export class ActiveSelection extends Group {}

  export class Image extends Object {
    static fromURL(url: string, callback: (img: Image) => void, options?: Record<string, unknown>): void;
    constructor(element: HTMLImageElement, options?: Record<string, unknown>);
    canvas?: Canvas;
    setSource(img: HTMLImageElement): void;
  }

  export class Canvas {
    constructor(element: string | HTMLCanvasElement, options?: ICanvasOptions);
    setWidth(value: number): void;
    setHeight(value: number): void;
    renderAll(): void;
    clear(): void;
    dispose(): void;
    add(...objects: Object[]): void;
    remove(...objects: Object[]): void;
    getObjects(type?: string): Object[];
    getActiveObjects(): Object[];
    getActiveObject(): Object | null;
    setActiveObject(obj: Object): void;
    discardActiveObject(): void;
    isDrawingMode: boolean;
    selection: boolean;
    preserveObjectStacking: boolean;
    backgroundColor: string;
    backgroundImage?: Image;
    width: number;
    height: number;
    on(event: string, handler: (e: IEvent) => void): void;
    off(event: string, handler: (e: IEvent) => void): void;
    toDataURL(options?: { format?: string; multiplier?: number; quality?: number }): string;
    toJSON(propertiesToInclude?: string[]): Record<string, unknown>;
    loadFromJSON(json: Record<string, unknown>, callback?: () => void): void;
    setDimensions(dimensions: { width: number; height: number }): void;
    forEachObject(callback: (obj: Object) => void): void;
  }
}

declare module 'xml-formatter' {
  interface FormatOptions {
    indentation?: string;
    collapseContent?: boolean;
    lineSeparator?: string;
    [key: string]: unknown;
  }
  function formatter(xml: string, options?: FormatOptions): string;
  export default formatter;
}
