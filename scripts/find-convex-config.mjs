// Lists Convex-related config files and prints only their KEY NAMES (never values).
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const candidates = [
  ".convex",
  ".convex/config.local",
  ".convexconfig",
  "convex.json",
  "convex/_config.json",
];
for (const p of candidates) {
  if (existsSync(p)) {
    console.log(`FOUND: ${p}`);
    try {
      const raw = readFileSync(p, "utf8");
      const json = JSON.parse(raw);
      console.log(`  keys: ${Object.keys(json).join(", ")}`);
    } catch {
      console.log(`  (not JSON, ${raw.length} chars)`);
    }
  } else {
    console.log(`absent: ${p}`);
  }
}
const home = homedir();
for (const p of [`${home}/.convexconfig`, `${home}/.convex/config.local`, `${home}/.config/convex`]) {
  console.log(`${existsSync(p) ? "FOUND" : "absent"}: ${p}`);
}
