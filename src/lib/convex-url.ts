/**
 * Convex deployment URL — SINGLE SOURCE OF TRUTH.
 *
 * Full migration to our own Convex deployment (`whimsical-mouse-408`):
 * the published bundle must NOT follow `VITE_CONVEX_URL`, because the
 * build platform injects that variable pointing at its managed
 * deployment (hidden-shrimp-974), whose functions are broken.
 * Pinning here guarantees the app — preview AND production — always
 * talks to the healthy deployment we own.
 *
 * To switch deployments later (e.g. fresh start for a new school year),
 * change ONLY this constant and publish again.
 */
export const CONVEX_URL = "https://whimsical-mouse-408.convex.cloud";

if (!CONVEX_URL.startsWith("https://") || !CONVEX_URL.includes(".convex.cloud")) {
  // Fail loudly at load time instead of mysterious runtime errors.
  throw new Error(`Invalid CONVEX_URL configured: ${CONVEX_URL}`);
}
