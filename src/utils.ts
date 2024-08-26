import dayjs from "dayjs";
import chalk from "chalk";
import { stdout } from "process";

export const log = (...message: any[]) => {
  stdout.write(`${`${chalk.dim(dayjs().format())}`} ${message.join(" ")}\n`);
};

export const random = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
};
