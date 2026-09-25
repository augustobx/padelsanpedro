#!/bin/sh
set -eu

npx prisma db push --accept-data-loss
node scripts/bootstrap-platform.mjs
