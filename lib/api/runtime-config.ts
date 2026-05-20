import type { CreateClientConfig } from './generated/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000',
  withCredentials: false,
});
