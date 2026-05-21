import type { CreateClientConfig } from './generated/client.gen';

// TODO(nx-monorepo): when this app is hosted inside the NX monorepo, replace
// this shim with a read from the host's AuthContext (e.g. `useAuth().token`).
// Returning undefined/empty skips the Authorization header so local dev
// against an unauthenticated backend still works.
function getAuthToken(): string | undefined {
  if (typeof process !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_AUTH_TOKEN || undefined;
  }
  return undefined;
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  // Empty baseURL = same-origin, which routes through the mock handlers in
  // `app/api/v2/VulnerabilityCm/*`. Set NEXT_PUBLIC_API_BASE_URL to the real
  // backend to bypass the mocks.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  withCredentials: false,
  // hey-api consumes this for every operation whose security[] declares an
  // apiKey/http scheme. The SDK adds the resolved token as `Authorization`
  // by default (see security[] in sdk.gen.ts).
  auth: () => getAuthToken(),
});
