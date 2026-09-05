# Android Conversion Documentation — King J Deals

**Current Status:** Phase 2 (Native Google Authentication) Completed Successfully  
**Date:** September 4, 2026  
**Platform Target:** Android 14+ (SDK 24 min, SDK 36 target / compile)

---

## 1. Capacitor & Plugin Versions Installed
* **Core:** `@capacitor/core` (`^8.5.1`)
* **CLI:** `@capacitor/cli` (`^8.5.1`)
* **Android Platform:** `@capacitor/android` (`^8.5.1`)
* **Capacitor Plugins:**
  * `@capacitor-firebase/authentication`: `^8.5.1` — Native Google & Firebase Auth adapter for Capacitor 8
  * `@capacitor/app`: `^8.1.1` — App state & deep-link routing
  * `@capacitor/browser`: `^8.0.4` — In-App Browser & Custom Tabs for payment gateways

---

## 2. Android Platform Version Installed
* **Android Gradle Plugin / Native Container:** Capacitor Android 8.5.1
* **Compile SDK Version:** 36 (Android 16 preview / Android 15/14 compliant)
* **Target SDK Version:** 36 (Google Play Store compliant)
* **Minimum SDK Version:** 24 (Android 7.0 Nougat and above)

---

## 3. Application ID & Details
* **Package Name:** `com.kingjdeals.app`
* **Namespace:** `com.kingjdeals.app`
* **App Name:** `King J Deals`
* **Web Directory:** `dist`

---

## 4. Authentication Architecture (Web vs. Native Android)

### Web Environment (`!isNativeApp()`):
* Uses standard Firebase JS SDK `signInWithPopup(auth, provider)` with `GoogleAuthProvider`.
* Zero regressions on desktop and mobile web browsers.
* Includes iframe detection logic for preview environments.
* Upon successful authentication, invokes `syncUserCustomerRecord(user)` to merge user document and assign roles (`admin` vs `user`).

### Android Native Shell (`isNativeApp()`):
* Uses `@capacitor-firebase/authentication` via `FirebaseAuthentication.signInWithGoogle()`.
* Interacts with Android Credential Manager / Google Play Services natively without launching browser popups.
* Converts Google ID token into Firebase Credential via `GoogleAuthProvider.credential(idToken)`.
* Completes sign-in on the client Firebase Auth instance via `signInWithCredential(auth, credential)`.
* Continues invoking the identical `syncUserCustomerRecord(user)` routine.
* Preserves user document structure in `users/{uid}` with customer fields, wallet balance, and admin privileges.

---

## 5. Session Persistence & Security
* **No Token Storage:** Google ID tokens are never written to `localStorage`, Firestore, or plaintext files.
* **SDK Handled Persistence:** Firebase Auth automatically maintains user session in IndexedDB on the web and within the Android container across app restarts.
* **Automatic State Recovery:** Global `onAuthStateChanged` in `src/App.tsx` picks up the existing authenticated user seamlessly upon cold app launches.

---

## 6. Files Modified in Phase 2
1. `package.json` — Added `@capacitor-firebase/authentication` dependency.
2. `capacitor.config.ts` — Added plugin configuration for `FirebaseAuthentication` (`skipNativeAuth: false`, `providers: ['google.com']`).
3. `src/components/AuthModal.tsx` — Implemented native Google Sign-In branching using `isNativeApp()`, token-to-credential conversion, and error handling.
4. `ANDROID_CONVERSION.md` — Updated conversion status and technical guide.

---

## 7. Manual Firebase & Google Cloud Configuration Instructions

> [!IMPORTANT]
> Native Google Sign-In requires registering your Android app inside the Firebase Console and linking your SHA-1 certificate fingerprint.

### Step-by-Step Manual Setup:

#### 1. Retrieve the Android Debug SHA-1 Fingerprint
On your local development machine with Android Studio / JDK installed, run:
```bash
# On Linux / macOS:
cd android && ./gradlew signingReport

# On Windows:
cd android && gradlew.bat signingReport
```
Look for the `SHA1` and `SHA-256` keys under `Variant: debugUnitTest / debug`.

Alternatively, use `keytool`:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### 2. Register Android App in Firebase Console
1. Open the [Firebase Console](https://console.firebase.google.com/) and navigate to your project: **`gen-lang-client-0995971216`**.
2. Go to **Project Settings** (gear icon) > **General** tab.
3. Under the **Your apps** section, click **Add app** and select the **Android** icon.
4. Enter the required parameters:
   * **Android package name:** `com.kingjdeals.app`
   * **App nickname (optional):** King J Deals Android
   * **Debug signing certificate SHA-1:** Paste the SHA-1 fingerprint obtained from step 1.
5. Click **Register app**.

#### 3. Download `google-services.json`
1. Download the generated `google-services.json` file from the Firebase Console.
2. Place the file inside the project at:
   ```
   android/app/google-services.json
   ```
   *(Note: The build scripts in `android/app/build.gradle` are already configured to apply the `com.google.gms.google-services` plugin automatically once this file is detected).*

#### 4. Verify Google Sign-in in Firebase Authentication
1. In Firebase Console, go to **Build** > **Authentication** > **Sign-in method**.
2. Ensure **Google** is enabled under Sign-in providers.
3. Under the Google provider settings, note the **Web SDK configuration** / **Web Client ID**.
4. In Google Cloud Console (**APIs & Services** > **Credentials**), ensure the OAuth 2.0 Client ID for Android matches the package name `com.kingjdeals.app` and your SHA-1.

#### 5. Safe vs. Private Credentials
* **Safe for Client Application:** Package name (`com.kingjdeals.app`), Web Client ID, Firebase API Key, Project ID, `google-services.json` (which contains client public identifiers).
* **Must Remain Private:** Backend Service Account keys (`FIREBASE_SERVICE_ACCOUNT`), Paystack/Korapay secret keys, Production Keystore password & private key.

---

## 8. Build & Verification Status
* **Vite Web & Server Build (`npm run build`):** Succeeded.
* **Capacitor Sync (`npx cap sync android`):** Succeeded. 3 plugins registered (`@capacitor-firebase/authentication`, `@capacitor/app`, `@capacitor/browser`).
* **TypeScript Validation (`tsc --noEmit`):** Succeeded with 0 errors.
* **Firestore Security Rules:** Unchanged.
* **Paystack / Korapay Payment Handlers:** Unchanged.
* **Implementation Status:** Code-complete and synchronized. Native runtime execution is pending the manual placement of `google-services.json` and SHA-1 registration in Firebase Console.
