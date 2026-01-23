import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronAPI, WindowFrameState } from './types/window-controls';
import type { AppSettings } from './types/settings';

const WINDOW_CONTROL_CHANNEL = 'window-control';
const WINDOW_STATE_CHANNEL = 'window-state-change';
const WINDOW_SCALE_CHANNEL = 'window-scale-change';
const SETTINGS_LOAD_CHANNEL = 'app-settings-load';
const SETTINGS_SAVE_CHANNEL = 'app-settings-save';
const SETTINGS_PATH_CHANNEL = 'app-settings-path';

const electronAPI: ElectronAPI = {
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
	},
	onWindowScaleChange: (callback: (scale: number) => void) => {
		const subscription = (_event: unknown, scale: number) => {
			callback(scale);
		};
		ipcRenderer.on(WINDOW_SCALE_CHANNEL, subscription);
		return () => {
			ipcRenderer.removeListener(WINDOW_SCALE_CHANNEL, subscription);
		}
	},
	settings: {
		load: () => ipcRenderer.invoke(SETTINGS_LOAD_CHANNEL) as Promise<AppSettings>,
		save: (settings: AppSettings) => ipcRenderer.invoke(SETTINGS_SAVE_CHANNEL, settings) as Promise<AppSettings>,
		getPath: () => ipcRenderer.invoke(SETTINGS_PATH_CHANNEL) as Promise<string>
	}
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
