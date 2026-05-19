# Live Every Day GCP Infrastructure Plan

Status: planning only. Do not implement resources from this document without a separate implementation pass.

Target project: `live-every-day-dev`

Primary goals:

- Run the public NestJS API on Cloud Run.
- Run PostgreSQL on Cloud SQL.
- Host the React/Vite web application on Firebase Hosting.
- Run Drizzle migrations through a controlled Cloud Run Job.
- Deploy from GitHub Actions using Pulumi and keyless GCP authentication.
- Leave `apps/mobile` untouched for this phase. Mobile will consume the public API later, but no mobile infrastructure or code changes are in scope here.

## Current Repo Facts

- Monorepo: pnpm workspaces + Turborepo.
- API package: `apps/api`, NestJS, listens on `process.env.PORT ?? 3000`.
- API health endpoint: `GET /api/health`.
- Web package: `apps/web`, Vite, reads `VITE_API_URL`.
- Database package: `packages/database`, Drizzle migrations in `packages/database/drizzle`.
- Existing migration command: `pnpm --filter database db:migrate`.
- Runtime database env:
  - `DATABASE_URL`
  - `DB_SSL`
  - `DB_SSL_REJECT_UNAUTHORIZED`
  - `DB_POOL_MAX`
- Auth/CORS env:
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_TRUSTED_ORIGINS`
  - `CORS_ORIGIN`
  - optional OAuth secrets such as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- There are currently no Dockerfiles, Pulumi project files, `infra/` directory, or GitHub Actions workflows.

## Best-Practice Decisions

### Infrastructure as Code

Use Pulumi TypeScript in a new root-level `infra/` package.

Recommended shape:

```txt
infra/
  Pulumi.yaml
  Pulumi.dev.yaml
  package.json
  tsconfig.json
  src/
    index.ts
    config.ts
    apis.ts
    network.ts
    artifact-registry.ts
    iam.ts
    secrets.ts
    cloud-sql.ts
    cloud-run-api.ts
    cloud-run-migrations.ts
    firebase-hosting.ts
    monitoring.ts
```

Pulumi should own stable infrastructure and configuration. For frequently changing app image tags, prefer one of these two patterns:

1. Recommended for operational safety: Pulumi owns Cloud Run service/job configuration but ignores container image drift. GitHub Actions updates the migration job image, executes migrations, then updates the API service image.
2. Stricter desired-state option: Pulumi owns the image tag and the deploy workflow runs in two phases, first updating/executing the migration job, then updating the service. This needs careful stack config and targets to avoid serving a new API before migrations finish.

For this repo, pattern 1 is simpler and safer because it preserves migration ordering.

Pulumi implementation guardrails:

- Use resource-level IAM where practical.
- Prefer additive IAM resources such as `ProjectIamMember` over authoritative project-wide bindings unless the code is intentionally managing the full binding.
- Protect critical resources, especially production Cloud SQL instances.
- Avoid `deleteBeforeReplace` on databases and networking resources.
- Use stable resource names and Pulumi aliases when renaming resources later.

### GCP Region

Use one default region per environment. Recommended initial value: `us-central1`.

All regional resources should use the same region unless there is a specific latency or compliance requirement:

- Cloud Run service
- Cloud Run job
- Artifact Registry repository
- Cloud SQL instance
- VPC subnet for serverless egress

### Web Hosting

Deploy the Vite SPA to Firebase Hosting. Do not deploy the web app to Cloud Run.

- Build static assets with `pnpm --filter web build`.
- Publish the built `apps/web/dist` directory to Firebase Hosting.
- Use the generated Firebase Hosting domains until a custom domain is available:
  - `https://live-every-day-dev.web.app`
  - `https://live-every-day-dev.firebaseapp.com`
- Add a custom domain later when one is purchased.
- Set cache headers:
  - hashed assets: long-lived immutable cache
  - `index.html`: no-cache or very short TTL
- Configure SPA rewrites so application routes resolve to `index.html`.
- Keep Firebase Hosting configuration in source control, for example:
  - `firebase.json`
  - `.firebaserc`
