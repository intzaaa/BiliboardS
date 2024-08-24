import fastify from "fastify";
import cors from "@fastify/cors";
import { relations, users } from "./databases";
import { config } from ".";
import { Responses } from "./types";

export const server = fastify({});

await server.register(cors, {
  origin: true,
});

server.get("/", async (req): Promise<Responses["/"]> => {
  const latest = users.data.at(-1);
  return {
    info: {
      interval: config.interval,
      limit: config.limit,
    },
    data: (
      latest ?? {
        value: [],
      }
    ).value.map(({ name, mid, avatar }) => {
      return {
        mid,
        name,
        avatar: `${req.protocol}://${req.hostname}/avatar/` + avatar.split("/").at(-1)?.replace(".jpg", ""),
        records: relations.data.filter((relation) => relation.value.mid === mid),
      };
    }),
  };
});

server.get("/users", async (request, reply) => {
  const limit = Number((request.query as any)["limit"]) || 10;
  const data = users.data.slice(-limit);

  if (data.length === 0) {
    reply.code(404);
    return;
  }

  return data;
});

server.get("/user/:mid", async (request, reply) => {
  const mid = Number((request.params as any)["mid"]);

  const user = users.data
    .filter((users) => users.value.some((user) => user.mid === mid))
    .at(-1)
    ?.value.find((user) => user.mid === mid);

  if (!user) {
    reply.code(404);
    return;
  }

  return user;
});

server.get("/relations", async (request, reply) => {
  const limit = Number((request.query as any)["limit"]) || 100;
  const data = relations.data.slice(-limit);

  if (data.length === 0) {
    reply.code(404);
    return;
  }

  return data;
});

server.get("/relation/:mid", async (request, reply) => {
  const mid = Number((request.params as any)["mid"]);

  const relation = relations.data.filter((relations) => relations.value.mid === mid);

  if (relation.length === 0) {
    reply.code(404);
    return;
  }

  return relation;
});

server.get("/avatar/:id", async (request) => {
  const id = String((request.params as any)["id"]);
  const target = `https://i1.hdslb.com/bfs/face/${id}.jpg`;
  return fetch(target);
});
