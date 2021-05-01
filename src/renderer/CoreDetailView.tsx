import {
  Box,
  Chip,
  createStyles,
  LinearProgress,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import { GameProfile } from "../modules/profile/GameProfile";
import { useParams } from "react-router";
import { loadProfile } from "../modules/profile/ProfileLoader";
import { getContainer } from "../modules/container/ContainerUtil";
import { ProfileType, whatProfile } from "../modules/profile/WhatProfile";
import { tr } from "./Translator";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { Cancel, CheckCircle } from "@material-ui/icons";
import { ReleaseType } from "../modules/commons/Constants";
import { getIconFor } from "../modules/profile/Icons";

const useStyles = makeStyles((theme) =>
  createStyles({
    text: {
      fontSize: "medium",
      flexGrow: 1,
      color: theme.palette.secondary.main,
    },
    root: {
      marginLeft: theme.spacing(4),
    },
    primaryText: {
      flexGrow: 1,
      color: theme.palette.primary.main,
    },
    icon: {
      float: "right",
      marginRight: theme.spacing(4),
    },
  })
);

export function CoreDetail(): JSX.Element {
  const [coreProfile, setProfile] = useState(new GameProfile({}));
  const [profileLoadedBit, setLoaded] = useState(0);
  // 0: Not loaded 1: OK 2: Error
  const { id, container } = useParams<{ id: string; container: string }>();
  const mounted = useRef<boolean>();
  useEffect(() => {
    mounted.current = true;
    if (!profileLoadedBit) {
      (async () => {
        try {
          if (mounted.current) {
            setProfile(await loadProfile(id, getContainer(container)));
            setLoaded(1);
          }
        } catch {
          if (mounted.current) {
            setLoaded(2);
          }
        }
      })();
    }
    return () => {
      mounted.current = false;
    };
  });
  return profileLoadedBit === 1 ? (
    <CoreDetailView profile={coreProfile} container={getContainer(container)} />
  ) : (
    <LinearProgress color={"secondary"} style={{ width: "80%" }} />
  );
}

function CoreDetailView(props: {
  profile: GameProfile;
  container: MinecraftContainer;
}): JSX.Element {
  const classes = useStyles();
  const type = whatProfile(props.profile.id);
  const modAble = [ProfileType.FABRIC, ProfileType.FORGE].includes(type);
  const icon = getIconFor(type);
  let finalKey = "CoreDetail.ReleaseType.";
  switch (props.profile.type) {
    case ReleaseType.RELEASE:
      finalKey += "Release";
      break;
    case ReleaseType.SNAPSHOT:
      finalKey += "Snapshot";
      break;
    case ReleaseType.OLD_ALPHA:
    case ReleaseType.OLD_BETA:
      finalKey += "Old";
      break;
    default:
      finalKey += "Modified";
  }
  return (
    <Box className={classes.root}>
      <img
        src={icon}
        alt={"ICON"}
        width={"72px"}
        height={"72px"}
        className={classes.icon}
      />
      <Typography className={classes.text} color={"textSecondary"} gutterBottom>
        {props.profile.id}
      </Typography>
      <Typography variant={"h5"} className={classes.primaryText} gutterBottom>
        {props.profile.baseVersion + " " + whatProfile(props.profile.id)}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("CoreDetail.At") + " " + props.container.id}
      </Typography>
      <Chip
        label={"Mod"}
        color={"primary"}
        variant={"outlined"}
        icon={modAble ? <CheckCircle /> : <Cancel />}
      />
      <br />
      <br />
      <Typography className={classes.text} gutterBottom>
        {tr("CoreDetail.MainClass") + " " + props.profile.mainClass}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("CoreDetail.ReleaseTime") +
          " " +
          props.profile.releaseTime.toLocaleString()}
      </Typography>
      <Typography className={classes.text} gutterBottom>
        {tr("CoreDetail.ReleaseType.Name") + " " + tr(finalKey)}
      </Typography>
    </Box>
  );
}
