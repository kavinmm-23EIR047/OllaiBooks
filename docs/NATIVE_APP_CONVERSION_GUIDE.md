     # ollaiBooks Native App Conversion & Deployment Guide

This guide details how to package and convert the **ollaiBooks Universal Offline POS** into native applications for **Android (APK)**, **iOS/iPadOS**, **Windows Desktop (.exe/.msi)**, and **macOS (.dmg)** with 100% offline database support.

---

## 1. 🤖 Android APK Conversion

### Option A: Local Build with Capacitor & Android Studio (Production APK)
1. **Initialize Capacitor Android**:
   ```bash
   npx @capacitor/cli add android
   npx @capacitor/cli sync android
   ```
2. **Build Debug or Release APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The generated APK will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
3. Sideload this `.apk` directly onto any Android phone, tablet, Sunmi POS, or billing terminal.

### Option B: Cloud 1-Minute APK (No Android Studio Needed)
1. Deploy or tunnel your web app (e.g. via Vercel, Cloudflare, or Ngrok).
2. Visit **[PWABuilder.com](https://www.pwabuilder.com)**.
3. Paste the URL -> Click **Package for Android** -> Download the signed `.apk` and `.aab` (Google Play Store ready).

---

## 2. 🪟 Windows Desktop App (.EXE / .MSI)

### Option A: Native Electron Desktop App
1. From the project root, install the workspace dependencies, then go to the desktop app directory:
   ```bash
   npm install
   cd apps/desktop
   ```
2. **Launch in Kiosk Counter Mode**:
   ```bash
   npm start
   ```
3. **Build Single-File Windows Installer (.exe)**:
   ```bash
   npm run build:win
   ```
   Outputs `ollaiBooks Universal POS-Setup.exe` in `apps/desktop/dist/`.

The installer bundles the POS web app and starts its local server automatically, so opening the desktop app does not require internet access. Offline billing still requires a prior online sign-in on that desktop app; the app then uses its locally stored products and bills while offline.

To enable online sign-in and later sync in the desktop app, set `POS_API_URL` to the deployed API base URL before building (for example, `https://api.example.com/api/v1`). The packaged POS opens offline either way; the API is used for sign-in and syncing when reachable.

### Option B: 1-Click Edge / Chrome Desktop PWA
1. Open `http://localhost:3000/offline-pos` in Microsoft Edge or Google Chrome.
2. Click the **Install App** icon in the address bar (or Menu → Apps → Install ollaiBooks).
3. The app is added directly to your Windows Start Menu, Desktop, and Taskbar.

---

## 3. 🍎 macOS Desktop App (.DMG / .APP)

### Option A: Safari 14+ Native Dock App
1. Open `http://localhost:3000/offline-pos` in Safari on macOS Sonoma 14+.
2. Click **File** → **Add to Dock**.
3. It creates a standalone `.app` in `/Applications` that runs in its own window without Safari tabs.

### Option B: Compile .DMG with Electron
1. Run in `apps/desktop`:
   ```bash
   npm run build:mac
   ```
2. Outputs `ollaiBooks Universal POS.dmg`.

---

## 4. 📱 iPhone & iPad (iPad Billing Counter)

1. Open `http://localhost:3000/offline-pos` in Safari on iPad or iPhone.
2. Tap the **Share** button (box with upward arrow).
3. Tap **Add to Home Screen**.
4. The ollaiBooks POS launches full-screen with native app icons, zero browser navigation bars, and permanent local IndexedDB storage.
