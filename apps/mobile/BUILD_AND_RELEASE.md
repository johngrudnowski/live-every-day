# Mobile Build And Release

The mobile app uses Expo Continuous Native Generation. Treat `android/` and `ios/` as generated build output unless the project intentionally moves to fully managed native projects.

## Recommended Workflow

For local Android release builds:

```sh
cp apps/mobile/android-keystore.properties.example apps/mobile/android-keystore.properties
# Edit apps/mobile/android-keystore.properties with real secret values.
pnpm mobile:build:android
```

The output bundle is:

```txt
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

Use `pnpm mobile:build:android:no-prebuild` only when you know the generated `android/` directory is already current and you only want to rerun Gradle.

## Signing

Google Play expects Android App Bundles to be signed with an upload key. The local signing file is:

```txt
apps/mobile/android-keystore.properties
```

It is intentionally ignored by git and lives outside `apps/mobile/android/` so `expo prebuild --clean` can safely delete and recreate the native project.

Create the upload keystore with:

```sh
keytool -genkeypair -v -storetype PKCS12 \
  -keystore apps/mobile/android-upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Then set:

```properties
storeFile=../../android-upload.keystore
storePassword=replace-me
keyPassword=replace-me
keyAlias=upload
```

`storeFile` is resolved from `apps/mobile/android/app`, so either use an absolute path or a path relative to that directory.

## Why Prebuild Exists

`expo prebuild --platform android --clean` regenerates the native Android project from `app.config.ts`, installed native packages, and config plugins. Clean prebuild deletes `apps/mobile/android/` first, which is why durable native changes must live in app config or a config plugin instead of hand-edited Gradle files.

This repo uses `plugins/withAndroidReleaseSigning.js` to reapply the Android release signing Gradle configuration during prebuild.

## Local Build Versus Deploy

`pnpm mobile:build:android` only creates a signed `.aab`. It does not upload anything to Google Play.

For the first Google Play release, upload the `.aab` manually in Play Console to an internal testing track or production track. Google requires the first app upload to happen manually before API-based submissions work.

After the first manual upload, a CI-friendly path is:

```sh
eas build --platform android --profile production
eas submit --platform android --profile production
```

EAS Build handles prebuild and injects signing configuration during the build. EAS Submit uploads the result to the selected Google Play track. Local Gradle builds remain useful when you want a fully local artifact or need to debug Android build issues.

## Release Identity

The Android package name in `app.config.ts` becomes the Google Play application ID. Once an app is created in Play Console, changing it means creating a different app listing. Confirm the production package name before the first Play upload.
