import { log } from "./utils";
import minimist from "minimist";
import puppeteer from "puppeteer";
import { JSONFileSyncPreset } from "lowdb/node";
import { watch_videos, watch_relations } from "./functions";
import { DB, Relation, Video, Zone } from "./types";
import { equals } from "ramda";
import { server } from "./api";
import { mkdirSync } from "fs";
import MultiProgressBar from "multi-progress";
import ProgressBar from "progress";

const opts = {
  boolean: ["help", "once", "headless", "sandbox"],
  default: {
    once: false,
    headless: true,
    sandbox: true,
  },
  string: [
    "user-agent",
    "max-tasks",
    "max-retries",
    "db",
    "db-video",
    // "db-comment",
    // "db-user",
    "db-relation",
    // "video-interval",
    // "comment-interval",
    // "user-interval",
    "interval-video",
    "interval-relation",
    "video-zone",
    "relation-limit",
  ],
  alias: {
    h: "help",
    o: "once",
    H: "headless",
    S: "sandbox",
    u: "user-agent",
    m: "max-tabs",
  },
};

const args = minimist(process.argv.slice(2), opts);

if (args["help"]) {
  log(
    `boolean: [${opts.boolean
      .map((v) => {
        const def = opts.default[v as keyof typeof opts.default];
        if (def) {
          return `${v}:${def}`;
        } else {
          return v;
        }
      })
      .join(", ")}]`
  );
  log(`value: [${opts.string.join(", ")}]`);
  process.exit(0);
}

// log(`已解析参数 ${JSON.stringify(options)}`);

const databases_directory = args["db"] ?? "databases";

export const config: {
  once: boolean;
  max_tasks: number;
  browser: {
    headless: boolean;
    sandbox: boolean;
    max_retries: number;
    user_agent: string | "auto";
  };
  databases: {
    directory: string;
    video: string;
    // comment: string;
    // user: string;
    relation: string;
  };
  intervals: {
    video: number;
    // comment: number;
    relation: number;
  };
  video: {
    zone: Zone;
  };
  relation: {
    limit: number;
  };
} = {
  once: args["once"],
  max_tasks: Number(args["max-tasks"] ?? 5),
  browser: {
    headless: args["headless"],
    sandbox: args["sandbox"],
    max_retries: Number(args["max-retry"] ?? 5),
    user_agent: args["user-agent"] ?? "auto",
  },
  databases: {
    directory: databases_directory,
    video: args["db-video"] ?? `${databases_directory}/video.json`,
    relation: args["db-relation"] ?? `${databases_directory}/relation.json`,
  },
  intervals: {
    video: Number(args["interval-video"] ?? 120000),
    relation: Number(args["interval-relation"] ?? 30000),
  },
  video: {
    zone: args["video-zone"] ?? "all",
  },
  relation: {
    limit: Number(args["relation-limit"] ?? 20),
  },
};

export const min_interval = Math.min(...Object.values(config.intervals));

log(`已载入配置 ${JSON.stringify(config)}`);

export const browser = await puppeteer.launch({
  headless: config.browser.headless,
  args: config.browser.sandbox ? [] : ["--no-sandbox", "--disable-setuid-sandbox"],
});

log("已启动浏览器");

mkdirSync(databases_directory, { recursive: true });

export const [video_database, relation_database] = [
  JSONFileSyncPreset<DB<Video[]>>(config.databases.video, []),
  JSONFileSyncPreset<DB<Relation>>(config.databases.relation, []),
];

const read = () => {
  video_database.read();
  relation_database.read();
};
read();

const write = () => {
  video_database.write();
  relation_database.write();
};

process.on("exit", write);

setInterval(write, min_interval * 10);

log("已载入数据库");

watch_videos("all", config.intervals.video, async (videos) => {
  log(`已获取 ${videos.length} 条视频信息`);

  const last = video_database.data.at(-1)?.value;

  if (!equals(last, videos)) {
    video_database.data.push({ timestamp: Date.now(), value: videos });
  }

  const multi_bar = new MultiProgressBar(process.stderr);

  const clear_ids = await Promise.all(
    videos.slice(0, config.relation.limit).map((video) => {
      return (async () => {
        let bar: ProgressBar;

        return watch_relations(video.owner.mid, config.intervals.relation, async (relation) => {
          if (!bar) {
            bar = multi_bar.newBar(`[:bar] ${video.owner.name}`, {
              total: config.intervals.video / config.intervals.relation,
              width: 20,
            });
          }

          bar.tick();

          relation_database.data.push({
            timestamp: Date.now(),
            value: {
              mid: video.owner.mid,
              following: relation.following,
              follower: relation.follower,
            },
          });
        });
      })();
    })
  );

  return () => {
    multi_bar.terminate();
    clear_ids.forEach((f) => f());
  };
});

server.listen({
  port: 3000,
});
