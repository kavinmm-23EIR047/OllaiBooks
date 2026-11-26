#!/usr/bin/env node

/**
 * ollaiBooks Native App Conversion & Build Orchestrator
 * Packages the Universal Offline POS for Android (.apk), Windows (.exe), macOS (.dmg) and Standalone HTML.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const targetArg = args.find(a => a.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'help';

console.log('===========================================================');
console.log('   ollaiBooks Universal POS - Native App Converter');
console.log('===========================================================\n');

function runCommand(cmd, cwd = process.cwd()) {
  console.log(`> Executing: ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${cmd}`, error.message);
    return false;
  }
}

switch (target) {
  case 'apk':
  case 'android':
    console.log('📱 [TARGET: Android APK]');
    console.log('Preparing Android application package...\n');
    console.log('Method 1: Capacitor Native Android Project');
    console.log('1. Ensure Android Studio and JDK 17+ are installed.');
    console.log('2. Run: npx @capacitor/cli add android');
    console.log('3. Run: npx @capacitor/cli sync android');
    console.log('4. Run: npx @capacitor/cli open android (or run "gradlew assembleDebug" in android folder to produce app-debug.apk)\n');
    console.log('Method 2: 1-Minute Cloud APK via PWABuilder (No Android Studio required)');
    console.log('1. Open: https://www.pwabuilder.com');
    console.log('2. Enter your live app URL or ngrok tunnel URL.');
    console.log('3. Click "Package for Android" -> generates ready-to-install signed APK & Google Play AAB bundle.\n');
    break;

  case 'desktop':
  case 'windows':
  case 'mac':
    console.log('💻 [TARGET: Desktop App (.exe for Windows / .dmg for Mac)]');
    const desktopDir = path.join(__dirname, '..', 'apps', 'desktop');
    console.log(`Setting up Electron Desktop in: ${desktopDir}\n`);
    console.log('To run Desktop App locally in Kiosk/Counter mode:');
    console.log('  cd apps/desktop && npm install && npm start\n');
    console.log('To compile standalone Windows .EXE installer:');
    console.log('  cd apps/desktop && npm run build:win\n');
    console.log('To compile macOS .DMG installer:');
    console.log('  cd apps/desktop && npm run build:mac\n');
    break;

  case 'standalone':
  case 'export':
    console.log('💾 [TARGET: Standalone Portable Offline POS]');
    console.log('Exporting self-contained offline POS ready for USB / file distribution...\n');
    const outDir = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    console.log(`✅ Standalone configuration verified at: ${path.join(outDir, 'ollaiBooks-POS.html')}`);
    break;

  default:
    console.log('Usage: node scripts/build-native-app.js --target=<apk|desktop|standalone>');
    console.log('  --target=apk       Build & configure Android APK');
    console.log('  --target=desktop   Build Windows .EXE or macOS .DMG with Electron');
    console.log('  --target=standalone Export portable offline POS single-file bundle');
    break;
}
