export type Zone =
  | "all"
  | "guochuang"
  | "douga"
  | "music"
  | "dance"
  | "game"
  | "technology"
  | "digital"
  | "life"
  | "kichiku"
  | "fashion"
  | "ent"
  | "cinephile"
  | "movie"
  | "teleplay"
  | "documentary"
  | "channel"
  | "information"
  | "movie"
  | "tv"
  | "documentary"
  | "channel"
  | "information";

export type User = {
  mid: number;

  avatar: string;
  name: string;
};

export type Relation = {
  mid: number;

  following: number;
  follower: number;
};

export type DBRecord<T> = {
  timestamp: number;
  value: T;
};

export type Responses = {
  "/": {
    info: {
      interval: number;
      limit: number;
    };
    data: {
      mid: number;
      name: string;
      avatar: string;
      records: DBRecord<Relation>[];
    }[];
  };
};

export { Config } from ".";
