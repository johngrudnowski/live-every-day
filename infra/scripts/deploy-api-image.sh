#!/usr/bin/env bash

set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

IMAGE_URI="${1:-${IMAGE_URI:-}}"
[[ -n "$IMAGE_URI" ]] || die "set IMAGE_URI or pass an image URI as the first argument"

update_migration_job_image "$IMAGE_URI"
execute_migration_job
update_api_service_image "$IMAGE_URI"

printf '%s\n' "$IMAGE_URI"
