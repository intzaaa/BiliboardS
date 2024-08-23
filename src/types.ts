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

export type PopularVideoResponse = {
  code: number;
  message: string;
  ttl: number;
  data: {
    list: {
      title: string;
      tname: string;
      owner: {
        mid: number;
        name: string;
        face: string;
      };
    }[];
  };
};

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
