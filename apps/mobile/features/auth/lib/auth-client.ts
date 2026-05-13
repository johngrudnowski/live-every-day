import { expoClient } from '@better-auth/expo/client';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function resolveLocalApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:3000` : 'http://localhost:3000';
}

export function resolveApiUrl() {
  return stripTrailingSlash(process.env.EXPO_PUBLIC_API_URL ?? resolveLocalApiUrl());
}

function resolveScheme() {
  const scheme = Constants.expoConfig?.scheme;

  if (Array.isArray(scheme)) {
    return scheme[0] ?? 'liveeveryday-development';
  }

  return scheme ?? 'liveeveryday-development';
}

export const authClient = createAuthClient({
  baseURL: resolveApiUrl(),
  basePath: '/auth',
  plugins: [
    expoClient({
      scheme: resolveScheme(),
      storagePrefix: 'live-every-day',
      storage: SecureStore,
    }),
  ],
});
