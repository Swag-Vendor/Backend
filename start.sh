#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -f .env ]; then
  echo "Backend/.env is missing (needs DATABASE_URL and JWT_SECRET). Aborting." >&2
  exit 1
fi

bun install
bun run db:push
exec bun run start
