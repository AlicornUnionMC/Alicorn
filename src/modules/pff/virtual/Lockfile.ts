import { readFile, writeFile } from "fs-extra";
import { uniqueHash } from "../../commons/BasicHash";
import { isFileExist } from "../../commons/FileUtil";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { ModArtifact, ModMeta } from "./ModDefine";

export type LockfileModMeta = ModMeta & {
  selectedArtifact: ModArtifact;
  insallDate: number;
};
export type Lockfile2 = Record<string, LockfileModMeta>;

export async function loadLockfile(
  container: MinecraftContainer
): Promise<Lockfile2> {
  try {
    const lockPath = container.getPff2LockFile();
    if (await isFileExist(lockPath)) {
      const f = await readFile(lockPath);
      try {
        return JSON.parse(f.toString());
      } catch {
        await writeFile(lockPath, "{}");
        return {};
      }
    } else {
      await writeFile(lockPath, "{}");
      return {};
    }
  } catch {
    return {};
  }
}

export async function fixLockfile(
  lockfile: Lockfile2,
  container: MinecraftContainer
): Promise<void> {
  await Promise.allSettled(
    Object.keys(lockfile).map(async (name) => {
      if (
        !(await isFileExist(
          container.getModJar(lockfile[name].selectedArtifact.fileName)
        ))
      ) {
        delete lockfile[name];
      }
    })
  );
}

export async function saveLockfile(
  lockfile: Lockfile2,
  container: MinecraftContainer
): Promise<void> {
  try {
    await writeFile(
      container.getPff2LockFile(),
      JSON.stringify(lockfile, null, 2)
    );
  } catch {}
}

export function addToLockfile(
  lockfile: Lockfile2,
  meta: ModMeta,
  artifact: ModArtifact
): void {
  const hsh = uniqueHash(meta.id) + "/" + uniqueHash(artifact.id);
  lockfile[hsh] = {
    ...meta,
    selectedArtifact: artifact,
    insallDate: new Date().getTime(),
  };
}
