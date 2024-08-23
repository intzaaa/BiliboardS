import dayjs from "dayjs";

export const log = (...message: any[]) => {
  console.log(`[${dayjs().format()}]`, ...message);
};

export const boolean = (value: any) => {
  switch (String(value).toLowerCase()) {
    case "1":
    case "true":
      return true;
    case "0":
    case "false":
      return false;
    default:
      return false;
  }
};

export const add_sign = (value: any) => {
  const number = Number(value);
  if (number > 0) return `+${number}`;
  return number.toString();
};

export function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}
