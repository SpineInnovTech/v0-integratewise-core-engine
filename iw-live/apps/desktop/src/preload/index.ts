/**
 * Electron Preload Script
 *
 * Exposes secure storage API to the renderer process.
 */
import { contextBridge, ipcRenderer } from "electron";

// Expose secure storage to web app
contextBridge.exposeInMainWorld("electronAPI", {
  storage: {
    getItem: (key: string): Promise<string | null> => {
      return ipcRenderer.invoke("storage:get", key);
    },
    setItem: (key: string, value: string): Promise<void> => {
      return ipcRenderer.invoke("storage:set", key, value);
    },
    removeItem: (key: string): Promise<void> => {
      return ipcRenderer.invoke("storage:remove", key);
    },
  },
  platform: process.platform,
  version: process.versions.electron,
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI?: {
      storage: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
      };
      platform: string;
      version: string;
    };
  }
}
