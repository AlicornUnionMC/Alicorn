import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import fs from "fs-extra";
import path from "path";

export async function scanCoresIn(c: MinecraftContainer): Promise<string[]> {
  const cRoot = c.getVersionBase();
  try {
    const allV = await fs.readdir(cRoot);
    const tArr: string[] = [];
    await Promise.all(
      allV.map((v) => {
        return new Promise<void>((resolve) => {
          isValidCore(path.join(cRoot, v)).then((i) => {
            if (i) {
              tArr.push(v);
            }
            resolve();
          });
        });
      })
    );
    return tArr;
  } catch (e) {
    throw new Error("Cannot read container. Caused by: " + e);
  }
}

async function isValidCore(profileRoot: string): Promise<boolean> {
  try {
    const v = path.basename(profileRoot);
    const expectedProfile = path.join(profileRoot, v + ".json");
    await fs.readJSON(expectedProfile);
    return true;
  } catch {
    return false;
  }
}
