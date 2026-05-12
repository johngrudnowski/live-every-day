# live-every-day

## Database stack

- ORM: Drizzle (`packages/database`)
- Driver: `postgres` (PostgreSQL)
- Auth tables: Better Auth-compatible Drizzle schema
- Local runtime: Docker Compose Postgres

## Quick start

1. Copy env values:
   - `cp .env.example .env`
2. Start Postgres:
   - `pnpm db:up`
3. Generate migration SQL from schema:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/live_every_day pnpm --filter database db:generate`
4. Apply migrations:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/live_every_day pnpm --filter database db:migrate`
5. Open Drizzle Studio (optional):
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/live_every_day pnpm --filter database db:studio`

## App development

- Run both apps with Turbo:
  - `pnpm dev`
- Run one app only:
  - API: `pnpm dev:api`
  - Web: `pnpm dev:web`
- Default local URLs:
  - API: `http://localhost:3000`
  - Web: `http://localhost:3001`
- Web auth client env:
  - `VITE_API_URL` (defaults to `http://localhost:3000`)

## Better Auth setup order

1. Bring up local Postgres.
2. Finalize Drizzle client and schema package.
3. Generate + apply migrations.
4. Wire API to shared DB package.
5. Configure Better Auth runtime against Drizzle adapter.

This order avoids auth setup drift and keeps auth/domain tables in one migration history.

## Better Auth (OAuth-only) notes

- Better Auth is mounted in API at `/auth/*`.
- Email/password is disabled for now (`emailAndPassword.enabled = false`).
- Web login screen uses Better Auth social sign-in buttons (Google/GitHub) against the API `/auth/*` routes.
- Configure at least one provider:
  - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
  - and/or `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`
- Required auth env vars:
  - `BETTER_AUTH_URL` (server base URL)
  - `BETTER_AUTH_SECRET` (long random secret)
  - `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated frontend origins)
  - `CORS_ORIGIN` (comma-separated frontend origins for Nest CORS)

## Cloud SQL cutover notes

- Keep using PostgreSQL dialect and `DATABASE_URL`.
- For Cloud SQL Auth Proxy, keep `DB_SSL=false` and point `DATABASE_URL` to proxy host/port.
- For direct Cloud SQL TLS, set `DB_SSL=true` (and keep `DB_SSL_REJECT_UNAUTHORIZED=true` unless you have a controlled reason to relax it).
- No Drizzle schema rewrite is required for local-to-Cloud SQL transition.