import { ipcMain } from "electron";
import WebSocket from "ws";
import { getMainWindow } from "./Bootstrap";

let WS_SERVER: WebSocket.Server;
const conns = 0;
export function initWS(): void {
  WS_SERVER = new WebSocket.Server({ port: 16814 });
  WS_SERVER.on("connection", (ws) => {
    console.log("OPENED: Alicorn <============> Starlight");
    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());
      getMainWindow()?.webContents.send(
        data.channel + "_A_MAIN",
        data.eid,
        data.args || []
      );
      ipcMain.once(data.channel + "_A_MAIN" + data.eid, (_e, result) => {
        ws.send(
          JSON.stringify({
            eid: data.eid,
            value: result,
          })
        );
      });
    });
    ws.on("close", () => {
      console.log("CLOSED: Alicorn <            > Starlight");
    });
  });
}
