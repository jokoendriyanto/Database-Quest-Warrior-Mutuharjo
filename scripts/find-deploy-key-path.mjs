// Prints line numbers + snippets around processDeployKeyValue and readDeployKeyFromEnv.
import { readFileSync } from "node:fs";
const lines = readFileSync("node_modules/convex/dist/cli.bundle.cjs", "utf8").split("\n");
const patterns = ["function processDeployKeyValue", "function readDeployKeyFromEnv", "readDeployKeyFromEnv(", "processDeployKeyValue("];
const seen = new Set();
lines.forEach((line, i) => {
  for (const p of patterns) {
    if (line.includes(p)) {
      const key = `${i + 1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`--- line ${i + 1} ---`);
      for (let j = Math.max(0, i - 4); j <= Math.min(lines.length - 1, i + 8); j++) {
        console.log(`${j + 1}${j + 1 === i + 1 ? ">" : " "} ${lines[j].slice(0, 150)}`);
      }
      console.log("");
    }
  }
});
