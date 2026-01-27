import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronAPI, WindowFrameState } from './types/window-controls';
import type { AppSettings } from './types/settings';
import * as ipcChannel from './ipcChannels';

const electronAPI: ElectronAPI = {
	minimize: () => ipcRenderer.invoke(ipcChannel.WINDOW_CONTROL_CHANNEL, 'minimize'),
	toggleMaximize: () => ipcRenderer.invoke(ipcChannel.WINDOW_CONTROL_CHANNEL, 'toggle-maximize'),
	close: () => ipcRenderer.invoke(ipcChannel.WINDOW_CONTROL_CHANNEL, 'close'),
	getWindowState: () => ipcRenderer.invoke(ipcChannel.WINDOW_CONTROL_CHANNEL, 'get-state'),
	onWindowStateChange: (callback: (state: WindowFrameState) => void) => {
		const subscription = (_event: unknown, state: WindowFrameState) => {
			callback(state);
		};
		ipcRenderer.on(ipcChannel.WINDOW_STATE_CHANNEL, subscription);
		return () => {
			ipcRenderer.removeListener(ipcChannel.WINDOW_STATE_CHANNEL, subscription);
		};
	},
	onWindowScaleChange: (callback: (scale: number) => void) => {
		const subscription = (_event: unknown, scale: number) => {
			callback(scale);
		};
		ipcRenderer.on(ipcChannel.WINDOW_SCALE_CHANNEL, subscription);
		return () => {
			ipcRenderer.removeListener(ipcChannel.WINDOW_SCALE_CHANNEL, subscription);
		}
	},
	settings: {
		load: () => ipcRenderer.invoke(ipcChannel.SETTINGS_LOAD_CHANNEL) as Promise<AppSettings>,
		save: (settings: AppSettings) => ipcRenderer.invoke(ipcChannel.SETTINGS_SAVE_CHANNEL, settings) as Promise<AppSettings>,
		getPath: () => ipcRenderer.invoke(ipcChannel.SETTINGS_PATH_CHANNEL) as Promise<string>
	}
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
