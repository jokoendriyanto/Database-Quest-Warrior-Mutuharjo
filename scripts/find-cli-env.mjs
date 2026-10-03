// Prints only line numbers where .env loading happens in the CLI bundle (no content).
import { readFileSync } from "node:fs";
const lines = readFileSync("node_modules/convex/dist/cli.bundle.cjs", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(".env") || lines[i].includes("dotenv")) {
    console.log(`${i + 1}: ${lines[i].slice(0, 160)}`);
  }
}
