import fastify from "fastify";
import cors from "@fastify/cors";
import { min_interval, relation_database, video_database } from ".";
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
      words: await calculate_words(latest.value.map((video) => video.title)),
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
