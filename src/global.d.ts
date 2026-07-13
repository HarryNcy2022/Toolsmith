interface ToolsmithAPI {
  toggleWindow(): Promise<void>;
  readClipboard(): Promise<string>;
  clipboardHasImage(): Promise<boolean>;
  getConfig(key?: string): Promise<unknown>;
  setConfig(key: string, value: unknown): Promise<{ success: boolean; error?: string }>;
}

interface Window {
  toolsmith?: ToolsmithAPI;
}
