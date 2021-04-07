import React, { useState } from "react";
import {
  AppBar,
  createStyles,
  IconButton,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { tr } from "./Translator";
import { Close } from "@material-ui/icons";
import { callSystemSide } from "./Remote";
import { SystemCommand } from "../shared/Structures";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    exitButton: {
      marginRight: theme.spacing(1),
    },
    title: {
      flexGrow: 1,
    },
  })
);

export function App(): JSX.Element {
  const classes = useStyles();
  const [page, setPage] = useState(Pages.Today);
  return (
    <div className={classes.root}>
      <AppBar position={"static"}>
        <Toolbar>
          <Typography variant={"h6"} className={classes.title}>
            {tr(page)}
          </Typography>
          <div
            onClick={() => {
              callSystemSide({ command: SystemCommand.CloseWindow });
            }}
          >
            <IconButton className={classes.exitButton} color="inherit">
              <Close />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
    </div>
  );
}

enum Pages {
  Settings = "Settings",
  Today = "Today",
  Containers = "Containers",
  LaunchPad = "LaunchPad",
  CrashAnalyze = "CrashAnalyze",
  CoreDetail = "CoreDetail",
  ModDetail = "ModDetail",
  Installer = "Installer",
  Accounts = "Accounts",
  AccountDetail = "AccountDetail",
  InstallConfiguration = "InstallConfiguration",
}
