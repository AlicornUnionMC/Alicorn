import { Trio } from "../commons/Collections";
import got from "got";
import { isNull, safeGet } from "../commons/Null";
import { getUniqueID32 } from "../security/Encrypt";

export abstract class Account {
  protected constructor(accountName: string) {
    this.lastUsedUsername = "";
    this.accountName = accountName;
    this.lastUsedUUID = "";
    this.lastUsedAccessToken = "";
    this.avatarURL = "";
  }

  abstract requireUserOperation(): Promise<boolean>;

  abstract isAccessTokenValid(): Promise<boolean>;

  abstract flushToken(): Promise<boolean>;

  abstract buildAccessData(): Promise<Trio<string, string, string>>;

  // AccessData(or AuthData) is a Trio
  // Username, AccessToken, UUID

  abstract getAccountIdentifier(): string;

  abstract serialize(): string;

  lastUsedUsername: string;
  lastUsedUUID: string;
  lastUsedAccessToken: string;
  avatarURL: string;
  accountName: string;
}

export async function refreshToken(
  acToken: string,
  authServer: string,
  selectedProfile?: RemoteUserProfile
): Promise<AuthenticateDataCallback> {
  try {
    const rtt = (
      await got.post(trimURL(authServer) + "/refresh", {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "json",
        body: JSON.stringify(
          Object.assign(
            {
              accessToken: acToken,
            },
            selectedProfile ? { selectedProfile } : {}
          )
        ),
      })
    ).body;

    const tk = String(safeGet(rtt, ["accessToken"], acToken));
    const sp = safeGet(rtt, ["selectedProfile"]);
    const all = safeGet(rtt, ["availableProfiles"]);
    const ava = [];
    if (all instanceof Array) {
      for (const a of all) {
        if (!isNull(a)) {
          ava.push(toUserProfile(a));
        }
      }
    }
    return {
      success: true,
      availableProfiles: ava,
      selectedProfile: isNull(sp) ? selectedProfile : toUserProfile(sp),
      accessToken: tk,
    };
  } catch {
    return { success: false, accessToken: "", availableProfiles: [] };
  }
}

export async function authenticate(
  accountName: string,
  password: string,
  authServer: string
): Promise<AuthenticateDataCallback> {
  try {
    const tURL = trimURL(authServer) + "/authenticate";
    const res = (
      await got.post(tURL, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accountName,
          password: password,
          clientToken: getUniqueID32(),
          agent: {
            name: "Minecraft",
            version: 1,
          },
        }),
      })
    ).body;
    let selectedProfile: RemoteUserProfile | undefined = undefined;
    const sObj = safeGet(res, ["selectedProfile"], null);
    if (!isNull(sObj)) {
      selectedProfile = toUserProfile(sObj);
    }

    const availableProfiles: RemoteUserProfile[] = [];
    const aList = safeGet(res, ["availableProfiles"], null);
    if (aList instanceof Array) {
      for (const x of aList) {
        if (!isNull(x)) {
          availableProfiles.push(toUserProfile(x));
        }
      }
    }
    const accessToken = String(safeGet(res, ["accessToken"], "") || "");
    return {
      availableProfiles,
      selectedProfile,
      accessToken,
      success: true,
    };
  } catch {
    return {
      success: false,
      accessToken: "",
      availableProfiles: [],
    };
  }
}

function trimURL(url: string): string {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

export async function validateToken(
  acToken: string,
  authServer: string
): Promise<boolean> {
  try {
    await got.post(trimURL(authServer) + "/validate", {
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "json",
      body: JSON.stringify({
        accessToken: acToken,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

interface AuthenticateDataCallback {
  success: boolean;
  accessToken: string;
  availableProfiles: RemoteUserProfile[];
  selectedProfile?: RemoteUserProfile;
}

export interface RemoteUserProfile {
  id: string;
  name: string;
}

function toUserProfile(obj: unknown): RemoteUserProfile {
  const id = String(safeGet(obj, ["id"], ""));
  const name = String(safeGet(obj, ["name"], ""));
  return { id, name };
}
