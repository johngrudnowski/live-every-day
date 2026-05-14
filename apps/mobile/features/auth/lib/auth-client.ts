import { expoClient } from '@better-auth/expo/client';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { Platform } from 'react-native';

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function resolveLocalApiUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (
      Constants as typeof Constants & {
        expoGoConfig?: { debuggerHost?: string };
      }
    ).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
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
