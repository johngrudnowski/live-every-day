#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const sourceLogo = join(repoRoot, 'assets/logos/led-logo.svg');
const imageDir = join(repoRoot, 'apps/mobile/assets/images');
const canvasColor = '#FFFCF5';
const iconSize = 1024;

const outputs = {
  icon: join(imageDir, 'icon.png'),
  adaptiveIcon: join(imageDir, 'adaptive-icon.png'),
  splashIcon: join(imageDir, 'splash-icon.png'),
  favicon: join(imageDir, 'favicon.png'),
};

const androidResDir = join(repoRoot, 'apps/mobile/android/app/src/main/res');
const iosImageAssetsDir = join(repoRoot, 'apps/mobile/ios/LiveEveryDaydevelopment/Images.xcassets');

function runMagick(args) {
  try {
    execFileSync('magick', args, { stdio: 'inherit' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('ImageMagick is required. Install the `magick` CLI and rerun this script.');
    }

    throw error;
  }
}

function renderLogo(tempDir, size) {
  const output = join(tempDir, `logo-${size}.png`);
  runMagick([
    '-density',
    '768',
    '-background',
    'none',
    sourceLogo,
    '-resize',
    `${size}x${size}`,
    '-strip',
    '-depth',
    '8',
    output,
  ]);
  return output;
}

function composeSquare({ background, logoSize, output }) {
  const tempDir = mkdtempSync(join(tmpdir(), 'led-brand-assets-'));

  try {
    const logo = renderLogo(tempDir, logoSize);
    runMagick([
      '-size',
      `${iconSize}x${iconSize}`,
      `xc:${background}`,
      logo,
      '-gravity',
      'center',
      '-composite',
      '-strip',
      '-depth',
      '8',
      output,
    ]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function resizeImage(input, size, output) {
  runMagick([input, '-resize', `${size}x${size}!`, '-strip', '-depth', '8', output]);
}

composeSquare({
  background: canvasColor,
  logoSize: iconSize,
  output: outputs.icon,
});

composeSquare({
  background: 'none',
  logoSize: iconSize,
  output: outputs.adaptiveIcon,
});

composeSquare({
  background: 'none',
  logoSize: 448,
  output: outputs.splashIcon,
});

runMagick([outputs.icon, '-resize', '48x48', '-strip', '-depth', '8', outputs.favicon]);

if (existsSync(androidResDir)) {
  const iconDensities = [
    { directory: 'mipmap-mdpi', icon: 48, foreground: 108 },
    { directory: 'mipmap-hdpi', icon: 72, foreground: 162 },
    { directory: 'mipmap-xhdpi', icon: 96, foreground: 216 },
    { directory: 'mipmap-xxhdpi', icon: 144, foreground: 324 },
    { directory: 'mipmap-xxxhdpi', icon: 192, foreground: 432 },
  ];

  iconDensities.forEach(({ directory, icon, foreground }) => {
    const densityDir = join(androidResDir, directory);

    resizeImage(outputs.icon, icon, join(densityDir, 'ic_launcher.webp'));
    resizeImage(outputs.icon, icon, join(densityDir, 'ic_launcher_round.webp'));
    resizeImage(outputs.adaptiveIcon, foreground, join(densityDir, 'ic_launcher_foreground.webp'));
  });

  const splashDensities = [
    { directory: 'drawable-mdpi', size: 288 },
    { directory: 'drawable-hdpi', size: 432 },
    { directory: 'drawable-xhdpi', size: 576 },
    { directory: 'drawable-xxhdpi', size: 864 },
    { directory: 'drawable-xxxhdpi', size: 1152 },
  ];

  splashDensities.forEach(({ directory, size }) => {
    resizeImage(outputs.splashIcon, size, join(androidResDir, directory, 'splashscreen_logo.png'));
  });
}

if (existsSync(iosImageAssetsDir)) {
  const appIcon = join(iosImageAssetsDir, 'AppIcon.appiconset/App-Icon-1024x1024@1x.png');
  const splashImageSet = join(iosImageAssetsDir, 'SplashScreenLegacy.imageset');

  copyFileSync(outputs.icon, appIcon);
  copyFileSync(outputs.splashIcon, join(splashImageSet, 'image.png'));
  copyFileSync(outputs.splashIcon, join(splashImageSet, 'image@2x.png'));
  copyFileSync(outputs.splashIcon, join(splashImageSet, 'image@3x.png'));
}

console.log('Generated mobile brand assets:');
Object.values(outputs).forEach((output) => console.log(`- ${output}`));
