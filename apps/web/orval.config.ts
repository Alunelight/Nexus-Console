import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: '../api/openapi/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/endpoints',
      schemas: 'src/api/models',
      client: 'react-query',
      baseUrl: 'http://localhost:8000',
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
