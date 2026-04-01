# Android Build Guide

How to build the Dipesh Tutorials Android APK.

## Prerequisites

- Node.js 18+
- Android Studio (or just JDK + Android SDK command line tools)
- A Supabase project already set up

## Build Steps

### 1. Build the Web App

```bash
npm run build
```

This outputs to `dist/`.

### 2. Sync to Android Project

```bash
npx cap sync android
```

This copies the web assets into `android/app/src/main/assets/public/`.

### 3. Open in Android Studio (Recommended)

```bash
npx cap open android
```

This opens the Android project in Android Studio. From there:
- Connect a phone or start an emulator
- Click the Run button (▶)

### 4. Build APK from Command Line

```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Generate Release APK

For a signed release build:

1. In Android Studio: Build → Generate Signed Bundle / APK → Android APK
2. Create a keystore (or use an existing one)
3. Choose "release" variant
4. Build

Or from command line:

```bash
cd android
./gradlew assembleRelease
```

## Sharing the APK

The debug APK (`app-debug.apk`) can be shared directly via WhatsApp or uploaded to Google Drive.

For Play Store, you need a release APK with a proper signing key.

## Troubleshooting

**Gradle sync failed**
```bash
cd android && ./gradlew clean
cd .. && npx cap sync android
```

** Capacitor assets not updating**
```bash
npm run build && npx cap copy android && npx cap sync android
```

**Android Studio shows errors but build works**
Try: File → Invalidate Caches → Invalidate and Restart

**APK installs but crashes on launch**
Check Logcat in Android Studio for the crash stack trace. Common causes:
- Wrong `VITE_SUPABASE_URL` in the web assets
- Missing network security config for HTTP (if using non-HTTPS Supabase URL)

## App Info

- App ID: `com.dipeshtutorials.app`
- App Name: Dipesh Tutorials
- Min SDK: 24 (Android 7.0)
- Target SDK: 36
