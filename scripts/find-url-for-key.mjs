// Prints line numbers + short snippets around each url_for_key occurrence.
import { readFileSync } from "node:fs";
const lines = readFileSync("node_modules/convex/dist/cli.bundle.cjs", "utf8").split("\n");
lines.forEach((line, i) => {
  if (line.includes("url_for_key")) {
    console.log(`--- line ${i + 1} ---`);
    for (let j = Math.max(0, i - 6); j <= Math.min(lines.length - 1, i + 6); j++) {
      console.log(`${j + 1}${j + 1 === i + 1 ? ">" : " "} ${lines[j].slice(0, 140)}`);
    }
  }
});
