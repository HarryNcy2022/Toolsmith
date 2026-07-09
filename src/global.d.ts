interface DevUtilsAPI {
  toggleWindow(): Promise<void>;
  readClipboard(): Promise<string>;
  clipboardHasImage(): Promise<boolean>;
}

interface Window {
  devutils?: DevUtilsAPI;
}
