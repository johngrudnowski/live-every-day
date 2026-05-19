# Live Every Day Infrastructure

Pulumi TypeScript project for the `live-every-day-dev` GCP environment.

## Local Commands

```sh
pnpm --dir infra typecheck
pnpm --dir infra preview
pnpm --dir infra up
```

This project uses Application Default Credentials when available:

```sh
gcloud auth application-default login
gcloud auth application-default set-quota-project live-every-day-dev
```

If ADC is not configured, a short-lived token also works for local operations:

```sh
export GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)"
export GOOGLE_CLOUD_QUOTA_PROJECT=live-every-day-dev
pulumi --cwd infra preview --stack dev
```

## Manual API Deploy Shape

CI will eventually automate this ordering:

1. Build and push the API image.
2. Update the Cloud Run migration job to that image.
3. Execute the migration job and wait for success.
4. Update the Cloud Run API service to that image.

The current stack has `ignoreImageChanges` enabled so GitHub Actions can update image tags without Pulumi reverting them during unrelated infrastructure updates.

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
