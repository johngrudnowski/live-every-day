#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd -- "${INFRA_DIR}/.." && pwd)"
STACK="${PULUMI_STACK:-dev}"

log() {
  printf '\n==> %s\n' "$*" >&2
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

pulumi_output() {
  pulumi --cwd "$INFRA_DIR" stack output "$1" --stack "$STACK"
}

default_image_tag() {
  if [[ -n "${API_IMAGE_TAG:-}" ]]; then
    printf '%s\n' "$API_IMAGE_TAG"
    return
  fi

  if [[ -n "${GITHUB_SHA:-}" ]]; then
    printf '%s\n' "$GITHUB_SHA"
    return
  fi

  if [[ -n "${CI_COMMIT_SHA:-}" ]]; then
    printf '%s\n' "$CI_COMMIT_SHA"
    return
  fi

  if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git -C "$REPO_ROOT" diff --quiet && git -C "$REPO_ROOT" diff --cached --quiet; then
      git -C "$REPO_ROOT" rev-parse --short=12 HEAD
      return
    fi
  fi

  date -u +manual-%Y%m%d%H%M%S
}

api_image_uri() {
  local tag="${1:-$(default_image_tag)}"
  local image_name="${API_IMAGE_NAME:-$(pulumi_output apiImageName)}"

  [[ -n "$tag" ]] || die "image tag is empty"
  printf '%s:%s\n' "$image_name" "$tag"
}

write_image_env_file() {
  local image_uri="$1"

  if [[ -n "${OUTPUT_ENV_FILE:-}" ]]; then
    printf 'IMAGE_URI=%s\nAPI_IMAGE_URI=%s\n' "$image_uri" "$image_uri" >"$OUTPUT_ENV_FILE"
    log "Wrote image URI to $OUTPUT_ENV_FILE"
  fi

  if [[ -n "${GITHUB_ENV:-}" ]]; then
    printf 'IMAGE_URI=%s\nAPI_IMAGE_URI=%s\n' "$image_uri" "$image_uri" >>"$GITHUB_ENV"
    log "Appended image URI to GITHUB_ENV"
  fi

  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    printf 'image_uri=%s\napi_image_uri=%s\n' "$image_uri" "$image_uri" >>"$GITHUB_OUTPUT"
    log "Appended image URI to GITHUB_OUTPUT"
  fi
}

configure_docker_auth() {
  local image_uri="$1"
  local registry_host="${image_uri%%/*}"

  require_cmd gcloud
  log "Configuring Docker auth for $registry_host"
  gcloud auth configure-docker "$registry_host" --quiet
}

build_api_image() {
  local image_uri="$1"

  require_cmd docker
  log "Building API image $image_uri"
  docker build --pull -f "$REPO_ROOT/docker/api.Dockerfile" -t "$image_uri" "$REPO_ROOT"
}

push_api_image() {
  local image_uri="$1"

  require_cmd docker
  log "Pushing API image $image_uri"
  docker push "$image_uri"
}

load_cloud_run_context() {
  require_cmd pulumi

  PROJECT="${GCP_PROJECT:-$(pulumi_output gcpProject)}"
  REGION="${GCP_REGION:-$(pulumi_output gcpRegion)}"
  API_SERVICE_NAME="${API_SERVICE_NAME:-$(pulumi_output apiServiceName)}"
  MIGRATION_JOB_NAME="${MIGRATION_JOB_NAME:-$(pulumi_output migrationJobName)}"

  export PROJECT REGION API_SERVICE_NAME MIGRATION_JOB_NAME
}

update_migration_job_image() {
  local image_uri="$1"

  require_cmd gcloud
  load_cloud_run_context
  log "Updating migration job $MIGRATION_JOB_NAME to $image_uri"
  gcloud run jobs update "$MIGRATION_JOB_NAME" \
    --image "$image_uri" \
    --project "$PROJECT" \
    --region "$REGION"
}

execute_migration_job() {
  require_cmd gcloud
  load_cloud_run_context
  log "Executing migration job $MIGRATION_JOB_NAME"
  gcloud run jobs execute "$MIGRATION_JOB_NAME" \
    --wait \
    --project "$PROJECT" \
    --region "$REGION"
}

update_api_service_image() {
  local image_uri="$1"

  require_cmd gcloud
  load_cloud_run_context
  log "Updating API service $API_SERVICE_NAME to $image_uri"
  gcloud run services update "$API_SERVICE_NAME" \
    --image "$image_uri" \
    --project "$PROJECT" \
    --region "$REGION"
}
