#!/usr/bin/env bash
# "Done" means this script exits 0: lint, format, types fail fast; both suites, traceability and the P1 gate all run, a failure among them is the exit status.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run lint
npm run format
npm run typecheck

status=0
npm run test:api || status=$?
npm run test:e2e || status=$?
npm run traceability || status=$?
npm run report:scenarios || status=$?
exit "$status"
