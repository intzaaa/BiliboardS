import fastify from "fastify";
import cors from "@fastify/cors";
import { relations, users } from "./databases";

export const server = fastify({});

await server.register(cors, {
  origin: "*",
});

server.get("/", async () => {
  return "OK";
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
