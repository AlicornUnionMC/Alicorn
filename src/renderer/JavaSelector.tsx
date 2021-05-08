import React, { useEffect, useRef, useState } from "react";
import { useFormStyles } from "./Stylex";
import {
  Box,
  createStyles,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  makeStyles,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { whereJava } from "../modules/java/WhereJava";
import {
  getAllJava,
  getJavaInfoRaw,
  getLastUsedJavaHome,
  JavaInfo,
  parseJavaInfo,
  parseJavaInfoRaw,
  resetJavaList,
  setLastUsedJavaHome,
} from "../modules/java/JInfo";
import { tr } from "./Translator";
import objectHash from "object-hash";
import { Refresh } from "@material-ui/icons";

const CANNOT_LOAD_INFO: JavaInfo = {
  rootVersion: -1,
  vm: "",
  vmSide: "Server",
  bits: "64",
  isFree: true,
  runtime: "",
  version: "",
};

export function JavaSelector(): JSX.Element {
  const classes = useFormStyles();
  const fullWidthClasses = makeStyles((theme) =>
    createStyles({
      form: {
        width: theme.spacing(80),
      },
      right: {
        float: "right",
        marginRight: theme.spacing(4),
      },
    })
  )();
  const [isLoaded, setLoaded] = useState<boolean>(true);
  const isMounted = useRef<boolean>(true);
  const [javaList, setJavaList] = useState<string[]>(getAllJava());
  const [javaInfo, setJavaInfo] = useState<Map<string, JavaInfo>>(new Map());
  const [currentJava, setCurrentJava] = useState<string>(getLastUsedJavaHome());
  const [currentJavaInfo, setCurrentJavaInfo] = useState<JavaInfo>(
    CANNOT_LOAD_INFO
  );
  useEffect(() => {
    isMounted.current = true;

    (async () => {
      try {
        const t = parseJavaInfo(
          parseJavaInfoRaw(await getJavaInfoRaw(currentJava))
        );
        if (isMounted.current) {
          setCurrentJavaInfo(t);
        }
      } catch {
        if (isMounted.current) {
          setCurrentJavaInfo(CANNOT_LOAD_INFO);
        }
      }
    })();

    return () => {
      isMounted.current = false;
    };
  }, []);
  useEffect(() => {
    (async () => {
      let javas;
      if (!isLoaded) {
        javas = await whereJava();
      } else {
        javas = getAllJava();
      }
      if (isMounted.current) {
        if (!isLoaded) {
          resetJavaList(javas);
        }
        setJavaList(javas);
        const tMap: Map<string, JavaInfo> = new Map();
        for (const j of javas) {
          try {
            tMap.set(
              j,
              parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j)))
            );
          } catch {
            tMap.set(j, CANNOT_LOAD_INFO);
          }
        }
        if (isMounted.current) {
          setJavaInfo(tMap);
        }
        setLoaded(true);
      }
    })();
  }, [isLoaded]);
  return (
    <Box className={classes.root}>
      <Box>
        <Typography
          variant={"h5"}
          color={"primary"}
          className={classes.title}
          gutterBottom
        >
          {tr("JavaSelector.SelectJavaTitle")}
        </Typography>
      </Box>
      <FormControl>
        <InputLabel id={"Select-JRE"} className={classes.label}>
          {tr("JavaSelector.SelectJava")}
        </InputLabel>
        <Select
          disabled={!isLoaded}
          labelId={"Select-JRE"}
          color={"primary"}
          className={classes.selector + " " + fullWidthClasses.form}
          onChange={(e) => {
            const sj = String(e.target.value);
            setCurrentJava(sj);
            setLastUsedJavaHome(sj);
          }}
          value={currentJava}
        >
          {javaList.map((j) => {
            return (
              <MenuItem key={objectHash(j)} value={j}>
                {j}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <Tooltip title={tr("JavaSelector.Reload")}>
        <IconButton
          color={"primary"}
          className={fullWidthClasses.right}
          onClick={() => {
            setLoaded(false);
          }}
        >
          <Refresh />
        </IconButton>
      </Tooltip>
      {isLoaded ? (
        ""
      ) : (
        <Box>
          <LinearProgress color={"secondary"} />
          <br />
          <Typography className={classes.text} color={"primary"} gutterBottom>
            {tr("JavaSelector.Loading")}
          </Typography>
        </Box>
      )}

      <JavaInfoDisplay
        jInfo={isLoaded ? javaInfo.get(currentJava) : currentJavaInfo}
      />
    </Box>
  );
}

function JavaInfoDisplay(props: { jInfo?: JavaInfo }): JSX.Element {
  const corruptBit =
    props.jInfo?.rootVersion === -1 || props.jInfo === undefined;
  return (
    <Box>
      <Typography variant={"h6"} color={"primary"} gutterBottom>
        {corruptBit
          ? tr("JavaSelector.CannotLoad")
          : `Java ${props.jInfo?.rootVersion || 0}`}
      </Typography>
      {corruptBit ? (
        ""
      ) : (
        <Box>
          <Typography color={"secondary"} gutterBottom>
            {props.jInfo?.runtime || "Unknown"}
          </Typography>
          <Typography color={"secondary"} gutterBottom>
            {props.jInfo?.vm || "Unknown"}
          </Typography>
        </Box>
      )}
      {corruptBit ? (
        <Typography
          style={{ fontSize: "small", color: "#ff8400" }}
          gutterBottom
        >
          {tr("JavaSelector.CannotLoadDetail")}
        </Typography>
      ) : (
        ""
      )}
      {corruptBit ? (
        ""
      ) : (
        <Box>
          {props.jInfo?.isFree ? (
            ""
          ) : (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
              gutterBottom
            >
              {tr("JavaSelector.WarnNonFree")}
            </Typography>
          )}
          {props.jInfo?.vmSide === "Server" ? (
            ""
          ) : (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
              gutterBottom
            >
              {tr("JavaSelector.WarnClient")}
            </Typography>
          )}
          {props.jInfo?.bits === "64" ? (
            ""
          ) : (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
              gutterBottom
            >
              {tr("JavaSelector.Warn32")}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
