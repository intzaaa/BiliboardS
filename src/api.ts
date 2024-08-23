import fastify from "fastify";
import { users } from "./databases";

export const server = fastify({});

server.get("/", async (request, reply) => {
  return "OK";
});

server.get("/users", async (request, reply) => {
  return users.data;
});

server.get("/relation/:mid", async (request, reply) => {
  const mid = Number((request.params as any)["mid"]);

  const user = users.data.findLast((entry) => entry.value.map((user) => user.mid).includes(mid));

  if (!user) {
    reply.status(404);
    return { message: "Not found" };
  }

  return user;
});
