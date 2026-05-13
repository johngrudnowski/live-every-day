import { configureApiClient } from '@led/api-client';
import { Platform } from 'react-native';

import { authClient, resolveApiUrl } from '@/features/auth/lib/auth-client';

configureApiClient({
  baseUrl: resolveApiUrl,
  getHeaders: () => {
    if (Platform.OS === 'web') {
      return new Headers();
    }

    const cookie = (authClient as typeof authClient & { getCookie?: () => string }).getCookie?.();
    return cookie ? { cookie } : new Headers();
  },
});
