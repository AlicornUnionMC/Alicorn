import {
  ArtifactMeta,
  AssetIndexArtifactMeta,
  LibraryMeta,
  OptionalArgument,
} from "./Meta";
import { isNull } from "./InheritedProfileAdaptor";
import path from "path";

export class GameProfile {
  gameArgs: string[] = [];
  jvmArgs: OptionalArgument[] = [];
  assetIndex = AssetIndexArtifactMeta.emptyAssetIndexArtifactMeta();
  clientArtifact = ArtifactMeta.emptyArtifactMeta();
  // The 'path' property in 'client' and 'server' will be reassigned before downloading
  id = "";
  libraries: LibraryMeta[] = [];
  logArg = "";
  logFile = ArtifactMeta.emptyArtifactMeta();
  mainClass = "";
  releaseTime = new Date();
  time = new Date();
  type: ReleaseType = ReleaseType.RELEASE;

  // Also 'fromObject'
  constructor(obj: Record<string, unknown>) {
    try {
      this.id = String(obj["id"]);
      switch (obj["type"]) {
        case "release":
          this.type = ReleaseType.RELEASE;
          break;
        case "snapshot":
          this.type = ReleaseType.SNAPSHOT;
          break;
        default:
          this.type = ReleaseType.MODIFIED;
      }
      if (!isNull(obj["releaseTime"])) {
        this.releaseTime = new Date(String(obj["releaseTime"]));
      }
      if (!isNull(obj["time"])) {
        this.time = new Date(String(obj["time"]));
      }
      this.mainClass = String(obj["mainClass"]);
      const tLogArg = safeGet(obj, ["logging", "client", "argument"]);
      if (!isNull(tLogArg)) {
        this.logArg = String(tLogArg);
      }
      const tLogObj = safeGet(obj, ["logging", "client", "file"]) as Record<
        string,
        unknown
      >;

      if (!isNull(tLogObj)) {
        this.logFile = ArtifactMeta.fromObject(tLogObj);
      }
      const rawArgsGame = safeGet(obj, ["arguments", "game"]);
      if (rawArgsGame instanceof Array) {
        const actArgsGame = [];
        for (const r of rawArgsGame) {
          if (typeof r === "string") {
            actArgsGame.push(r);
          }
        }
        this.gameArgs = actArgsGame;
      }

      const rawArgsJ = safeGet(obj, ["arguments", "jvm"]);
      if (rawArgsJ instanceof Array) {
        const actArgsJ = [];
        for (const r of rawArgsJ) {
          if (typeof r === "string") {
            actArgsJ.push(OptionalArgument.fromString(r));
          } else {
            actArgsJ.push(
              OptionalArgument.fromObject(r as Record<string, unknown>)
            );
          }
        }
        this.jvmArgs = actArgsJ;
      }

      const asIndex = obj["assetIndex"];
      if (!isNull(asIndex)) {
        this.assetIndex = AssetIndexArtifactMeta.fromObject(asIndex);
      }

      const tClientObj = safeGet(obj, ["downloads", "client"]);
      if (!isNull(tClientObj)) {
        this.clientArtifact = ArtifactMeta.fromObject(
          Object.assign(tClientObj, {
            path: path.join(this.id, this.id + ".jar"),
            // Relative to %ROOT%/versions/
          })
        );
      }

      const allLibraries = obj["libraries"];
      if (allLibraries instanceof Array) {
        for (const l of allLibraries) {
          this.libraries.push(LibraryMeta.fromObject(l));
        }
      }
    } catch (e) {
      throw new Error("Invalid profile! Caused by: " + e);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function safeGet(obj: any, properties: string[]): unknown {
  try {
    let node = obj;
    for (const x of properties) {
      node = node[x];
    }
    return node;
  } catch {
    return null;
  }
}

enum ReleaseType {
  RELEASE = "release",
  SNAPSHOT = "snapshot",
  MODIFIED = "modified", // Nonofficial profiles
}

export { ReleaseType };
