<p align="center">
  <img src="assets/logos/led-full-logo.svg" alt="Live Every Day" width="420" />
</p>

<p align="center">
  <a href="https://nestjs.com/"><img alt="NestJS" src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white"></a>
  <a href="https://expo.dev/"><img alt="Expo" src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white"></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB"></a>
  <a href="https://turbo.build/repo"><img alt="Turbo" src="https://img.shields.io/badge/Turbo-000000?logo=turborepo&logoColor=white"></a>
  <a href="https://pnpm.io/"><img alt="pnpm" src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white"></a>
  <a href="https://nodejs.org/"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=white"></a>
</p>

# Live Every Day

Live Every Day is a TypeScript monorepo for the Live Every Day product. It includes a NestJS API, a React web app, an Expo mobile app, shared database schema, a generated API client, and a React Native design system.

## Quick Links

- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Development Commands](#development-commands)
- [API Client Generation](#api-client-generation)
- [Mobile App](#mobile-app)
- [Auth](#auth)
- [Quality Checks](#quality-checks)

## Highlights

- Monorepo with shared contracts and typed clients.
- OpenAPI-driven API client generation with Orval.
- Better Auth-based auth flow for web and mobile.
- Shared React Native design system package.

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

- `mise` (recommended)
- Node.js `>=18`
- pnpm
- Docker, for local Postgres

Ideal setup:

```sh
mise install
```

This repo is configured with `mise.toml`, so `mise install` will set up the expected local toolchain (except Docker).

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
pnpm db:seed -- --email dev@example.com --all
pnpm db:studio   # open Drizzle Studio
```

Local database URL:

```txt
postgresql://postgres:postgres@localhost:5432/live_every_day
```

Seed modules are composable and user-scoped:

```sh
pnpm db:seed -- --email dev@example.com --weekly-checkins --weeks 12
pnpm db:seed -- --email dev@example.com --vitals --vital-readings 30
pnpm db:seed -- --email dev@example.com --conditions --condition mpn
```

Non-local database URLs require `--allow-remote`.

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

Android notes:

- Android emulator: use `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- Physical Android device: use your machine LAN IP (for example `http://192.168.1.20:3000`)

For local browser-based Expo testing, include `http://localhost:8081` in both `CORS_ORIGIN` and `BETTER_AUTH_TRUSTED_ORIGINS`.

Build a signed Android App Bundle locally:

```sh
pnpm mobile:build:android
```

See `apps/mobile/BUILD_AND_RELEASE.md` for Android signing, prebuild, EAS Build, and Google Play release notes.

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

Local Android OAuth callback checklist:

1. Set `BETTER_AUTH_URL` to an address reachable by the phone/emulator (not `localhost` on physical devices), for example:

```txt
BETTER_AUTH_URL=http://192.168.1.20:3000
```

2. In Google Cloud Console, add the Better Auth callback URI:

```txt
http://192.168.1.20:3000/auth/callback/google
```

3. Ensure `BETTER_AUTH_TRUSTED_ORIGINS` includes your Expo origin(s) and the app scheme (`liveeveryday-development://` for dev variant).

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
