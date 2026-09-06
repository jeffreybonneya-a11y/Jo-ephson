import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface LogDownloadOptions {
  deviceType?: 'android' | 'desktop' | 'ios' | 'unknown';
  source?: string;
  force?: boolean;
}

/**
 * Logs an app download event to Firestore collection `app_downloads`
 * Captures user identity (if logged in), phone, email, device type, user agent, and timestamp.
 */
export async function logAppDownload(options?: LogDownloadOptions): Promise<string | null> {
  try {
    // Avoid duplicate logging within the same session unless forced
    if (!options?.force && typeof sessionStorage !== 'undefined') {
      const alreadyLogged = sessionStorage.getItem('kjd_apk_download_logged');
      if (alreadyLogged) {
        return null;
      }
    }

    const currentUser = auth.currentUser;
    let customerName = 'Visitor (Guest)';
    let customerEmail = '';
    let customerPhone = '';
    let isRegisteredUser = false;

    if (currentUser && !currentUser.isAnonymous) {
      isRegisteredUser = true;
      customerName = currentUser.displayName || 'Registered Customer';
      customerEmail = currentUser.email || '';

      // Attempt to retrieve complete user profile for phone and latest name
      try {
        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as any;
          customerName = profileData.fullName || profileData.name || profileData.displayName || customerName;
          customerPhone = profileData.phone || profileData.phoneNumber || profileData.recipientPhone || '';
          if (!customerEmail && (profileData.email || profileData.gmail)) {
            customerEmail = profileData.email || profileData.gmail;
          }
        }
      } catch (err) {
        // Non-blocking fallback
      }
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let detectedPlatform = 'Desktop / Web Browser';
    if (/android/i.test(ua)) {
      detectedPlatform = 'Android Mobile';
    } else if (/ipad|iphone|ipod/i.test(ua)) {
      detectedPlatform = 'iOS Device';
    }

    const downloadRecord = {
      userId: currentUser?.uid || null,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      isRegisteredUser: isRegisteredUser,
      deviceType: options?.deviceType || (/android/i.test(ua) ? 'android' : 'desktop'),
      platform: detectedPlatform,
      userAgent: ua,
      source: options?.source || 'website_modal',
      downloadUrl: 'https://kingjdeals.site/downloads/King-J-Deals.apk',
      apkName: 'King-J-Deals.apk',
      downloadedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'app_downloads'), downloadRecord);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('kjd_apk_download_logged', 'true');
    }

    return docRef.id;
  } catch (error) {
    console.warn('[AppDownload] Non-fatal download tracking notice:', error);
    return null;
  }
}
