#!/usr/bin/env bash

set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

IMAGE_URI="${1:-${IMAGE_URI:-}}"

if [[ -n "$IMAGE_URI" ]]; then
  update_migration_job_image "$IMAGE_URI"
fi

execute_migration_job
