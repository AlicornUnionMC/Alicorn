import { invokeAlicorn } from "./CallAlicorn";
import { Executor } from "./Component";
import { getWindow } from "./GetWindow";
import { showDialog } from "./MCBBS";

function isModPubPage(): boolean {
  return (
    document
      .querySelector(
        "tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > tbody"
      )
      ?.innerHTML.includes("Mod类型") || false
  );
}

function getCompatibleVersions(): string[] {
  return (
    document
      .querySelector(
        "tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > tbody > tr:nth-child(6) > td"
      )
      ?.innerHTML.split("&nbsp;") || []
  );
}

function getModName(): string {
  return (
    document.querySelector(
      "tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > tbody > tr:nth-child(2) > td"
    )?.innerHTML || ""
  );
}

async function selectContainer(): Promise<string> {
  const all = (await invokeAlicorn("GetAllContainers")) as string[];
  if (all.length === 0) {
    return "";
  }
  if (all.length === 1) {
    return all[0];
  }
  const csText = all
    .map((c) => {
      return `<span onclick="window.dispatchEvent(new CustomEvent('selectContainer', {detail:'${c}'}));">${c}</span>`;
    })
    .join("<br/>");
  showDialog(
    "你想安装到哪个容器中？单击以选择。<br/>" +
      csText +
      '<br/><i style="color:gray">是时候了！</i>',
    "notice",
    "选择安装目标"
  );
  return new Promise<string>((resolve) => {
    getWindow().addEventListener("selectContainer", (e) => {
      const selected = String((e as CustomEvent).detail);
      resolve(selected);
    });
  });
}

async function generateClicker(document: Document): Promise<void> {
  const version = getCompatibleVersions();
  const name = getModName();

  if (version.length > 0 && name.length > 0) {
    const links = version.map((v) => {
      const ele = document.createElement("span");
      ele.onclick = async () => {
        const ct = await selectContainer();
        showDialog("准备就绪，转到 Alicorn 按下安装按钮试试吧！", "right");
        await invokeAlicorn(
          "JumpTo",
          `/PffFront/${ct}/${v}/${name}`,
          "PffFront"
        );
      };
      ele.innerHTML = v + " ";
      return ele;
    });
    const e = document.querySelector(
      "tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > tbody > tr:nth-child(6) > td"
    );
    if (e) {
      e.childNodes.forEach((e) => {
        e.remove();
      });
      links.forEach((ex) => {
        e.append(ex);
      });
    }
  }
}

function bindButton(document: Document): void {
  if (isModPubPage()) {
    generateClicker(document);
  }
}

export class AddMod extends Executor {
  execute(document: Document, ..._args: unknown[]): void {
    bindButton(document);
  }
}
