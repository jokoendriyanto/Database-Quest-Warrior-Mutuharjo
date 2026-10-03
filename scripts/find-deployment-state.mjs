import { readFileSync } from "node:fs";
const lines = readFileSync("node_modules/convex/dist/cli.bundle.cjs", "utf8").split("\n");
lines.forEach((line, i) => {
  if (line.includes("Downloading current deployment state") || line.includes("anonymous")) {
    if (line.toLowerCase().includes("anonymous") && !/anonymousDeployment|isAnonymous|anonymous dev/i.test(line)) {
      // still print, filter happens below
    }
    console.log(`${i + 1}: ${line.trim().slice(0, 160)}`);
  }
});
