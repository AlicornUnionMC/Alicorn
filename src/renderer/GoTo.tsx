import { setDirty } from "./LaunchPad";
import { setContainerListDirty } from "./ContainerManager";
import { saveAndReloadMain } from "../modules/config/ConfigSupport";

export function jumpTo(target: string): void {
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    window.dispatchEvent(new CustomEvent("changePageWarn", { detail: target }));
    return;
  }
  ifLeavingLaunchPadThenSetDirty();
  ifLeavingContainerManagerThenSetContainerListDirty();
  ifLeavingConfigThenReload();
  window.location.hash = target;
}

function ifLeavingLaunchPadThenSetDirty(): void {
  setDirty();
}

function ifLeavingContainerManagerThenSetContainerListDirty(): void {
  setContainerListDirty();
}

function ifLeavingConfigThenReload(): void {
  if (window.location.hash.includes("Options")) {
    saveAndReloadMain()
      .then(() => {})
      .catch(() => {});
  }
}

export function triggerSetPage(page: string): void {
  // @ts-ignore
  if (window[CHANGE_PAGE_WARN]) {
    return;
  }
  document.dispatchEvent(new CustomEvent("setPage", { detail: page }));
}

export enum Pages {
  CrashReportDisplay = "CrashReportDisplay",
  Options = "Options",
  ContainerManager = "ContainerManager",
  LaunchPad = "LaunchPad",
  ReadyToLaunch = "ReadyToLaunch",
  InstallCore = "InstallCore",
  AccountManager = "AccountManager",
  Version = "Version",
  JavaSelector = "JavaSelector",
  PffFront = "PffFront",
  Welcome = "Welcome",
}

export const CHANGE_PAGE_WARN = "ChangePageWarn";

export function setChangePageWarn(doWarn: boolean): void {
  // @ts-ignore
  window[CHANGE_PAGE_WARN] = doWarn;
}
