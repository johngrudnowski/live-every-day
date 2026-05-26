# Live Every Day Infrastructure

Pulumi TypeScript project for the `live-every-day-dev` GCP environment.

Pulumi owns stable cloud resources. API image rollout is handled by scripts so
the same ordered workflow can be run locally or from GitHub Actions:

1. Build and push an immutable API image.
2. Point the Cloud Run migration job at that image.
3. Execute migrations and wait for success.
4. Point the Cloud Run API service at that image.

The stack intentionally keeps `ignoreImageChanges` enabled so routine Pulumi
updates do not roll Cloud Run back to an older image tag.

## Required Tools

- `pnpm`
- `pulumi`
- `gcloud`
- `docker`

Authenticate locally with Application Default Credentials:

```sh
gcloud auth application-default login
gcloud auth application-default set-quota-project live-every-day-dev
```

If ADC is not configured, a short-lived token also works for Pulumi:

```sh
export GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)"
export GOOGLE_CLOUD_QUOTA_PROJECT=live-every-day-dev
pulumi --cwd infra preview --stack dev
```

## Main Commands

Run these from the repository root. `PULUMI_STACK` defaults to `dev`.

```sh
pnpm infra:typecheck
pnpm infra:preview
pnpm infra:deploy
```

Publish a new API image:

```sh
API_IMAGE_TAG="$(git rev-parse --short=12 HEAD)" pnpm infra:publish:api
```

The publish command prints the full image URI, for example:

```sh
us-central1-docker.pkg.dev/live-every-day-dev/live-every-day/api:<tag>
```

Run migrations against the currently configured migration job image:

```sh
pnpm infra:migrate:api
```

Run migrations against a specific image:

```sh
IMAGE_URI="us-central1-docker.pkg.dev/live-every-day-dev/live-every-day/api:<tag>" pnpm infra:migrate:api
```

Deploy a specific API image safely. This updates the migration job, executes it,
then updates the API service only after migrations succeed:

```sh
IMAGE_URI="us-central1-docker.pkg.dev/live-every-day-dev/live-every-day/api:<tag>" pnpm infra:deploy:api
```

Build, push, migrate, and deploy in one local command:

```sh
API_IMAGE_TAG="$(git rev-parse --short=12 HEAD)" pnpm infra:release:api
```

## Script Layout

Operational workflows live in `infra/scripts`:

- `deploy-stack.sh` typechecks and runs `pulumi preview` or `pulumi up`.
- `publish-api-image.sh` builds and pushes the API Docker image.
- `run-migrations.sh` executes the Cloud Run migration job.
- `deploy-api-image.sh` updates the migration job, runs migrations, then updates the API service.
- `release-api.sh` combines publish, migrate, and deploy.

This is the right place for these workflows because they orchestrate tools
around Pulumi (`docker`, `gcloud`, and `pulumi`) rather than defining cloud
resources. GitHub Actions should call these scripts through the pnpm commands
instead of duplicating deployment logic in workflow YAML.

Useful environment variables:

- `PULUMI_STACK`: Pulumi stack name, default `dev`.
- `API_IMAGE_TAG`: image tag to publish, default `CI_COMMIT_SHA`, the local git SHA for a clean worktree, or `manual-<timestamp>` for a dirty worktree.
- `IMAGE_URI`: full image URI for migration/deployment commands.
- `OUTPUT_ENV_FILE` or `GITLAB_ENV_FILE`: write `IMAGE_URI` and `API_IMAGE_URI` dotenv output for CI.
- `GCP_PROJECT`, `GCP_REGION`, `API_SERVICE_NAME`, `MIGRATION_JOB_NAME`: override Pulumi stack outputs when needed.
- `SKIP_TYPECHECK=1`: skip infra typecheck in `deploy-stack.sh`.
- `PULUMI_YES=1`: pass `--yes` to `pulumi up`; this is automatic when `CI=true`.

## GitHub Actions Shape

GitHub Actions should authenticate to GCP, install dependencies, then call the same
commands used locally. A typical split is:

```sh
pnpm install --frozen-lockfile
pnpm infra:typecheck
pnpm infra:deploy
```

For an API release:

```sh
OUTPUT_ENV_FILE=image.env pnpm infra:publish:api
pnpm infra:deploy:api
```

In GitHub Actions, write `IMAGE_URI` to `$GITHUB_ENV` or `$GITHUB_OUTPUT` from
the image job so the deploy job receives the exact same image URI.

## Mobile / Expo CORS

The dev API allows browser requests from the hosted web app plus local Expo dev
servers. Configure comma-separated origins with `corsOrigins` (used for both
`CORS_ORIGIN` and `BETTER_AUTH_TRUSTED_ORIGINS`):

```sh
pulumi --cwd infra config set live-every-day-infra:corsOrigins \
  "https://live-every-day-dev.web.app,http://localhost:8081,http://localhost:19006" \
  --stack dev
pulumi --cwd infra up --stack dev
```

## OAuth Provider Config

Provider client IDs are non-secret Pulumi config. Provider client secrets live in Secret Manager.

```sh
pulumi --cwd infra config set live-every-day-infra:googleClientId "<google-client-id>" --stack dev
printf '%s' "$GOOGLE_CLIENT_SECRET" | gcloud secrets versions add led-dev-google-client-secret --project live-every-day-dev --data-file=-
pulumi --cwd infra up --stack dev
```
