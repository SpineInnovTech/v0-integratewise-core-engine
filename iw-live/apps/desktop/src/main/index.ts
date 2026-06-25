/**
 * Electron Main Process
 */
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import Store from "electron-store";

// Initialize secure storage
const store = new Store({
  name: "integratewise-auth",
  encryptionKey: "integratewise-desktop-v1", // In production, use a proper key
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#FFFFFF",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the web app (dev: local web; prod: deployed app)
  const appUrl = process.env.MAIN_VITE_APP_URL || "https://app.integratewise.ai";
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(appUrl);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC handlers for secure storage
ipcMain.handle("storage:get", async (_event, key: string) => {
  return store.get(key) ?? null;
});

ipcMain.handle("storage:set", async (_event, key: string, value: string) => {
  store.set(key, value);
});

ipcMain.handle("storage:remove", async (_event, key: string) => {
  store.delete(key);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
