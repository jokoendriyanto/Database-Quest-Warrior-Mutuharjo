import { readFileSync } from "node:fs";
const lines = readFileSync("node_modules/convex/dist/cli.bundle.cjs", "utf8").split("\n");
for (let j = 123937; j < 123999; j++) {
  console.log(`${j + 1} ${lines[j].slice(0, 160)}`);
}
