import type { HTTPRequest, HTTPResponse, Page, ResourceType } from "puppeteer";
import { browser, config } from ".";
import UserAgent from "user-agents";
import { parse as parse_user_agent } from "useragent";
import { PromiseOrNot, Relation, ScheduleCallback, Video, Word, Zone } from "./types";
import { cut } from "jieba-wasm";
import { random } from "./utils";
import { sortBy } from "ramda";

export const new_page = async () => {
  const page = await browser.newPage();

  await page.setViewport({
    width: 390,
    height: 844,
  });

  await page.setCacheEnabled(true);

  // await page.setCookie(...config.cookie);

  config.browser.user_agent !== "" &&
    (await page.setUserAgent(
      config.browser.user_agent === "auto"
        ? new UserAgent((data) => {
            const ua = parse_user_agent(data.userAgent);
            return ua.os.family === "iOS" && Number(ua.os.major) >= 11;
          }).toString()
        : config.browser.user_agent
    ));

  await page.setRequestInterception(true);

  return page;
};

export const close_page = async (page: Page) => {
  await page.close();
};

export const capture = async <T>(
  url: string,
  predicate: (res: HTTPResponse) => PromiseOrNot<boolean>,
  processor: (res: HTTPResponse) => PromiseOrNot<T>,
  filter?: (req: HTTPRequest) => PromiseOrNot<boolean>,
  retries: number = config.browser.max_retries
): Promise<Awaited<T>> => {
  if (retries <= 0) {
    throw new Error("Max retries exceeded");
  }

  const page = await new_page();

  try {
    page.on("request", async (req) => {
      if (filter && !(await filter(req))) {
        await req.abort();
      } else {
        await req.continue();
      }
    });

    const [res] = await Promise.all([
      page.waitForResponse(predicate, {}),

      page.goto(url, {
        waitUntil: "domcontentloaded",
      }),
    ]).catch((e) => {
      throw e;
    });

    const result = await processor(res);

    await close_page(page);

    return result;
  } catch (e) {
    console.error(e);

    try {
      await close_page(page);
    } catch (e) {
      console.error(e);
    }

    return await capture(url, predicate, processor, filter, retries - 1);
  }
};

export const necessary_filter = (req: HTTPRequest) => {
  const type = req.resourceType();
  const necessities: ResourceType[] = ["document", "xhr", "stylesheet", "fetch", "script", "prefetch", "preflight", "other"];

  return necessities.includes(type);
};

export const capture_videos = async (zone: Zone) => {
  return await capture<Video[]>(
    `https://www.bilibili.com/v/popular/rank/${zone}`,
    (res) => res.url().startsWith("https://api.bilibili.com/x/web-interface/ranking/v2"),
    async (res) => {
      const data: {
        code: number;
        data: {
          list: {
            title: string;
            aid: number;
            bvid: string;
            pic: string;
            owner: {
              mid: number;
              name: string;
              face: string;
            };
          }[];
        };
      } = await res.json();

      if (data.code !== 0) {
        throw new Error("Invalid response");
      }

      return data.data.list.map((video) => ({
        title: video.title,
        aid: video.aid,
        bvid: video.bvid,
        cover: video.pic,
        owner: {
          mid: video.owner.mid,
          name: video.owner.name,
          avatar: video.owner.face,
        },
      }));
    },
    necessary_filter
  );
};

export const capture_relations = async (mid: number) => {
  return await capture<Relation>(
    [`https://m.bilibili.com/space/${mid}`, `https://space.bilibili.com/${mid}`][random(0, 1)]!,
    (res) => res.url().startsWith(`https://api.bilibili.com/x/relation/stat`),
    async (res) => {
      const data: {
        code: number;
        data: {
          mid: number;
          following: number;
          follower: number;
        };
      } = await res.json();

      if (data.code !== 0) {
        throw new Error("Invalid response");
      }

      return data.data;
    },
    necessary_filter
  );
};

const tasks: {
  status: "running" | "pending" | "done";
  task: () => Promise<void>;
}[] = [];

setInterval(async () => {
  tasks
    .filter((task) => task.status === "pending")
    .slice(0, config.max_tasks - tasks.filter((task) => task.status === "running").length)
    .map(async (task) => {
      task.status = "running";
      await task.task();
      task.status = "done";
    });
}, 50);

export const schedule = async <T>(task: () => T | Promise<T>, interval: number, callback: ScheduleCallback<T>) => {
  let dispose: void | (() => void | Promise<void>);

  dispose = await new Promise<ReturnType<ScheduleCallback<T>>>((resolve) => {
    tasks.push({
      status: "pending",
      task: async () => {
        resolve(await callback(await task()));
      },
    });
  });

  const clear_id = setInterval(async () => {
    dispose && (await dispose());

    dispose = await callback(await task());
  }, interval);

  return () => clearInterval(clear_id);
};

export const watch_videos = async (zone: Zone, interval: number, callback: ScheduleCallback<Video[]>) => {
  return await schedule(async () => await capture_videos(zone), interval, callback);
};

export const watch_relations = async (mid: number, interval: number, callback: ScheduleCallback<Relation>) => {
  return await schedule(async () => await capture_relations(mid), interval, callback);
};

export const calculate_words = async (raw_words: string[]): Promise<Word[]> => {
  const words = raw_words
    .map((word) => cut(word, true))
    .flat()
    .filter((word) => word.length > 1);

  return sortBy(
    (word) => word.heat,
    Array.from(new Set(words)).map((word) => ({
      name: word,
      heat: words.filter((w) => w === word).length,
    }))
  ).reverse();
};
