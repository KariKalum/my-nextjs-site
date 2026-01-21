export {};

declare global {
  interface Window {
    google: typeof globalThis.google;
  }
}

