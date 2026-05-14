import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppVariant = 'development' | 'preview' | 'production';

type LiveEveryDayExpoConfig = ExpoConfig & {
  newArchEnabled?: boolean;
};

const appVariant = parseAppVariant(process.env.APP_VARIANT);
const projectId = process.env.EAS_PROJECT_ID;

const shouldUseEasUpdates =
  process.env.ENABLE_EAS_UPDATES === '1' && Boolean(projectId);

function parseAppVariant(value: string | undefined): AppVariant {
  if (value === 'preview' || value === 'production') {
    return value;
  }

  return 'development';
}

function variantSuffix() {
  return appVariant === 'production' ? '' : `.${appVariant}`;
}

function displayName() {
  return appVariant === 'production'
    ? 'Live Every Day'
    : `Live Every Day ${appVariant}`;
}

function scheme() {
  return appVariant === 'production'
    ? 'liveeveryday'
    : `liveeveryday-${appVariant}`;
}

export default ({ config }: ConfigContext): LiveEveryDayExpoConfig => ({
  ...config,
  name: displayName(),
  slug: 'live-every-day',
  scheme: scheme(),
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: `com.led.liveeveryday${variantSuffix()}`,
  },
  android: {
    package: `com.led.liveeveryday${variantSuffix()}`,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  updates: shouldUseEasUpdates
    ? {
        url: `https://u.expo.dev/${projectId}`,
      }
    : undefined,
  runtimeVersion: shouldUseEasUpdates
    ? {
        policy: 'appVersion',
      }
    : undefined,
  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        fonts: [
          './node_modules/@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf',
          './node_modules/@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf',
          './node_modules/@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf',
          './node_modules/@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf',
          './node_modules/@expo-google-fonts/raleway/200ExtraLight/Raleway_200ExtraLight.ttf',
          './node_modules/@expo-google-fonts/raleway/300Light/Raleway_300Light.ttf',
        ],
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1',
        },
        android: {
          minSdkVersion: 26,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVariant,
    eas: projectId ? { projectId } : undefined,
  },
});