import { JSONFilePreset } from "lowdb/node";
import { DBRecord, Relation, User } from "./types";
import { mkdirSync } from "fs";

mkdirSync("databases", { recursive: true });

const users = await JSONFilePreset<DBRecord<User[]>[]>("databases/users.json", []);
await users.read();

const relations = await JSONFilePreset<DBRecord<Relation>[]>("databases/relations.json", []);
await relations.read();

export { users, relations };

export const save = async () => {
  await users.write();
  await relations.write();
};
