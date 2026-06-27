interface DevUtilsAPI {
  toggleWindow(): Promise<void>;
  readClipboard(): Promise<string>;
}

interface Window {
  devutils?: DevUtilsAPI;
}
