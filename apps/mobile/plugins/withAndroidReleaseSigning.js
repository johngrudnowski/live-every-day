const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING_PROPERTIES_BLOCK = `def primaryReleaseKeystorePropertiesFile = rootProject.file('../android-keystore.properties')
def legacyReleaseKeystorePropertiesFile = rootProject.file('keystore.properties')
def releaseKeystorePropertiesFile = primaryReleaseKeystorePropertiesFile.exists() ? primaryReleaseKeystorePropertiesFile : legacyReleaseKeystorePropertiesFile
def releaseKeystoreProperties = new Properties()
def requestedReleaseSigningTask = gradle.startParameter.taskNames.any { taskName ->
    def normalizedTaskName = taskName.toLowerCase()
    normalizedTaskName.contains('release') && (normalizedTaskName.contains('bundle') || normalizedTaskName.contains('assemble'))
}
if (releaseKeystorePropertiesFile.exists()) {
    releaseKeystoreProperties.load(new FileInputStream(releaseKeystorePropertiesFile))
}
if (requestedReleaseSigningTask) {
    ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'].each { key ->
        if (!releaseKeystoreProperties[key]) {
            throw new GradleException("Missing Android release signing property '\${key}' in \${releaseKeystorePropertiesFile}. Copy android-keystore.properties.example to android-keystore.properties and fill it in.")
        }
    }
}`;

const RELEASE_SIGNING_CONFIG = `        release {
            if (releaseKeystorePropertiesFile.exists()) {
                storeFile file(releaseKeystoreProperties['storeFile'])
                storePassword releaseKeystoreProperties['storePassword']
                keyAlias releaseKeystoreProperties['keyAlias']
                keyPassword releaseKeystoreProperties['keyPassword']
            }
        }`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = addSigningProperties(config.modResults.contents);
    config.modResults.contents = addReleaseSigningConfig(config.modResults.contents);
    config.modResults.contents = useReleaseSigningConfig(config.modResults.contents);

    return config;
  });
}

function addSigningProperties(contents) {
  if (contents.includes('releaseKeystorePropertiesFile')) {
    return contents;
  }

  return replaceOrThrow(
    contents,
    /(^def jscFlavor = .+\n)/m,
    `$1\n${SIGNING_PROPERTIES_BLOCK}\n`,
    'Could not find jscFlavor declaration in android/app/build.gradle',
  );
}

function addReleaseSigningConfig(contents) {
  if (contents.includes("storeFile file(releaseKeystoreProperties['storeFile'])")) {
    return contents;
  }

  const signingConfigsPattern =
    /(signingConfigs\s*\{\n\s*debug\s*\{[\s\S]*?\n\s{8}\})(?:\n\s*release\s*\{[\s\S]*?\n\s{8}\})?(\n\s{4}\})/;

  return replaceOrThrow(
    contents,
    signingConfigsPattern,
    `$1\n${RELEASE_SIGNING_CONFIG}$2`,
    'Could not find signingConfigs block in android/app/build.gradle',
  );
}

function useReleaseSigningConfig(contents) {
  return replaceOrThrow(
    contents,
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.(debug|release)/,
    '$1signingConfig signingConfigs.release',
    'Could not find release buildType signingConfig in android/app/build.gradle',
  );
}

function replaceOrThrow(contents, pattern, replacement, message) {
  if (!pattern.test(contents)) {
    throw new Error(message);
  }

  return contents.replace(pattern, replacement);
}

module.exports = withAndroidReleaseSigning;
module.exports._internal = {
  addReleaseSigningConfig,
  addSigningProperties,
  useReleaseSigningConfig,
};
