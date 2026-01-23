import type { ElectronAPI } from './types/window-controls';

export {};

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
