import { contextBridge, ipcRenderer } from 'electron';

import type { WindowControlsAPI, WindowFrameState } from './types/window-controls';

const WINDOW_CONTROL_CHANNEL = 'window-control';
const WINDOW_STATE_CHANNEL = 'window-state-change';

const electronAPI: WindowControlsAPI = {
	minimize: () => ipcRenderer.invoke(WINDOW_CONTROL_CHANNEL, 'minimize'),
	toggleMaximize: () => ipcRenderer.invoke(WINDOW_CONTROL_CHANNEL, 'toggle-maximize'),
	close: () => ipcRenderer.invoke(WINDOW_CONTROL_CHANNEL, 'close'),
	getWindowState: () => ipcRenderer.invoke(WINDOW_CONTROL_CHANNEL, 'get-state'),
	onWindowStateChange: (callback: (state: WindowFrameState) => void) => {
		const subscription = (_event: unknown, state: WindowFrameState) => {
			callback(state);
		};
		ipcRenderer.on(WINDOW_STATE_CHANNEL, subscription);
		return () => {
			ipcRenderer.removeListener(WINDOW_STATE_CHANNEL, subscription);
		};
	}
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
