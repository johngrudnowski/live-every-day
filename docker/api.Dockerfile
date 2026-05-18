FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS manifests

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/conditions/package.json packages/conditions/package.json
COPY packages/database/package.json packages/database/package.json

FROM manifests AS build-deps

RUN pnpm install --frozen-lockfile --filter api...

FROM build-deps AS builder

COPY apps/api apps/api
COPY packages/conditions packages/conditions
COPY packages/database packages/database

RUN pnpm --filter api build

FROM manifests AS prod-deps

ENV NODE_ENV="production"

RUN pnpm install --prod --frozen-lockfile --filter api...

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV="production"
ENV PORT="3000"

WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/package.json ./package.json
COPY --from=prod-deps --chown=node:node /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prod-deps --chown=node:node /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=prod-deps --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps --chown=node:node /app/packages/conditions/package.json ./packages/conditions/package.json
COPY --from=prod-deps --chown=node:node /app/packages/database/package.json ./packages/database/package.json
COPY --from=prod-deps --chown=node:node /app/packages/database/node_modules ./packages/database/node_modules

COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/packages/conditions/dist ./packages/conditions/dist
COPY --from=builder --chown=node:node /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=node:node /app/packages/database/drizzle ./packages/database/drizzle

USER node

EXPOSE 3000

CMD ["node", "apps/api/dist/src/main.js"]
