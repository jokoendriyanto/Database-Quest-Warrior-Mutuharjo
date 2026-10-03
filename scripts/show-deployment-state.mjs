import { readFileSync } from "node:fs";
const lines = readFileSync("node_modules/convex/dist/cli.bundle.cjs", "utf8").split("\n");
for (let j = 119770; j < 119830; j++) {
  console.log(`${j + 1} ${lines[j].slice(0, 150)}`);
}
console.log("=== doCodegen signature ===");
for (let j = 118920; j < 118975; j++) {
  console.log(`${j + 1} ${lines[j].slice(0, 150)}`);
}
