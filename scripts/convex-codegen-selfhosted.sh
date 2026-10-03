#!/usr/bin/env bash
# Helper: run Convex codegen against the self-hosted backend.
# Unsets every Convex cloud credential, then sets self-hosted credentials.
set -euo pipefail

unset CONVEX_DEPLOY_KEY CONVEX_DEPLOYMENT_TOKEN CONVEX_DEPLOYMENT CONVEX_SITE_URL VITE_CONVEX_URL || true

export CONVEX_SELF_HOSTED_URL="${CONVEX_SELF_HOSTED_URL_OVERRIDE:-http://backend-cqia0bl46qbjo0apn1r2nma9.103.177.94.179.sslip.io:3210}"

# Admin key TIDAK boleh disimpan di repo. Ambil dari environment:
#   export CONVEX_SELF_HOSTED_ADMIN_KEY='self-hosted-convex|<key>'
if [ -z "${CONVEX_SELF_HOSTED_ADMIN_KEY:-}" ]; then
  echo "Error: CONVEX_SELF_HOSTED_ADMIN_KEY belum di-set." >&2
  echo "Salin nilainya dari dashboard backend self-hosted, lalu export:" >&2
  echo "  export CONVEX_SELF_HOSTED_ADMIN_KEY='self-hosted-convex|<key>'" >&2
  exit 1
fi

exec bunx convex codegen --typecheck disable "$@"