- Use Pulumi to enable Firebase for the GCP project and create/import the default Hosting site.
- Use the Firebase CLI in GitHub Actions for content deploys:

```sh
firebase deploy --only hosting --project live-every-day-dev
```

Recommended `firebase.json` shape:

```json
{
  "hosting": {
    "site": "live-every-day-dev",
    "public": "apps/web/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "/index.html",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/assets/**",
        "headers": [{ "key": "Cache-Control", "value": "public,max-age=31536000,immutable" }]
      }
    ],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### API Hosting

Run the NestJS API as a public Cloud Run service.

Recommended API service settings:

- Ingress: public internet.
- Authentication: allow unauthenticated Cloud Run invocations because service-layer auth handles application access.
- Runtime service account: dedicated `api-runtime` service account.
- Health/startup probe: `GET /api/health`.
- Min instances:
  - dev: `0`
  - prod: `1` or more after traffic requires it
- Max instances: start low and tune based on Cloud SQL connection capacity.
- Concurrency: start with Cloud Run default or a moderate explicit value; tune with latency and DB connection metrics.
- Timeout: set explicitly, for example 30s for normal API traffic.
- CPU/memory: start conservatively, for example 1 CPU and 512Mi/1Gi memory, then tune from metrics.
- Environment:
  - plain env for non-secret config (`NODE_ENV`, `DB_POOL_MAX`, `CORS_ORIGIN`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`)
  - Secret Manager references for secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`, OAuth client secrets)

Cloud Run should use a dedicated runtime service account with only the permissions it needs.

### Cloud SQL

Use Cloud SQL for PostgreSQL with private connectivity from Cloud Run.

Recommended settings:

- PostgreSQL major version: match local as closely as Cloud SQL supports; local Docker uses Postgres 16, so choose Cloud SQL PostgreSQL 16 unless a newer project standard is adopted.
- Public IP: disabled.
- Private IP: enabled through the project VPC.
- Backups: enabled.
- Point-in-time recovery: enabled for production; acceptable for dev if cost is acceptable.
- Deletion protection:
  - dev: optional but recommended once real data exists
  - prod: required
- Availability:
  - dev: zonal, low tier
  - prod: regional HA
- Storage: SSD with auto-resize.
- Maintenance window: explicitly configured.
- Query Insights: enabled for production.

Connection strategy:

- Prefer Cloud SQL private IP with Cloud Run Direct VPC egress where available.
- Use a Serverless VPC Access connector only if Direct VPC egress is not available or a specific network topology requires it.
- With private IP, construct `DATABASE_URL` using the Cloud SQL private address or private DNS name, and keep `DB_SSL` unset/false unless SSL is explicitly configured for that connection path.
- Keep `DB_POOL_MAX` low at first. Cloud Run can scale horizontally, so per-instance connection pools multiply quickly.

Database credentials:

- Create an application database and least-privilege application user.
- Store the password and/or full `DATABASE_URL` in Secret Manager.
- Grant Secret Manager access only to `api-runtime` and `migration-runtime`.
- Do not use the built-in `postgres` user for app traffic.

### Drizzle Migrations

Run migrations as a Cloud Run Job, not inside API startup.

Recommended job settings:

- Dedicated service account: `migration-runtime`.
- Same image family as the API or a dedicated migration image.
- Command: a production-safe migration command.
- Task count: `1`.
- Parallelism: `1`.
- Retries: `0` or `1`; avoid retry storms.
- Timeout: explicit, for example 10 minutes.
- No public ingress; jobs are invoked by CI or an operator.

Important implementation note:

The current command uses `drizzle-kit migrate`, which is a dev dependency and reads TypeScript config. For a production-grade container, add a compiled migration runner in `packages/database` using Drizzle's migrator and ship only compiled JS plus the `drizzle/` SQL folder. Then the job can run something like:

```sh
node packages/database/dist/migrate.js
```

Migration ordering:

1. Build and push the new image.
2. Update the Cloud Run migration job to use that image.
3. Execute the migration job and wait for completion.
4. Only after success, update the API Cloud Run service to the same image.

Schema-change discipline:

- Prefer backward-compatible migrations.
- For breaking changes, use expand/migrate/contract:
  - add new schema in one deploy
  - deploy code that supports old and new schema
  - backfill if needed
  - remove old schema in a later deploy
- Never run seed scripts automatically against shared dev, staging, or production databases.

### Docker Images

Add Dockerfiles without changing app code behavior.

Recommended files:

```txt
docker/api.Dockerfile
.dockerignore
```

API image requirements:

- Use a supported Node LTS base image.
- Use Corepack/pnpm.
- Install dependencies with lockfile.
- Build only needed packages:
  - `database`
  - `@led/conditions`
  - `api`
- Copy Drizzle migrations into the image if the migration job uses the API image.
- Run as a non-root user.
- Start command: `node apps/api/dist/main.js` or the actual compiled path produced by Nest.
- Listen on `$PORT`.

Image tagging:

- Push to Artifact Registry.
- Use immutable SHA tags, for example:
  - `${REGION}-docker.pkg.dev/${PROJECT_ID}/live-every-day/api:${GITHUB_SHA}`
  - optional human tag: `dev-latest`
- Do not deploy mutable tags as the source of truth.

### Artifact Registry

Create one regional Docker repository per environment or a shared repository with environment labels.

Recommended initial repo:

```txt
live-every-day
```

Enable cleanup policies:

- Keep recent deployed images.
- Delete old untagged images after a retention window.

### Secrets

Use Secret Manager for runtime secrets.

Initial secrets:

- `led-dev-database-url`
- `led-dev-better-auth-secret`
- `led-dev-google-client-secret` if Google OAuth is enabled
- `led-dev-github-client-secret` if GitHub OAuth is enabled

Non-secret but environment-specific config can live in Pulumi stack config:

- API URL
- web URL
- CORS origins
- trusted auth origins
- DB pool size
- Cloud Run sizing

Pulumi stack files must not contain plaintext secrets. Use Pulumi encrypted config or Secret Manager resources.

### IAM

Use separate service accounts:

- `api-runtime`: Cloud Run API runtime identity.
- `migration-runtime`: Cloud Run migration job identity.
- `github-deploy`: GitHub Actions deploy identity through Workload Identity Federation.
- optional `pulumi-bootstrap`: one-time bootstrap identity if not using a human owner/admin account for the first run.

Runtime permissions:

- `api-runtime`
  - Secret Manager accessor only on required runtime secrets.
  - Cloud SQL client permission if using the Cloud SQL connector path; private IP alone may not require it, but granting `roles/cloudsql.client` is common and low-risk for this service account.
- `migration-runtime`
  - Same database secret access as API.
  - Cloud SQL client permission if needed.

Deploy permissions:

- Avoid JSON service account keys.
- Use GitHub OIDC through GCP Workload Identity Federation.
- Bind the GitHub deploy service account only to the target repository, branch, and environment where practical.
- Start with project-level deploy roles for dev, then tighten to resource-level IAM where Pulumi supports it.

Likely dev deploy roles:

- Service Usage Admin, only for bootstrap/API enablement.
- Artifact Registry Admin or Writer.
- Cloud Run Admin.
- Firebase Hosting Admin.
- Firebase Admin, only if the deploy identity is responsible for enabling Firebase on the project.
- Cloud SQL Admin.
- Secret Manager Admin.
- Service Account Admin.
- Service Account User on runtime service accounts.
- Compute Network Admin for VPC and private service access resources.
- Project IAM Admin may be needed during bootstrap if Pulumi manages IAM bindings. Prefer a one-time bootstrap step and remove this from steady-state deploy if possible.

### GitHub Actions

Use two workflows initially.

PR checks workflow:

```txt
.github/workflows/pr-checks.yml
```

Run on pull requests:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- optional Docker build without push

Deploy dev workflow:

```txt
.github/workflows/deploy-dev.yml
```

Run on push to `main` and manual dispatch:

1. Check out code.
2. Install Node/pnpm.
3. Run targeted checks:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
4. Authenticate to GCP with Workload Identity Federation.
5. Configure Docker auth for Artifact Registry.
6. Build API image.
7. Push API image with `${GITHUB_SHA}` tag.
8. Run `pulumi up` for stable infra changes.
9. Update migration job image.
10. Execute migration job and wait for success.
11. Update API Cloud Run service image.
12. Build web app with `VITE_API_URL` pointing at the deployed API URL.
13. Deploy web assets:
    - deploy `apps/web/dist` to Firebase Hosting
    - rely on Firebase Hosting cache headers and release versioning
14. Smoke test:
    - `GET https://api.../api/health`
    - `GET https://app.../`

