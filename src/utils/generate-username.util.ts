export default function generateUsername(): string {
  const charset: string[] = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."abcdefghijklmnopqrstuvwxyz",
    ..."0123456789",
    "_",
    "-",
    ".",
  ];

  const length = Math.floor(Math.random() * (12 - 7 + 1)) + 7;
  return "@nu" + Array.from({ length }, () => randomChoice(charset)).join("");
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
