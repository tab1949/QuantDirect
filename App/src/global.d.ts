import type { WindowControlsAPI } from './types/window-controls';

export {};

declare global {
  interface Window {
    electronAPI?: WindowControlsAPI;
  }
}
