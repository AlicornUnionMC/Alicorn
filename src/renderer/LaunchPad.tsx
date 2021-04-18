import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  createStyles,
  IconButton,
  LinearProgress,
  makeStyles,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { whatProfile } from "../modules/profile/WhatProfile";
import { tr } from "./Translator";
import objectHash from "object-hash";
import { Info, Sync } from "@material-ui/icons";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";

let cachedAllCores: SimplifiedCoreInfo[] = [];
let coresCacheBit = false;

interface SimplifiedCoreInfo {
  location: string;
  container: string;
  id: string;
  corrupted: boolean;
  versionType: string;
  baseVersion: string;
}

const usePadStyles = makeStyles((theme) =>
  createStyles({
    para: {
      flexGrow: 1,
      marginTop: theme.spacing(4),
      color: theme.palette.primary.main,
      marginLeft: "16%",
    },
  })
);

export function LaunchPad(): JSX.Element {
  const classes = usePadStyles();

  return (
    <Box className={classes.para}>
      <CoresDisplay />
    </Box>
  );
}

function CoresDisplay(): JSX.Element {
  const [cores, setCores] = useState([] as SimplifiedCoreInfo[]);
  const [isLoading, setLoading] = useState(true);
  const [refreshBit, setRefresh] = useState(true);
  useEffect(() => {
    if (!coresCacheBit) {
      setLoading(true);
      cachedAllCores = [];
      coresCacheBit = true;
      (async () => {
        const rMap = await scanCoresInAllMountedContainers(true);
        for (const [c, ids] of rMap.entries()) {
          for (const id of ids) {
            try {
              const p = await loadProfile(id, c);
              cachedAllCores.push({
                id: p.id,
                baseVersion: p.baseVersion,
                location: c.id + "/" + id,
                versionType: whatProfile(id),
                corrupted: false,
                container: c.id,
              });
            } catch {
              cachedAllCores.push({
                id: id,
                corrupted: true,
                location: c.id + "/" + id,
                versionType: "???????",
                baseVersion: "???????",
                container: c.id,
              });
            }
          }
        }
        setCores(cachedAllCores);
        setLoading(false);
      })();
    }
  });

  return (
    <Box>
      <Box style={{ textAlign: "right", marginRight: "18%" }}>
        <Tooltip title={tr("CoreInfo.Reload")}>
          <IconButton
            color={"inherit"}
            onClick={() => {
              setDirty();
              setRefresh(!refreshBit);
            }}
          >
            <Sync />
          </IconButton>
        </Tooltip>
      </Box>

      <LinearProgress
        color={"secondary"}
        style={Object.assign(
          { width: "80%" },
          isLoading ? {} : { display: "none" }
        )}
      />
      {}
      <br />
      {cores.map((c) => {
        return <SingleCoreDisplay key={objectHash(c)} profile={c} />;
      })}
    </Box>
  );
}

const useCardStyles = makeStyles((theme) =>
  createStyles({
    text: {
      fontSize: "medium",
    },
    desc: {
      fontSize: "small",
    },
    card: {
      backgroundColor: theme.palette.primary.main,
      width: "80%",
    },
    operateButton: {
      float: "right",
    },
  })
);

function SingleCoreDisplay(props: {
  profile: SimplifiedCoreInfo;
}): JSX.Element {
  const classes = useCardStyles();
  return (
    <Box>
      <Card className={classes.card}>
        <CardContent>
          {props.profile.corrupted ? (
            {}
          ) : (
            <Tooltip title={tr("CoreInfo.Detail")}>
              <IconButton
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  jumpTo(
                    "/CoreDetail/" +
                      props.profile.container +
                      "/" +
                      props.profile.id
                  );
                  triggerSetPage(Pages.CoreDetail);
                }}
              >
                <Info />
              </IconButton>
            </Tooltip>
          )}

          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {props.profile.versionType}
          </Typography>
          <Typography variant={"h6"} gutterBottom>
            {props.profile.baseVersion}
          </Typography>
          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {props.profile.id}
          </Typography>
          {props.profile.corrupted ? (
            <CorruptedCoreWarning />
          ) : (
            <Typography className={classes.desc} color={"textSecondary"}>
              {getDescriptionFor(props.profile.versionType)}
            </Typography>
          )}
        </CardContent>
      </Card>
      <br />
    </Box>
  );
}

function getDescriptionFor(type: string): string {
  switch (type.toUpperCase()) {
    case "MOJANG":
      return tr("CoreInfo.Introduction.Minecraft");
    case "FABRIC":
      return tr("CoreInfo.Introduction.Fabric");
    case "FORGE":
      return tr("CoreInfo.Introduction.Forge");
    default:
      return tr("CoreInfo.Introduction.Universal");
  }
}

function CorruptedCoreWarning(): JSX.Element {
  return (
    <Box>
      <Typography style={{ fontSize: "small", color: "#ff8400" }} gutterBottom>
        {tr("CoreInfo.CorruptedWarning")}
      </Typography>
    </Box>
  );
}

export function setDirty(): void {
  coresCacheBit = false;
}
