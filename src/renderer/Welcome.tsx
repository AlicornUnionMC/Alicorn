import { Box, Fab, Tooltip, Typography } from "@material-ui/core";
import { History } from "@material-ui/icons";
import React from "react";
import { LAUNCHER_VERSION } from "../modules/commons/Constants";
import { jumpTo, triggerSetPage } from "./GoTo";
import { LAST_SUCCESSFUL_GAME_KEY } from "./ReadyToLaunch";
import { useTextStyles } from "./Stylex";
import { randsl, tr } from "./Translator";

export function Welcome(): JSX.Element {
  const classes = useTextStyles();
  const cv = window.localStorage.getItem("CurrentVersion");
  let shouldShowChangelog = true;
  if (cv) {
    if (cv === LAUNCHER_VERSION) {
      shouldShowChangelog = false;
    }
  }
  return (
    <Box className={classes.root}>
      <Typography color={"primary"} className={classes.firstText} gutterBottom>
        {shouldShowChangelog
          ? tr("Changelog.title")
          : randsl("Welcome.Suggest.Part1")}
      </Typography>
      <Typography
        color={"secondary"}
        className={classes.secondText}
        gutterBottom
      >
        {shouldShowChangelog
          ? tr("Changelog.content")
          : randsl("Welcome.Suggest.Part2")}
      </Typography>
      <br />
      <Tooltip title={tr("Welcome.Suggest.LastSuccessfulLaunch")}>
        <Box>
          <Fab
            disabled={!window.localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY)}
            color={"primary"}
            style={{
              position: "fixed",
              right: "16px",
              bottom: "16px",
            }}
            onClick={() => {
              jumpTo(
                window.localStorage.getItem(LAST_SUCCESSFUL_GAME_KEY) ||
                  "/ReadyToLaunch/undefined/undefined"
              );
              triggerSetPage("ReadyToLaunch");
            }}
          >
            <History />
          </Fab>
        </Box>
      </Tooltip>
    </Box>
  );
}
