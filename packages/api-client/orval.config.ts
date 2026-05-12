import { defineConfig } from 'orval';

const openApiTarget = process.env.ORVAL_OPENAPI_URL ?? 'http://localhost:3000/api/openapi.json';

export default defineConfig({
  api: {
    input: {
      target: openApiTarget,
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/index.ts',
      schemas: './src/generated/schemas',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: './src/fetcher.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
});