Workflow security:

- Set minimal workflow permissions:
  - `contents: read`
  - `id-token: write` only for deploy jobs needing OIDC
- Pin third-party actions to a trusted major version at minimum; pin to commit SHA for stricter supply-chain control.
- Add Dependabot updates for GitHub Actions.
- Use GitHub Environments:
  - `dev` for automatic deploys
  - future `prod` with required reviewers
- Add concurrency so only one deploy per environment runs at a time.
- Do not store GCP service account keys in GitHub secrets.
- Keep `PULUMI_ACCESS_TOKEN` in GitHub environment secrets unless using a self-managed Pulumi backend.

### Pulumi State Backend

Recommended: Pulumi Cloud for the initial implementation.

Reasons:

- Built-in encrypted config.
- Straightforward GitHub Actions integration.
- Stack history and previews.

Alternative: GCS backend. If using GCS:

- Create the state bucket in a manual bootstrap step.
- Enable object versioning.
- Restrict IAM tightly.
- Decide how Pulumi secrets are encrypted, preferably with Cloud KMS.

### DNS And Domains

Use explicit hostnames for stable auth/cookie behavior:

- API: `api.dev.liveeveryday.com`
- Web initially: `https://live-every-day-dev.web.app`
- Web later: `https://app.dev.liveeveryday.com`

