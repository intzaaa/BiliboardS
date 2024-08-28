import fastify from "fastify";
import cors from "@fastify/cors";
import { config, min_interval, relation_database, video_database } from ".";
import { Responses } from "./types";
import { calculate_words } from "./functions";

export const server = fastify({});

await server.register(cors, {
  origin: true,
});

server.get("/", async (request): Promise<Responses["/"]> => {
  const latest = video_database.data.at(-1) ?? { timestamp: 0, value: [] };
  const max_history = Number((request.query as any)["max_history"]) || 100;
  return {
    interval: min_interval,
    data: {
      words: await calculate_words([...latest.value.map((video) => video.title), ...latest.value.map((video) => video.description)]),
      videos: latest.value.map((video) => ({
        ...video,
        owner: {
          ...video.owner,
          relations: relation_database.data.filter((rl) => rl.value.mid === video.owner.mid).slice(-max_history),
        },
      })),
    },
  };
});

server.get("/config", async (): Promise<Responses["/config"]> => {
  return config;
});

server.get("/videos", async (): Promise<Responses["/videos"]> => {
  return video_database.data.map((db) => db.value).flat();
});

server.get("/relations", async (): Promise<Responses["/relations"]> => {
  return relation_database.data.map((db) => db.value);
});

server.get("/users", async (): Promise<Responses["/users"]> => {
  return video_database.data
    .map((db) => db.value)
    .flat()
    .map((video) => video.owner);
});
