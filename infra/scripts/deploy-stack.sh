#!/usr/bin/env bash

set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

ACTION="${1:-up}"

case "$ACTION" in
  preview | up)
    ;;
  deploy | apply)
    ACTION="up"
    ;;
  *)
    die "usage: $0 [preview|up]"
    ;;
esac

require_cmd pnpm
require_cmd pulumi

if [[ "${SKIP_TYPECHECK:-0}" != "1" ]]; then
  log "Typechecking infra"
  pnpm --dir "$INFRA_DIR" typecheck
fi

pulumi_args=(--stack "$STACK")

if [[ "$ACTION" == "up" && ("${CI:-}" == "true" || "${PULUMI_YES:-0}" == "1") ]]; then
  pulumi_args+=(--yes)
fi

log "Running pulumi $ACTION for stack $STACK"
pulumi --cwd "$INFRA_DIR" "$ACTION" "${pulumi_args[@]}"
