import { browser, config } from ".";
import { PopularVideoResponse, Relation, User, Zone } from "./types";
import { log } from "./utils";

export const get_popular_users = (zone: Zone): Promise<User[]> =>
  new Promise(async (resolve) => {
    const target_url = `https://www.bilibili.com/v/popular/rank/${zone}`;

    const page = await browser.newPage();

    await page.setUserAgent(config.user_agent);

    await page.setUserAgent(config.user_agent);

    page.on("response", async (response) => {
      const url = new URL(response.url());

      if (url.href.startsWith(`https://api.bilibili.com/x/web-interface/ranking/v2`)) {
        if (!response.ok()) {
          log(`Failed when fetching ${zone} popular list`);
          resolve([]);
        }

        const json: PopularVideoResponse = await response.json();

        resolve(
          json.data.list.map(({ owner }) => ({
            avatar: owner.face,
            mid: owner.mid,
            name: owner.name,
          }))
        );
      }
    });

    if (page.url() === target_url) {
      await page.reload({
        timeout: 0,
        waitUntil: "load",
      });
    } else {
      await page.goto(target_url, {
        timeout: 0,
        waitUntil: "load",
      });
    }

    await page.close();
  });

export const get_user_relations = (mid: number): Promise<Relation> =>
  new Promise(async (resolve) => {
    const target_url = `https://space.bilibili.com/${mid}`;

    const page = await browser.newPage();

    await page.setUserAgent(config.user_agent);

    await page.setUserAgent(config.user_agent);

    page.on("response", async (response) => {
      const url = new URL(response.url());

      if (url.href.startsWith(`https://api.bilibili.com/x/relation/stat`)) {
        if (!response.ok()) {
          log(`Failed when fetching relation for ${mid}`);
          resolve({
            mid,
            following: 0,
            follower: 0,
          });
        }

        const json = await response.json();

        resolve({
          mid,
          following: json.data.following,
          follower: json.data.follower,
        });
      }
    });

    if (page.url() === target_url) {
      await page.reload({
        timeout: 0,
        waitUntil: "domcontentloaded",
      });
    } else {
      await page.goto(target_url, {
        timeout: 0,
        waitUntil: "domcontentloaded",
      });
    }

    await page.close();
  });

export const watch_popular_users = async (zone: Zone, interval: number, callback: (users: User[]) => Promise<void | (() => Promise<void>)>) => {
  let cleanup: () => Promise<void>;

  const task = async () => {
    if (cleanup) await cleanup();

    const users = await get_popular_users(zone);
    const maybe_cleanup = await callback(users);

    if (maybe_cleanup) {
      cleanup = maybe_cleanup;
    }
  };

  task();
  const clear_id = setInterval(task, interval);

  return () => clearInterval(clear_id);
};

export const watch_user_relations = async (mid: number, interval: number, callback: (relation: Relation) => Promise<void | (() => Promise<void>)>) => {
  const task = async () => {
    const relation = await get_user_relations(mid);
    await callback(relation);
  };

  task();
  const clear_id = setInterval(task, interval);

  return () => clearInterval(clear_id);
};
