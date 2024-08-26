import { config } from ".";

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

export type Word = {
  heat: number;
  name: string;
};

export type Video = {
  aid: number;
  bvid: string;
  title: string;
  cover: string;
  description: string;
  owner: User;
};

export type Relation = {
  mid: number;

  following: number;
  follower: number;
};

export type DB<T> = {
  timestamp: number;
  value: T;
}[];

export type Responses = {
  "/": {
    interval: number;
    data: {
      words: Word[];
      videos: (Video & {
        owner: User & {
          relations: DB<Relation>;
        };
      })[];
    };
  };
  "/config": typeof config;
  "/videos": {
    videos: Video[];
  };
  "/relations": {
    relations: Relation[];
  };
  "/users": {
    users: User[];
  };
  "/words": {
    words: Word[];
  };
};

export type PromiseOrNot<T> = T | Promise<T>;

export type ScheduleCallback<T> = (result: Awaited<T>) => PromiseOrNot<void | (() => PromiseOrNot<void>)>;
