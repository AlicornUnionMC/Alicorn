import { app, BrowserWindow } from "electron";
import os from "os";
import { btoa } from "js-base64";
import { registerBackgroundListeners } from "./Background";

console.log("Starting Alicorn!");
let mainWindow: BrowserWindow | null = null;
app.on("ready", async () => {
  console.log("App is ready, preparing window...");
  // Open window as soon as possible
  mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
    show: false,
  });
  mainWindow.setMenu(null);
  console.log("Loading resources...");
  mainWindow.once("ready-to-show", async () => {
    console.log("Creating window!");
    mainWindow?.show();
    console.log("Registering event listeners...");
    registerBackgroundListeners();
    console.log("All caught up! Alicorn is now initialized.");
  });
  await mainWindow.loadFile("Renderer.html");
});

app.on("window-all-closed", () => {
  if (os.platform() !== "darwin") {
    console.log("Stopping!");
    app.quit();
  }
});
// This function doesn't support async!
// Use sync functions.
app.on("will-quit", () => {
  console.log("Finalizing and exiting...");
});

process.on("uncaughtException", async (e) => {
  console.log(e);
  await mainWindow?.webContents.loadFile("Error.html", {
    hash: btoa(escape(String(e.message))),
  });
});

process.on("unhandledRejection", async (r) => {
  console.log(String(r));
  await mainWindow?.webContents.loadFile("Error.html", {
    hash: btoa(escape(String(r))),
  });
});

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
