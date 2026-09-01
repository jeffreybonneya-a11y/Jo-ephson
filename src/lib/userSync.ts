import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

export const ADMIN_EMAILS = [
  'kingjdeals@gmail.com',
  'jeffreybonneya@gmail.com',
  'emmagyapong62@gmail.com'
];

/**
 * Safely synchronizes customer email and authentication details from Firebase Auth into Firestore.
 * 
 * - Zero damage: NEVER deletes or resets existing customer documents or unrelated fields.
 * - Uses setDoc(..., { merge: true }) with partial updates to preserve wallet balance, orders, agent status, etc.
 * - Extracts authenticated user info: uid, email, displayName, photoURL, phoneNumber, providerId, metadata.
 * - If Firestore sync encounters any network or permission error, it catches it and continues login gracefully.
 */
export async function syncUserCustomerRecord(user: User): Promise<void> {
  if (!user || !user.uid || user.isAnonymous) {
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const userFullName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
    const userUsername = user.displayName
      ? user.displayName.toLowerCase().replace(/\s+/g, '_')
      : user.email
      ? user.email.split('@')[0]
      : 'customer';

    const cleanEmail = (user.email || '').trim();
    const isEmailAdmin = ADMIN_EMAILS.includes(cleanEmail.toLowerCase());

    const rawProvider = user.providerData?.[0]?.providerId || '';
    const authProvider =
      rawProvider === 'google.com' || cleanEmail.toLowerCase().endsWith('@gmail.com')
        ? 'Google'
        : rawProvider === 'password'
        ? 'Email/Password'
        : rawProvider || (cleanEmail ? 'Google' : 'Unknown');

    const creationTime = user.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toISOString()
      : new Date().toISOString();
    const lastSignIn = user.metadata?.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).toISOString()
      : new Date().toISOString();

    if (!userDoc.exists()) {
      // Create new customer document with only the required fields
      const newCustomer: Partial<UserProfile> & Record<string, any> = {
        uid: user.uid,
        id: user.uid,
        email: cleanEmail,
        gmail: cleanEmail,
        fullName: userFullName,
        displayName: user.displayName || userFullName,
        username: userUsername,
        role: isEmailAdmin ? 'admin' : 'user',
        walletBalance: 0,
        photoURL: user.photoURL || '',
        authProvider: authProvider,
        providerId: rawProvider || 'google.com',
        createdAt: creationTime,
        lastLoginAt: lastSignIn,
        lastSignInTime: lastSignIn,
        topupReference: 'KJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      };

      if (user.phoneNumber) {
        newCustomer.phoneNumber = user.phoneNumber;
      }

      await setDoc(userRef, newCustomer, { merge: true });
    } else {
      // Existing customer document: perform partial update, preserving all existing data
      const existingData = userDoc.data() || {};
      const updates: Partial<UserProfile> & Record<string, any> = {
        lastLoginAt: lastSignIn,
        lastSignInTime: lastSignIn,
      };

      // Safely sync email from Firebase Auth if missing or changed in Firebase Auth
      if (cleanEmail) {
        if (!existingData.email || existingData.email !== cleanEmail) {
          updates.email = cleanEmail;
        }
        if (!existingData.gmail || existingData.gmail !== cleanEmail) {
          updates.gmail = cleanEmail;
        }
      }

      if (!existingData.fullName && userFullName) {
        updates.fullName = userFullName;
      }
      if (!existingData.displayName && user.displayName) {
        updates.displayName = user.displayName;
      }
      if (!existingData.username && userUsername) {
        updates.username = userUsername;
      }
      if (!existingData.id) {
        updates.id = user.uid;
      }
      if (!existingData.uid) {
        updates.uid = user.uid;
      }
      if (!existingData.createdAt) {
        updates.createdAt = creationTime;
      }
      if (!existingData.authProvider && authProvider) {
        updates.authProvider = authProvider;
      }
      if (!existingData.providerId && rawProvider) {
        updates.providerId = rawProvider;
      }
      if (user.photoURL && !existingData.photoURL) {
        updates.photoURL = user.photoURL;
      }
      if (user.phoneNumber && !existingData.phoneNumber) {
        updates.phoneNumber = user.phoneNumber;
      }
      if (isEmailAdmin && existingData.role !== 'admin') {
        updates.role = 'admin';
      }

      await setDoc(userRef, updates, { merge: true });
    }
  } catch (error) {
    // Log error safely without preventing customer authentication or app execution
    console.warn('[Customer Email Sync] Failed to sync customer record safely to Firestore:', error);
  }
}
