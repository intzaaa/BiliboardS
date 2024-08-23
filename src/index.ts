// import { monitor, Monitor_Data } from "./monitor";
// import { parse as parse_csv } from "csv-parse";
// import { mkdirSync, readFileSync, watchFile } from "fs";
// import { render_chart_to_svg, render_svg_to_png, save_png, save_svg } from "./renderer";
// import { JSONFileSyncPreset } from "lowdb/node";
// import { program } from "commander";
// import puppeteer from "puppeteer";
// import dayjs from "dayjs";
// import { add_sign, log } from "./utils";
// import { PopularUsers, PopularVideoResponse, User } from "./types";

import { program } from "commander";
import package_json from "../package.json" with { type: "json" };
import { log } from "./utils";
import puppeteer from "puppeteer";
import { relations, users } from "./databases";
import { watch_popular_users, watch_user_relations } from "./functions";
import { save } from "./databases";
import { server } from "./api";

program.name(package_json.name.toUpperCase()).description(package_json.description).version(package_json.version);

program
  .option("--no-headless", "关闭无头模式")

  .option("--limit <limit>", "限制最大样本数量", "100")
  .option(
    "--user-agent <user_agent>",
    "重写用户代理",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
  )
  .option("--interval <interval>", "监视间隔", "5000");
// .option("--targets <targets>", "指定目标文件");

program.configureHelp({
  sortSubcommands: true,
  sortOptions: true,
});

program.helpOption("-h, --help", "打印帮助信息");

program.parse().showHelpAfterError();

export const config = {
  headless: program.opts()["headless"],
  // max_runs: Number(program.opts()["maxRuns"]),
  limit: Number(program.opts()["limit"]),
  user_agent: program.opts()["userAgent"],
  interval: Number(program.opts()["interval"]),
  // targets: program.opts()["targets"],
};

log(`已载入配置 ${JSON.stringify(config)}`);

export const browser = await puppeteer.launch({
  headless: config.headless,
});
log(`已启动浏览器 ${config.headless ? "无头" : "有头"}`);

process.on("exit", async () => {
  await save();

  await browser.close();
});

setInterval(save, 5 * 1000);

watch_popular_users("all", config.interval * 5, async (us) => {
  users.data.push({ timestamp: Date.now(), value: us });

  log(`已获取 ${us.length} 个热门用户`);

  const cleanups = await Promise.all(
    us.slice(0, 10).map(async (user) => {
      log(`正在监视用户 ${user.name} (${user.mid})`);
      return await watch_user_relations(user.mid, config.interval, async (rl) => {
        relations.data.push({ timestamp: Date.now(), value: rl });
      });
    })
  );

  return async () => {
    await Promise.all(cleanups.map((f) => f()));
  };
});

await server.listen({
  port: 3000,
});
