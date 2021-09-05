import fs from "fs-extra";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import { schedulePromiseTask } from "../../renderer/Schedule";
import { isFileExist } from "../commons/FileUtil";
import { getBoolean } from "../config/ConfigSupport";
import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import { getConfigOptn } from "./DownloadWrapper";
import { getFileWriteStream, getTimeoutController } from "./RainbowFetch";
import { addRecord } from "./ResolveLock";
import { getHash, getIdentifier, validate } from "./Validate";

const pipeline = promisify(stream.pipeline);

export class Serial extends AbstractDownloader {
  private static instance = new Serial();

  static getInstance(): Serial {
    return Serial.instance;
  }

  async downloadFile(
    meta: DownloadMeta,
    noTimeout?: boolean
  ): Promise<DownloadStatus> {
    try {
      // If file already exists then check if HASH matches
      if (meta.sha1 !== "" && (await isFileExist(meta.savePath))) {
        if (await validate(meta.savePath, meta.sha1)) {
          return DownloadStatus.RESOLVED;
        }
      }
      // Ensure directory
      await fs.ensureDir(path.dirname(meta.savePath));
      const [ac, sti] = getTimeoutController(
        noTimeout ? 0 : getConfigOptn("timeout", 3000)
      );
      const r = await fetch(meta.url, {
        method: "GET",
        signal: ac.signal,
        keepalive: true,
      });
      sti();
      const f = getFileWriteStream(meta.savePath);
      if (r.body) {
        await r.body.pipeTo(f);
      } else {
        throw "Body is empty!";
      }
      if (meta.sha1 === "" || getBoolean("download.skip-validate")) {
        void (async (meta) => {
          const id = await schedulePromiseTask(() => {
            return getIdentifier(meta.savePath);
          });
          if (id.length > 0) {
            addRecord(id, meta.url);
          }
        })(meta); // 'Drop' this promise
        return DownloadStatus.RESOLVED;
      }
      const h = await getHash(meta.savePath);
      if (meta.sha1 === h) {
        // No error is ok, add record
        void (async (meta) => {
          const id = await schedulePromiseTask(() => {
            return getIdentifier(meta.savePath);
          });
          if (id.length > 0) {
            addRecord(id, meta.url);
          }
        })(meta); // 'Drop' this promise
        return DownloadStatus.RESOLVED;
      }

      // Mismatch
      return DownloadStatus.RETRY;
    } catch (e) {
      console.log(e);
      // Oops
      return DownloadStatus.RETRY;
    }
  }
}
