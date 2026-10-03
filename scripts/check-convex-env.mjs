// Prints only PRESENCE (true/false) of Convex env vars — never values.
const keys = [
  "CONVEX_DEPLOY_KEY",
  "CONVEX_DEPLOYMENT_TOKEN",
  "CONVEX_DEPLOYMENT",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_URL",
];
for (const k of keys) {
  console.log(`${k}=${process.env[k] !== undefined ? "SET" : "unset"}`);
}
