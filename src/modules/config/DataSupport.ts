import fs from "fs-extra";
import path from "path";
import os from "os";
import { copyFileStream, isFileExist } from "../commons/FileUtil";
import { getBasePath } from "./PathSolve";

const DATA_ROOT = path.resolve(os.homedir(), "alicorn");
const DEFAULTS_ROOT = path.resolve(getBasePath(), "defaults");

export async function loadData(dataPath: string): Promise<string> {
  try {
    return (await fs.readFile(getActualDataPath(dataPath))).toString();
  } catch {
    return "";
  }
}

export function getPathInDefaults(pt: string): string {
  return path.resolve(path.join(DEFAULTS_ROOT, pt));
}

export function getActualDataPath(pt: string): string {
  return path.resolve(path.join(DATA_ROOT, pt));
}

export async function saveData(
  relativePath: string,
  data: string
): Promise<void> {
  const dest = getActualDataPath(relativePath);
  await fs.ensureDir(path.dirname(dest));
  await fs.writeFile(dest, data);
}

export function saveDataSync(relativePath: string, data: string): void {
  const dest = getActualDataPath(relativePath);
  fs.ensureDirSync(path.dirname(dest));
  fs.writeFileSync(dest, data);
}

// Hint: NEVER use 'fs.copyFile'!
// 'No permission', I don't know why, but we have to do this manually

export async function saveDefaultData(dfPath: string): Promise<void> {
  const dest = getActualDataPath(dfPath);
  if (await isFileExist(dest)) {
    return;
  }
  await copyFileStream(path.join(DEFAULTS_ROOT, dfPath), dest);
}
