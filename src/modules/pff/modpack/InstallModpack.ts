import { zip } from "compressing";
import fs, { copy, readJSON } from "fs-extra";
import path from "path";
import { tr } from "../../../renderer/Translator";
import { basicHash } from "../../commons/BasicHash";
import { Pair } from "../../commons/Collections";
import { isNull, safeGet } from "../../commons/Null";
import { getNumber, getString } from "../../config/ConfigSupport";
import { DATA_ROOT } from "../../config/DataSupport";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { addDoing } from "../../download/DownloadWrapper";
import { getJavaRunnable, getLastUsedJavaHome } from "../../java/JInfo";
import { ProfileType } from "../../profile/WhatProfile";
import {
  lookupAddonInfo,
  lookupFileInfo,
  requireFile
} from "../curseforge/Get";
import {
  loadLockFile,
  Lockfile,
  saveLockFile,
  writeToLockFile
} from "../curseforge/Lockfile";
import { CF_API_BASE_URL } from "../curseforge/Values";
import { setPffFlag } from "../curseforge/Wrapper";
import {
  getFabricInstaller,
  getLatestFabricInstallerAndLoader,
  removeFabricInstaller
} from "../get/FabricGet";
import {
  generateForgeInstallerName,
  getForgeInstaller,
  removeForgeInstaller
} from "../get/ForgeGet";
import { downloadProfile, getProfileURLById } from "../get/MojangCore";
import { performFabricInstall } from "../install/FabricInstall";
import { performForgeInstall } from "../install/ForgeInstall";
import { ModpackModel, SimpleFile, transformManifest5 } from "./CFModpackModel";
import {
  CommonModpackModel,
  deployAllGameProfiles,
  deployAllModLoaders,
  generateBaseVersion,
  generateDefaultModLoader,
  OverrideFile
} from "./CommonModpackModel";
const MANIFEST_FILE = "manifest.json";

async function parseModpack(
  container: MinecraftContainer,
  source: string
): Promise<Pair<"CF" | "CM", ModpackModel | CommonModpackModel | null>> {
  const sourceHash = basicHash(path.basename(source));
  const baseDir = container.getTempFileStorePath(path.join(sourceHash));
  try {
    await zip.uncompress(source, baseDir);
  } catch (e) {
    console.log(e);
    return new Pair("CF", null);
  }
  const mf = path.join(baseDir, MANIFEST_FILE);
  try {
    const f = await readJSON(mf);
    if (safeGet(f, ["manifestVersion"]) === 1) {
      f["overrideSourceDir"] = path.join(baseDir, OVERRIDE_CONTENT);
      return new Pair("CM", f as CommonModpackModel);
    }
    if (
      safeGet(f, ["manifestVersion"]) === 5 ||
      safeGet(f, ["manifestVersion"]) === undefined
    ) {
      return new Pair("CF", transformManifest5(f, baseDir));
    }
    throw "Unsupported manifest version: " + safeGet(f, ["manifestVersion"]);
  } catch (e) {
    console.log(e);
    return new Pair("CF", null);
  }
}

async function removeTempFiles(
  container: MinecraftContainer,
  source: string
): Promise<void> {
  try {
    await fs.remove(
      container.getTempFileStorePath(basicHash(path.basename(source)))
    );
  } catch {}
}

async function deployOverrides(
  overridesRoot: string,
  target: string
): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(target));
    await copy(overridesRoot, target);
  } catch {}
}

const OVERRIDE_CONTENT = "overrides";
// FIXME: Unchecked
async function deployFileOverrides(
  o: OverrideFile[] | SimpleFile[],
  unpackRoot: string,
  container: MinecraftContainer
): Promise<void> {
  await Promise.allSettled(
    o.map(async (f) => {
      // @ts-ignore
      if (!f["projectID"]) {
        f = f as OverrideFile;
        const target = container.resolvePath(f.path);
        await fs.ensureDir(path.dirname(target));
        await fs.copyFile(path.join(unpackRoot, f.path), target);
      }
    })
  );
}

export async function deployProfile(
  bv: string,
  container: MinecraftContainer
): Promise<void> {
  // Null safe
  if (bv.trim().length === 0) {
    return;
  }
  const u = await getProfileURLById(bv);
  if (u.length > 0) {
    await downloadProfile(u, container, bv);
  }
}