Configure:

- `BETTER_AUTH_URL` should use the active API URL. Before owning a domain, use the generated Cloud Run `*.run.app` URL.
- `CORS_ORIGIN=https://live-every-day-dev.web.app`
- `BETTER_AUTH_TRUSTED_ORIGINS=https://live-every-day-dev.web.app`
- mobile app origins later, but no mobile work in this phase

After buying a domain, update `BETTER_AUTH_URL`, `CORS_ORIGIN`, and `BETTER_AUTH_TRUSTED_ORIGINS` to the custom API and web hostnames.

### Monitoring And Operations

Add baseline observability with Pulumi:

- Cloud Run 5xx alert.
- Cloud Run high latency alert.
- Cloud Run job failure alert for migrations.
- Cloud SQL CPU alert.
- Cloud SQL storage utilization alert.
- Cloud SQL connection utilization alert.
- Uptime check for `/api/health`.

Operational runbooks to add after first deploy:

- rollback API to previous image SHA
- rerun migration job
- restore Cloud SQL backup to a new instance
- rotate DB password and update Secret Manager
- rotate Better Auth secret if needed

### Required GCP APIs

Enable these APIs through Pulumi or a one-time bootstrap:

- `artifactregistry.googleapis.com`
- `run.googleapis.com`
- `sqladmin.googleapis.com`
- `secretmanager.googleapis.com`
- `iam.googleapis.com`
- `iamcredentials.googleapis.com`
- `cloudresourcemanager.googleapis.com`
- `serviceusage.googleapis.com`
- `compute.googleapis.com`
- `servicenetworking.googleapis.com`
- `firebase.googleapis.com`
- `firebasehosting.googleapis.com`
- `certificatemanager.googleapis.com` later if using managed certificates for API custom domains
- `monitoring.googleapis.com`
- `logging.googleapis.com`

## Implementation Phases

### Phase 0: Confirm Deployment Inputs

Decide and record:

- GCP region.
- API hostname.
- Firebase Hosting site ID and active web hostname.
- Pulumi backend.
- initial Cloud SQL tier for dev.
- GitHub org/repo exact slug for Workload Identity Federation attribute conditions.

### Phase 1: Repo Scaffolding

Create:

- `infra/` Pulumi TypeScript project.
- Dockerfiles.
- `.dockerignore`.
- compiled database migration runner.
- GitHub workflow files.

