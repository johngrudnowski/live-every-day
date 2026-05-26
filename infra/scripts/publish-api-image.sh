#!/usr/bin/env bash

set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

require_cmd pulumi

IMAGE_URI="${IMAGE_URI:-$(api_image_uri)}"

configure_docker_auth "$IMAGE_URI"
build_api_image "$IMAGE_URI"
push_api_image "$IMAGE_URI"
write_image_env_file "$IMAGE_URI"

printf '%s\n' "$IMAGE_URI"
