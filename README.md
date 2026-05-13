# Live Every Day

Live Every Day is a TypeScript monorepo for the Live Every Day product. It includes a NestJS API, a React web app, an Expo mobile app, shared database schema, a generated API client, and a React Native design system.

## Repository Structure

```txt
apps/
  api/      NestJS API
  web/      React + Vite web app
  mobile/   Expo + React Native app

packages/
  database/       Drizzle schema and Postgres client
  api-client/     Orval-generated OpenAPI client
  design-system/  Shared React Native design tokens and primitives
```

## Tech Stack

- Package manager: `pnpm`
- Monorepo orchestration: Turborepo
- API: NestJS
- Web: React, Vite, Mantine
- Mobile: Expo, React Native, Expo Router
- Auth: Better Auth, Google OAuth
- Database: PostgreSQL, Drizzle ORM
- API client generation: OpenAPI + Orval

## Prerequisites

- Node.js `>=18`
- pnpm
- Docker, for local Postgres

This repo is configured with `mise.toml`, so you can also use `mise` to install the expected local toolchain.

## Local Setup

1. Install dependencies:

```sh
pnpm install
```

2. Create local environment values:

```sh
cp .env.example .env
```

3. Start Postgres:

```sh
pnpm db:up
```

4. Apply database migrations:

```sh
pnpm db:migrate
```

5. Start the apps:

```sh
pnpm dev
```

## Development Commands

Run the full stack:

```sh
pnpm dev
```

Run individual apps:

```sh
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

Default local URLs:

- API: `http://localhost:3000`
- Web: `http://localhost:3001`
- Expo dev server: `http://localhost:8081`
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

## Database

Local Postgres runs through Docker Compose.

```sh
pnpm db:up       # start Postgres
pnpm db:down     # stop services
pnpm db:reset    # reset local database volume
pnpm db:migrate  # apply migrations
pnpm db:studio   # open Drizzle Studio
```

Local database URL:

```txt
postgresql://postgres:postgres@localhost:5432/live_every_day
```

## API Client Generation

The shared API client is generated from the API OpenAPI document.

1. Start the API:

```sh
pnpm dev:api
```

2. Generate the client:

```sh
pnpm generate
```

Generated files are written to:

```txt
packages/api-client/src/generated
```

## Mobile App

The mobile app lives in `apps/mobile` and uses Expo Router, development builds, typed routes, and Continuous Native Generation.

Start the Expo dev server:

```sh
pnpm dev:mobile
```

`pnpm dev:mobile` starts Expo in development-build mode. Use it with an installed development build of the app, not Expo Go.

For quick testing in Expo Go:

```sh
pnpm dev:mobile:go
```

For local API access from mobile, set:

```txt
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000
```

For local browser-based Expo testing, include `http://localhost:8081` in both `CORS_ORIGIN` and `BETTER_AUTH_TRUSTED_ORIGINS`.

## Auth

Better Auth is mounted by the API at:

```txt
/auth/*
```

Email/password auth is disabled for now. Google OAuth is the supported provider.

Required auth environment variables:

```txt
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3001,http://localhost:8081,http://localhost:19006
CORS_ORIGIN=http://localhost:3001,http://localhost:8081,http://localhost:19006
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Quality Checks

Run all checks:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Run targeted checks:

```sh
pnpm --filter api build
pnpm --filter api lint
pnpm --filter web check-types
pnpm --filter mobile check-types
pnpm --filter @led/design-system check-types
```

## Formatting

```sh
pnpm format
pnpm format:check
```

## Cloud SQL Notes

The database package uses PostgreSQL and `DATABASE_URL`, so moving from local Postgres to Cloud SQL does not require a schema rewrite.

- Cloud SQL Auth Proxy: keep `DB_SSL=false` and point `DATABASE_URL` at the proxy host/port.
- Direct Cloud SQL TLS: set `DB_SSL=true` and keep `DB_SSL_REJECT_UNAUTHORIZED=true` unless there is a controlled reason to relax it.