Do not modify `apps/mobile`.

### Phase 2: Bootstrap GCP

In the blank `live-every-day-dev` project:

1. Set billing manually if not already attached.
2. Run one-time Pulumi bootstrap with a human/admin account or bootstrap service account.
3. Enable APIs.
4. Create Workload Identity Pool and Provider for GitHub.
5. Create deploy and runtime service accounts.
6. Create Artifact Registry.
7. Enable Firebase on the GCP project and create/import the default Firebase Hosting site.
8. Create VPC/private service access foundations.

After bootstrap, remove broad bootstrap-only permissions where possible.

### Phase 3: Provision Core Resources

With Pulumi:

- Create VPC/subnet/private service access.
- Create Cloud SQL instance, database, and app user.
- Create Secret Manager secrets.
- Create Cloud Run API service.
- Create Cloud Run migration job.
- Create or configure Firebase Hosting resources, including the default Hosting site.
- Create monitoring policies.

### Phase 4: First Manual Deploy

Before enabling automatic deploys:

1. Build API image locally or from a manually triggered workflow.
2. Push image to Artifact Registry.
3. Run `pulumi up`.
4. Update and execute the migration job.
5. Deploy the API image.
6. Deploy web assets to Firebase Hosting.
7. Verify health and basic auth flow.

### Phase 5: Automated Dev Deploy

Enable `deploy-dev.yml`.

Acceptance criteria:

- A push to `main` builds and pushes an image.
- Migration job runs once and succeeds before API image update.
- API `/api/health` returns success.
- web app loads and calls the deployed API URL.
- GitHub Actions uses OIDC, not a JSON key.

### Phase 6: Production Hardening Later

Before production:

- Add separate `prod` Pulumi stack and GCP project.
- Use regional HA Cloud SQL.
- Require GitHub Environment approval for prod deploys.
- Enable deletion protection on critical resources.
- Add backup restore drill.
- Add custom domains.
- Add alert routing to email/Slack/PagerDuty.
- Add load and connection-pool testing.

## Open Questions

- What exact domain should dev use?
- Is Pulumi Cloud acceptable, or should state live in a GCS backend?
- Which OAuth providers are required for dev at launch?
- Do we want separate GCP projects for `dev`, `staging`, and `prod` now, or start with `dev` only?

## Reference Material

Official docs used for this plan:

- Cloud Run: https://cloud.google.com/run/docs
- Cloud Run services and public access: https://cloud.google.com/run/docs/securing/managing-access
- Cloud Run service identity: https://cloud.google.com/run/docs/securing/service-identity
- Cloud Run jobs: https://cloud.google.com/run/docs/create-jobs
- Cloud Run Direct VPC egress: https://cloud.google.com/run/docs/configuring/vpc-direct-vpc
- Cloud Run and Cloud SQL: https://cloud.google.com/sql/docs/postgres/connect-run
- Cloud SQL PostgreSQL best practices: https://cloud.google.com/sql/docs/postgres/best-practices
- Cloud SQL backups and PITR: https://cloud.google.com/sql/docs/postgres/backup-recovery/backups
- Artifact Registry: https://cloud.google.com/artifact-registry/docs
- Secret Manager: https://cloud.google.com/secret-manager/docs
- Firebase Hosting: https://firebase.google.com/docs/hosting
- Firebase Hosting custom domains: https://firebase.google.com/docs/hosting/custom-domain
- GitHub Actions OIDC: https://docs.github.com/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- GitHub Actions workflow permissions: https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions#permissions
- Google GitHub Actions auth: https://github.com/google-github-actions/auth
- Pulumi GCP provider: https://www.pulumi.com/registry/packages/gcp/
- Pulumi Firebase project resource: https://www.pulumi.com/registry/packages/gcp/api-docs/firebase/project/
- Pulumi Firebase Hosting site resource: https://www.pulumi.com/registry/packages/gcp/api-docs/firebase/hostingsite/
- Pulumi GitHub Actions: https://www.pulumi.com/docs/iac/using-pulumi/continuous-delivery/github-actions/
- Pulumi secrets: https://www.pulumi.com/docs/iac/concepts/secrets/
