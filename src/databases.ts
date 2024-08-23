import { JSONFileSyncPreset } from "lowdb/node";
import { DBRecord, Relation, User } from "./types";
import { mkdirSync } from "fs";

mkdirSync("databases", { recursive: true });

const users = await JSONFileSyncPreset<DBRecord<User[]>[]>("databases/users.json", []);
users.read();

const relations = await JSONFileSyncPreset<DBRecord<Relation>[]>("databases/relations.json", []);
relations.read();

export { users, relations };

export const save = () => {
  users.write();
  relations.write();
};
