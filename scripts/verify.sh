#!/usr/bin/env bash
# "Done" means this script exits 0: lint, format, types, both suites, docs-to-tests traceability.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run lint
npm run format
npm run typecheck
npm run test:api
npm run test:e2e
npm run traceability
