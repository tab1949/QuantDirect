export type WindowFrameState = 'restored' | 'maximized' | 'fullscreen';

export type WindowControlAction = 'minimize' | 'toggle-maximize' | 'close' | 'get-state';

export type WindowControlsTeardown = () => void;

export interface WindowControlsAPI {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<WindowFrameState | undefined>;
  close: () => Promise<void>;
  getWindowState: () => Promise<WindowFrameState | undefined>;
  onWindowStateChange: (callback: (state: WindowFrameState) => void) => WindowControlsTeardown;
  onWindowScaleChange: (callback: (scale: number) => void) => WindowControlsTeardown;
}
