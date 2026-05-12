# AGENTS

## Project Overview

- TypeScript monorepo managed with Turborepo and pnpm workspaces.
- Main apps: `apps/api` (NestJS), `apps/web` (React + Vite)
- Shared packages: `packages/database` (Drizzle + Postgres), `packages/api-client` (`@led/api-client`)

## Core Coding Principles

- Prefer small, composable functions and focused changes.
- Keep files manageable; split code by responsibility so UI, stateful logic, and side effects do not accumulate in one file.
- Use strict TypeScript patterns already present in the repo.
- Follow existing architecture and naming patterns before introducing new structure.
- Add or update tests when business logic changes.

## Monorepo Boundaries

- Put shared logic in `packages/*`.
- Do not add dependencies from one app to another app.
- Prefer workspace imports (for example `@led/database`) over deep cross-project relative imports.
- Keep app-specific code inside its app folder.

## Fast Command Reference

- Install dependencies: `pnpm install`
- Run full stack: `pnpm dev`
- Build all projects: `pnpm build`
- Run tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Regenerate API client: `pnpm generate`

## Database Workflow (Postgres + Drizzle)

- Start local DB: `pnpm db:up`
- Full local DB setup (start + migrate + seed): `pnpm db:setup`
- Generate migrations: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate` (`@led/database`)
- Open Drizzle Studio: `pnpm db:studio`
- Reset local DB schema/data: `pnpm db:reset`
- Seed data: `pnpm db:seed`

### Direct Database Querying

- Local connection string:
  `postgresql://postgres:postgres@localhost:5433/live_every_day`
- Query directly with:
  `psql postgresql://postgres:postgres@localhost:5433/live_every_day`

## App-Specific Run/Check Commands

- API dev: `pnpm --filter api dev`
- API tests: `pnpm --filter api test`
- API typecheck: `pnpm --filter api check-types`
- Web dev: `pnpm --filter web dev`
- Web tests: `pnpm --filter web test`
- Web typecheck: `pnpm --filter web check-types`

## When Modifying Code

- Find and follow existing patterns in nearby files first.
- Keep edits minimal and task-focused; avoid unrelated refactors.
- Validate with targeted checks first, then broader repo checks when needed.
- Do not introduce new frameworks or major dependencies without approval.

## Scope of This File

- This file is intentionally minimal and high-signal.
- It provides shared context across AI tools and replaces scattered legacy rule snippets.
