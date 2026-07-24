interface ToolsmithAPI {
  toggleWindow(): Promise<void>;
  readClipboard(): Promise<string>;
  clipboardHasImage(): Promise<boolean>;
  readClipboardImage(): Promise<string | null>;
  writeClipboardImage(dataUrl: string): Promise<void>;
  getConfig(key?: string): Promise<unknown>;
  setConfig(key: string, value: unknown): Promise<{ success: boolean; error?: string }>;
}

interface Window {
  toolsmith?: ToolsmithAPI;
}
