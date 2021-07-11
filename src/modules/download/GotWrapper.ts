import got from "got";
import { applyMirror } from "./Mirror";
import { getNumber } from "../config/ConfigSupport";

export async function xgot(
  url: string,
  noMirror = false,
  noCache = false
): Promise<unknown> {
  if (noMirror) {
    try {
      return (
        await got.get(url, {
          responseType: "json",
          timeout: getNumber("download.concurrent.timeout", 5000),
          https: {
            rejectUnauthorized: false,
          },
        })
      ).body;
    } catch (e) {
      console.log(e);
      return {};
    }
  }
  try {
    return (
      await got.get(applyMirror(url), {
        responseType: "json",
        timeout: getNumber("download.concurrent.timeout", 5000),
        https: {
          rejectUnauthorized: false,
        },
      })
    ).body;
  } catch (e) {
    console.log(e);
    try {
      return (
        await got.get(url, {
          cache: noCache ? false : undefined,
          responseType: "json",
          timeout: getNumber("download.concurrent.timeout", 5000),
          https: {
            rejectUnauthorized: false,
          },
        })
      ).body;
    } catch (e) {
      console.log(e);
      return {};
    }
  }
}

export async function pgot(url: string, timeout: number): Promise<unknown> {
  return (
    await got.get(url, {
      responseType: "json",
      timeout: timeout,
      https: {
        rejectUnauthorized: false,
      },
      // @ts-ignore
      // agent: getProxy(),
    })
  ).body;
}
