import { HTTPResponse } from "puppeteer";
import { browser, config } from ".";
import { Relation, User, Zone } from "./types";
import { random } from "./utils";

export const new_page = async () => {
  const page = await browser.newPage();

  await page.setViewport({
    width: 390,
    height: 844,
  });

  await page.setCacheEnabled(true);

  // await page.setCookie(...config.cookie);

  await page.setUserAgent(config.user_agent);

  return page;
};

export const get_response = async <T>(
  target: string,
  timeout: number,
  predicate: (res: HTTPResponse) => boolean,
  processor: (res: HTTPResponse) => T
): Promise<T> => {
  const page = await new_page();
  try {
    const [res] = await Promise.all([
      page.waitForResponse(predicate, {
        timeout,
      }),
      page.goto(target, {
        waitUntil: "domcontentloaded",
      }),
    ]).catch((e) => {
      throw e;
    });

    const result = await processor(res);

    // await page.goto("about:blank", {
    //   timeout,
    //   waitUntil: "load",
    // });

    await page.close();

    return result;
  } catch (e) {
    // await page.goto("about:blank", {
    //   timeout,
    //   waitUntil: "load",
    // });

    try {
      await page.close();
    } catch (e) {}

    return await get_response(target, timeout, predicate, processor);
  }
};

export const get_popular_users = async (zone: Zone, timeout: number): Promise<User[]> => {
  return await get_response(
    `https://www.bilibili.com/v/popular/rank/${zone}`,
    timeout,
    (response) => {
      const url = new URL(response.url());
      return url.href.startsWith(`https://api.bilibili.com/x/web-interface/ranking/v2`);
    },
    async (response) => {
      const json = await response.json();

      return json.data.list.map(
        ({
          owner,
        }: {
          owner: {
            mid: number;
            name: string;
            face: string;
          };
        }) => ({
          avatar: owner.face,
          mid: owner.mid,
          name: owner.name,
        })
      );
    }
  );
};

export const get_user_relations = async (mid: number, timeout: number): Promise<Relation> => {
  return await get_response(
    `https://m.bilibili.com/space/${mid}`,
    timeout,
    (response) => {
      const url = new URL(response.url());
      return url.href.startsWith(`https://api.bilibili.com/x/relation/stat`);
    },
    async (response) => {
      const json = await response.json();

      return {
        mid,
        following: json.data.following,
        follower: json.data.follower,
      };
    }
  );
};

export const watch_popular_users = async (zone: Zone, interval: number, callback: (users: User[]) => Promise<void | (() => Promise<void>)>) => {
  let cleanup: () => Promise<void>;

  const task = () => {
    setTimeout(
      async () => {
        if (cleanup) await cleanup();

        const users = await get_popular_users(zone, interval);
        const maybe_cleanup = await callback(users);

        if (maybe_cleanup) {
          cleanup = maybe_cleanup;
        }
      },
      random(0, 1000)
    );
  };

  task();
  const clear_id = setInterval(task, interval);

  return () => clearInterval(clear_id);
};

export const watch_user_relations = async (mid: number, interval: number, callback: (relation: Relation) => Promise<void | (() => Promise<void>)>) => {
  const task = () => {
    setTimeout(
      async () => {
        const relation = await get_user_relations(mid, interval / 4);
        await callback(relation);
      },
      random(0, 1000)
    );
  };

  task();
  const clear_id = setInterval(task, interval);

  return () => clearInterval(clear_id);
};
