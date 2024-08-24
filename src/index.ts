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
import { equals } from "ramda";

program.name(package_json.name.toUpperCase()).description(package_json.description).version(package_json.version);

program
  .option("-p, --port <port>", "指定端口", "3000")
  .option("--no-headless", "是否开启无头模式", true)
  .option("-l, --limit <limit>", "限制监控数量（小于等于100）", "10")
  .option("-u, --user-agent <user_agent>", "重写用户代理")
  .option("-c, --cookie <cookie>", "重写 Cookie")
  .option("-i, --interval <interval>", "监视间隔", `${30 * 1000}`);
// .option("--targets <targets>", "指定目标文件");

program.configureHelp({
  sortSubcommands: true,
  sortOptions: true,
});

program.helpOption("-h, --help", "打印帮助信息");

program.parse().showHelpAfterError();

export const config = {
  port: Number(program.opts()["port"]),
  headless: program.opts()["headless"],
  // max_runs: Number(program.opts()["maxRuns"]),
  limit: Number(program.opts()["limit"]),
  user_agent: program.opts()["userAgent"],
  // cookie: JSON.parse(program.opts()["cookie"]).map((cookie: any) => ({
  //   name: cookie.name,
  //   value: cookie.value,
  //   domain: cookie.domain,
  //   expires: cookie.expires,
  //   // httpOnly: cookie.httpOnly,
  //   // secure: cookie.secure,
  //   // sameSite: cookie.sameSite,
  // })),
  interval: Number(program.opts()["interval"]),
  // targets: program.opts()["targets"],
};

export type Config = typeof config;

// console.log(config.cookie);

log(`已载入配置 ${JSON.stringify(program.opts())}`);

export const browser = await puppeteer.launch({
  headless: config.headless,
  timeout: 0,
  protocolTimeout: 100_000_000,
});

log(`已启动浏览器 ${config.headless ? "无头" : "有头"}`);

process.on("exit", async () => {
  save();
});

setInterval(save, config.interval * 10);

watch_popular_users("all", config.interval * 5, async (us) => {
  const limit_us = us.slice(0, config.limit);

  if (!equals(users.data.at(-1)?.value, limit_us)) {
    users.data.push({ timestamp: Date.now(), value: limit_us });
  }

  log(`已获取 ${limit_us.length} 个热门用户`);

  const cleanups = await Promise.all(
    limit_us.map(async (user) => {
      log(`正在监视用户 ${user.name} (${user.mid})`);
      return await watch_user_relations(user.mid, config.interval, async (rl) => {
        log(`已获取用户 ${user.name} (${user.mid}) 的关系`);

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
