import os from "os";

export const ALICORN_VERSION_TYPE = "Alicorn";
export const MOJANG_USER_TYPE = "mojang";
export const LAUNCHER_NAME = "Alicorn";
export const LAUNCHER_VERSION = "Rainbow";
export const VERSIONS_ROOT = "versions";
export const FILE_SEPARATOR = os.platform() === "win32" ? ";" : ":";
export const SPACE = " ";
export const ALICORN_SEPARATOR = "\u2764\u2764";
export const PROCESS_END_GATE = "END";
export const PROCESS_LOG_GATE = "LOG";
// Stands for 'Alicorn Data'
export const ALICORN_DATA_SUFFIX = ".ald";
// Stands for 'Alicorn Pinkie Promise'
export const ALICORN_ENCRYPTED_DATA_SUFFIX = ".alpp";

export const MOJANG_VERSIONS_MANIFEST =
  "https://launchermeta.mojang.com/mc/game/version_manifest.json";

export const FORGE_MAVEN_ROOT = "https://files.minecraftforge.net/maven";
export const FORGE_VERSIONS_MANIFEST = `${FORGE_MAVEN_ROOT}/net/minecraftforge/forge/promotions_slim.json`;

enum ReleaseType {
  RELEASE = "release",
  SNAPSHOT = "snapshot",
  OLD_ALPHA = "old_alpha",
  OLG_BETA = "old_beta",
  MODIFIED = "modified", // Nonofficial profiles
}

export { ReleaseType };

export const PLACE_HOLDER = "?PLACE-HOLDER>>";
