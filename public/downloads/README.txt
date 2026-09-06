================================================================================
KING J DEALS — OFFICIAL ANDROID RELEASE APK DEPLOYMENT GUIDE
================================================================================

1. EXACT EXPECTED FILE LOCATION:
   public/downloads/King-J-Deals.apk

2. PRODUCTION DOWNLOAD URL:
   https://<your-domain>/downloads/King-J-Deals.apk

3. HOW TO PLACE YOUR RELEASE APK:
   When you build the signed release APK in Android Studio:
   - File output: android/app/build/outputs/apk/release/King-J-Deals.apk (or app-release.apk)
   - Copy or upload that file to: public/downloads/King-J-Deals.apk

4. AUTOMATIC PRODUCTION PACKAGING:
   - When "npm run build" runs, Vite copies all static assets from public/ to dist/
   - The production server automatically serves this binary file directly with:
     * Content-Type: application/vnd.android.package-archive
     * Content-Disposition: attachment; filename="King-J-Deals.apk"
     * Exact Content-Length & Accept-Ranges for resumable mobile downloads.

5. PACKAGE DETAILS:
   - Package Name: com.kingjdeals.app
   - Min SDK: 24 (Android 7.0+)
   - Target SDK: 36
================================================================================
