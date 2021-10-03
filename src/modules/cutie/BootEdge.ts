import { remove } from "fs-extra";
import os from "os";
import sudo from "sudo-prompt";
import { uniqueHash } from "../commons/BasicHash";
import { isFileExist } from "../commons/FileUtil";
import { getActualDataPath, saveDefaultDataAs } from "../config/DataSupport";

/*
CLAIM FOR EXTERNAL RESOURCE

This modules (BootEdge.ts) uses N2N Edge (edge-win.ald and edge-gnu.ald), which is ntop's work.
N2N Edge is licensed under the GNU GENERAL PUBLIC LICENSE 3.0 (aka. GPL-3.0) and it's a free software (free as in freedom).
It's license is compatible with ours, since we use GPL-3.0 too.
For details, please see https://github.com/ntop/n2n/blob/dev/LICENSE

A copy of edge-win.ald and edge-gnu.ald will be saved to the root dir of alicorn data.
*/
const INTERNET = "internet";
export async function prepareEdgeExecutable(): Promise<void> {
  await saveDefaultDataAs(getEdgeName(), getEdgeTargetName());
}

export function getEdgeName(): string {
  if (os.platform() === "win32") {
    return "edge-win.ald";
  } else {
    return "edge-gnu.ald";
  }
}

export function getEdgeTargetName(): string {
  if (os.platform() === "win32") {
    return "edge.exe";
  } else {
    return "edge";
  }
}

const EDGE_LOCK_FILE = "proc.lock";
export function generateEdgeArgs(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): string {
  const o = [
    "-c",
    community === INTERNET ? INTERNET : uniqueHash(community),
    "-l",
    supernode,
  ]
    .concat(ip.length > 0 ? ["-a", ip] : [])
    .concat(
      psw.length > 0 && community !== INTERNET ? ["-k", uniqueHash(psw)] : []
    ) // Beat command inject!
    .join(" ");
  return os.platform() === "win32"
    ? `tskill edge && echo 0 >> "${getActualDataPath(
        EDGE_LOCK_FILE
      )}" && start "CutieConnect N2N Edge" "${getActualDataPath(
        getEdgeTargetName()
      )}" ${o}`
    : `sh -c "pkill edge && echo 0 >> '${getActualDataPath(
        EDGE_LOCK_FILE
      )}' && '${getActualDataPath(getEdgeTargetName())}' -f ${o}"`;
}

function queryFile(f: string): Promise<void> {
  return new Promise<void>((res) => {
    const i = setInterval(async () => {
      if (await isFileExist(f)) {
        clearInterval(i);
        res();
        await remove(f);
      }
    }, 500);
  });
}

export async function runEdge(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): Promise<void> {
  const cmd = generateEdgeArgs(community, psw, ip, supernode);
  console.log("Starting edge with command line: " + cmd);

  sudo.exec(cmd, {
    name: "Alicorn Sudo Prompt Actions",
  });
  await queryFile(getActualDataPath(EDGE_LOCK_FILE));
}

export function killEdge(): Promise<void> {
  const cmd = os.platform() === "win32" ? "tskill edge" : "pkill edge";
  console.log("Terminating edge...");
  return new Promise<void>((res) => {
    sudo.exec(
      cmd,
      {
        name: "Alicorn Sudo Prompt Actions",
      },
      () => {
        res(); // This should work
      }
    );
  });
}
