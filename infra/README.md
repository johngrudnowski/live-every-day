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
