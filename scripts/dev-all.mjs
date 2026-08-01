import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["scripts/dev.mjs"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "watch", "server/index.ts"], {
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill(signal);
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!shuttingDown && code) {
      shutdown();
      process.exitCode = code;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
