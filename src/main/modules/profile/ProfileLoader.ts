import { MinecraftContainer } from "../container/MinecraftContainer";
import { GameProfile } from "./GameProfile";
import fs from "fs-extra";
import { isLegacy, ProfileType, whatProfile } from "./WhatProfile";
import { convertFromFabric } from "./FabricProfileAdaptor";
import { convertFromLegacy } from "./LegacyProfileAdaptor";
import { InheritedProfile } from "./InheritedProfileAdaptor";

export async function loadProfileDirectly(
  id: string,
  container: MinecraftContainer
): Promise<GameProfile> {
  try {
    return new GameProfile(await fs.readJSON(container.getProfilePath(id)));
  } catch (e) {
    throw new Error("Cannot load profile! Caused by: " + e);
  }
}

export async function loadProfile(
  id: string,
  container: MinecraftContainer
): Promise<GameProfile> {
  let jsonObj = await fs.readJSON(container.getProfilePath(id));
  const vType = whatProfile(jsonObj);
  let legacyBit = false;
  if (isLegacy(jsonObj)) {
    legacyBit = true;
    jsonObj = convertFromLegacy(jsonObj);
  }
  if (vType === ProfileType.MOJANG) {
    return new GameProfile(jsonObj);
  }
  if (vType === ProfileType.FABRIC) {
    jsonObj = convertFromFabric(jsonObj);
  }
  return new InheritedProfile(jsonObj).produceInherited(container, legacyBit);
}
