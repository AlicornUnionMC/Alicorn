import { getActualDataPath, saveDefaultData } from "../config/DataSupport";

export const NIDE8_NAME = "nide8auth.jar";

export async function prepareND(): Promise<void> {
  await saveDefaultData(NIDE8_NAME);
}

export function whereND(): string {
  return getActualDataPath(NIDE8_NAME);
}
