import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: {
    path: 'lib/api/generated',
    postProcess: ['prettier'],
  },
  plugins: [
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: './lib/api/runtime-config.ts',
    },
    '@hey-api/schemas',
    {
      name: '@hey-api/sdk',
      operations: { strategy: 'byTags' },
    },
    {
      name: '@hey-api/typescript',
      enums: 'javascript',
    },
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      mutationOptions: true,
      infiniteQueryOptions: true,
    },
  ],
});
