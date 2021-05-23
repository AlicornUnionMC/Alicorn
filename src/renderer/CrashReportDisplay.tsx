import React, { useEffect, useRef, useState } from "react";
import {
  LAST_FAILURE_INFO_KEY,
  LAST_LAUNCH_REPORT_KEY,
  LAST_LOGS_KEY,
  MCFailureInfo,
} from "./ReadyToLaunch";
import { LaunchTracker } from "../modules/launch/Tracker";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  createStyles,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { tr } from "./Translator";
import { ProfileType, whatProfile } from "../modules/profile/WhatProfile";
import {
  analyzeCrashReport,
  CrashLoaderReport,
} from "../modules/crhelper/CrashLoader";

const useAccStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    acc1: {
      backgroundColor: theme.palette.primary.main,
    },
    acc2: {
      backgroundColor: theme.palette.primary.dark,
    },
    table: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
  })
);

export function CrashReportDisplay(): JSX.Element {
  // @ts-ignore
  const failureInfo = window[LAST_FAILURE_INFO_KEY] as MCFailureInfo;
  // @ts-ignore
  const launchTracker = window[LAST_LAUNCH_REPORT_KEY] as LaunchTracker;
  // @ts-ignore
  const logs = window[LAST_LOGS_KEY] as string[];
  const [report, setReport] = useState<CrashReportMap>();
  const mounted = useRef<boolean>(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() => {
    if (failureInfo.crashReport !== undefined) {
      const f = failureInfo.crashReport;
      (async () => {
        const r = await analyzeCrashReport(
          failureInfo.container.getCrashReport(f)
        );
        if (mounted.current) {
          setReport(r);
        }
      })();
    }
  }, []);
  return (
    <Box>
      {
        // @ts-ignore
        window[LAST_FAILURE_INFO_KEY] === undefined ? (
          ""
        ) : (
          <BaseInfoDisplay info={failureInfo} />
        )
      }
      {
        // @ts-ignore
        window[LAST_LAUNCH_REPORT_KEY] === undefined ? (
          ""
        ) : (
          <Box>
            <ModList tracker={launchTracker} />
            <LaunchTrackCount tracker={launchTracker} />
          </Box>
        )
      }

      {report === undefined ? "" : <Analyze analyze={report} />}
      {
        // @ts-ignore
        window[LAST_LOGS_KEY]?.length > 0 ? "" : <LogsDisplay logs={logs} />
      }
    </Box>
  );
}

function BaseInfoDisplay(props: { info: MCFailureInfo }): JSX.Element {
  const classes = useAccStyles();
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.BaseInfo")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <Table className={classes.table}>
          <TableBody>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.BaseInfo.ID")}</TableCell>
              <TableCell>{props.info.profile.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {tr("CrashReportDisplay.BaseInfo.BaseVersion")}
              </TableCell>
              <TableCell>{props.info.profile.baseVersion}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.BaseInfo.Modded")}</TableCell>
              <TableCell>
                {(() => {
                  const type = whatProfile(props.info.profile.id);
                  if (type === ProfileType.MOJANG) {
                    return tr("CrashReportDisplay.BaseInfo.Modded.No");
                  }
                  if (type === ProfileType.UNIVERSAL) {
                    return tr("CrashReportDisplay.BaseInfo.Modded.Unknown");
                  }
                  return tr("CrashReportDisplay.BaseInfo.Modded.Yes");
                })()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {tr("CrashReportDisplay.BaseInfo.AssetIndex")}
              </TableCell>
              <TableCell>{props.info.profile.assetIndex.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.BaseInfo.Time")}</TableCell>
              <TableCell>
                {props.info.profile.releaseTime.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

function LaunchTrackCount(props: { tracker: LaunchTracker }): JSX.Element {
  const classes = useAccStyles();
  return (
    <Accordion className={classes.root}>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.LaunchTrackCount")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <Table className={classes.table}>
          <TableBody>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.Libraries")}</TableCell>
              <TableCell>
                {`${props.tracker.library().resolved} ${tr(
                  "CrashReportDisplay.Resolved"
                )} / ${props.tracker.library().total} ${tr(
                  "CrashReportDisplay.Total"
                )}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.Assets")}</TableCell>
              <TableCell>
                {`${props.tracker.assets().resolved} ${tr(
                  "CrashReportDisplay.Resolved"
                )} / ${props.tracker.assets().total} ${tr(
                  "CrashReportDisplay.Total"
                )}`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

function ModList(props: { tracker: LaunchTracker }): JSX.Element {
  const classes = useAccStyles();
  return props.tracker.mods().total > 0 ? (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.Mods")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <Table className={classes.table}>
          <TableBody>
            {props.tracker.mods().operateRecord.map((o) => {
              return (
                <TableRow key={o.file}>
                  <TableCell>{o.file}</TableCell>
                  <TableCell>
                    {o.operation === "OPERATED"
                      ? tr("CrashReportDisplay.Mods.Moved")
                      : o.operation === "SKIPPED"
                      ? tr("CrashReportDisplay.Mods.Reserved")
                      : tr("CrashReportDisplay.Mods.Failed")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  ) : (
    <></>
  );
}

type CrashReportMap = Map<
  number,
  { origin: string; report: CrashLoaderReport[] }
>;

function Analyze(props: { analyze: CrashReportMap }): JSX.Element {
  const classes = useAccStyles();
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.Analyze")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        {(() => {
          const li = Array.from(props.analyze.keys());
          return li.map((n) => {
            const cr = props.analyze.get(n);
            if (cr?.report.length === 0) {
              return "";
            }
            return (
              <Box key={n}>
                <Accordion>
                  <AccordionSummary
                    className={classes.acc2}
                    expandIcon={<ExpandMore />}
                  >
                    <Typography>{`${tr(
                      "CrashReportDisplay.Analyze.Line"
                    )} ${n} - ${cr?.origin}`}</Typography>
                  </AccordionSummary>
                  <AccordionDetails className={classes.acc2}>
                    {cr?.report.map((r) => {
                      if (r.by === undefined || r.reason === undefined) {
                        return <></>;
                      }
                      return (
                        <Accordion key={r.by + r.reason}>
                          <AccordionSummary
                            className={classes.acc1}
                            expandIcon={
                              r.suggestions !== undefined &&
                              r.suggestions.length > 0 ? (
                                <ExpandMore />
                              ) : undefined
                            }
                          >
                            <Typography>{`${r.by} ${r.reason}`}</Typography>
                          </AccordionSummary>
                          <AccordionDetails className={classes.acc1}>
                            {r.suggestions === undefined ||
                            r.suggestions.length === 0 ? (
                              ""
                            ) : (
                              <List>
                                {r.suggestions.map((s) => {
                                  return (
                                    <ListItem key={s}>
                                      <ListItemText>{s}</ListItemText>
                                    </ListItem>
                                  );
                                })}
                              </List>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
                <br />
              </Box>
            );
          });
        })()}
      </AccordionDetails>
    </Accordion>
  );
}

function LogsDisplay(props: { logs: string[] }): JSX.Element {
  const classes = useAccStyles();
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.Logs")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <List>
          {props.logs.map((l) => {
            return <ListItemText key={l}>{l}</ListItemText>;
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