export async function deployModLoader(
  type: ProfileType,
  version: string,
  mcVersion: string,
  container: MinecraftContainer
): Promise<void> {
  switch (type) {
    case ProfileType.FORGE:
      if (!(await getForgeInstaller(container, mcVersion, version))) {
        throw "Could not fetch installer: No such installer!";
      }
      if (
        !(await performForgeInstall(
          await getJavaRunnable(getLastUsedJavaHome()),
          generateForgeInstallerName(mcVersion, version),
          container
        ))
      ) {
        throw "Could not perform install!";
      }
      await removeForgeInstaller(container, mcVersion, version);
      break;
    case ProfileType.FABRIC:
    default: {
      const u = (await getLatestFabricInstallerAndLoader()).getFirstValue();
      if (isNull(u)) {
        throw "Could not fetch installer: No such installer!";
      }
      if (!(await getFabricInstaller(u, container))) {
        throw "Failed to fetch installer!";
      }
      if (
        !(await performFabricInstall(
          await getJavaRunnable(getLastUsedJavaHome()),
          u,
          version,
          mcVersion,
          container
        ))
      ) {
        throw "Could not perform install!";
      }
      await removeFabricInstaller(u, container);
    }
  }
}

async function installMods(
  container: MinecraftContainer,
  model: ModpackModel | CommonModpackModel
): Promise<void> {
  setPffFlag("1");
  const lockfile = await loadLockFile(container);
  let apiBase = getString("pff.api-base", CF_API_BASE_URL);
  apiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cacheRoot = getString("pff.cache-root", "");
  const timeout = getNumber("download.concurrent.timeout");
  await Promise.all(
    model.files.map((m) => {
      // We only deal with CurseForge Mods as specified
      // @ts-ignore
      if (m["projectID"]) {
        m = m as SimpleFile;
        return installSingleMod(
          m.projectID,
          m.fileID,
          container,
          cacheRoot,
          apiBase,
          timeout,
          lockfile,
          generateBaseVersion(model),
          profileType2Number(generateDefaultModLoader(model)) // Considering most modepacks uses Forge, this is for our USERS, not for such FORGE!
        );
      }
    })
  );
  await saveLockFile(lockfile, container);
  setPffFlag("0");
}

async function installSingleMod(
  aid: number,
  fid: number,
  container: MinecraftContainer,
  cacheRoot: string,
  apiBase: string,
  timeout: number,
  lockfile: Lockfile,
  gameVersion: string,
  modLoader: number
): Promise<void> {
  addDoing(tr("PffFront.Query", `Slug=${aid}`));
  const addon = await lookupAddonInfo(aid, apiBase, timeout);
  if (!addon) {
    throw tr("PffFront.NoSuchAddon");
  }
  addDoing(tr("PffFront.LookingUpFile", `File=${fid}`));
  const file = await lookupFileInfo(addon, fid, apiBase, timeout);
  if (!file) {
    throw tr("PffFront.NoSuchFile");
  }
  addDoing(tr("PffFront.Downloading", `Url=${file.downloadUrl}`));
  if (await requireFile(file, addon, cacheRoot, container)) {
    writeToLockFile(addon, file, lockfile, gameVersion, modLoader);
  } else {
    throw tr("PffFront.Failed", `Url=${file.downloadUrl}`);
  }
}

function profileType2Number(pType: ProfileType): number {
  switch (pType) {
    case ProfileType.FORGE:
      return 1;
    case ProfileType.FABRIC:
    default:
      return 4;
  }
}

export async function wrappedInstallModpack(
  container: MinecraftContainer,
  source: string
): Promise<void> {
  addDoing(tr("ContainerManager.ParsingModpack"));
  const o = await parseModpack(container, source);
  let model = o.getSecondValue();
  if (!model) {
    throw "Could not parse this modpack!";
  }
  addDoing(tr("ContainerManager.DeployingProfile"));
  switch (o.getFirstValue()) {
    case "CM":
      {
        model = model as CommonModpackModel;
        const bv = generateBaseVersion(model);
        await deployAllGameProfiles(model, container);
        addDoing(tr("ContainerManager.DeployingModLoader"));
        await deployAllModLoaders(model, container, bv);
        addDoing(tr("ContainerManager.DeployingMods"));
        await installMods(container, model);
        addDoing(tr("ContainerManager.DeployingDeltas"));
        await deployFileOverrides(
          model.files,
          model.overrideSourceDir,
          container
        );
        addDoing(tr("ContainerManager.CleaningUp"));
        await removeTempFiles(container, source);
      }
      break;
    case "CF":
    default:
      model = model as ModpackModel;
      await deployProfile(model.baseVersion, container);
      if (model.modLoaders.length > 0) {
        addDoing(tr("ContainerManager.DeployingModLoader"));
        await deployModLoader(
          model.modLoaders[0].type || ProfileType.FORGE,
          model.modLoaders[0].version || "",
          model.baseVersion,
          container
        );
      }
      addDoing(tr("ContainerManager.DeployingMods"));
      await installMods(container, model);
      addDoing(tr("ContainerManager.DeployingDeltas"));
      await deployOverrides(model.overrideSourceDir, container.rootDir);
      addDoing(tr("ContainerManager.CleaningUp"));
      await removeTempFiles(container, source);
    // TODO
  }
}
