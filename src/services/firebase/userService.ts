/**
 * Firebase User Service
 * Handles all Firestore user document operations.
 * CRITICAL: Never overwrites `role` or `created_at`.
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { User as FirebaseAuthUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { FirestoreUser, AuthProvider, UserRole } from '@/types/auth';

const USERS_COLLECTION = 'users';

/**
 * Determines the auth provider from Firebase Auth user
 */
function getProvider(authUser: FirebaseAuthUser): AuthProvider {
  const providerData = authUser.providerData;
  if (providerData.some((p) => p.providerId === 'google.com')) return 'google';
  return 'email';
}

/**
 * CORE FUNCTION: createOrUpdateUser
 *
 * Rules:
 * - Uses uid as document ID (prevents duplicates)
 * - If NOT EXISTS → creates with role="user"
 * - If EXISTS → updates ONLY safe fields (name, photo, last_login)
 * - NEVER overwrites: role, created_at
 */
export async function createOrUpdateUser(authUser: FirebaseAuthUser): Promise<FirestoreUser> {
  const userRef = doc(db, USERS_COLLECTION, authUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New user — create document
    const newUser: FirestoreUser = {
      uid: authUser.uid,
      name: authUser.displayName || '',
      email: authUser.email || '',
      photo_url: authUser.photoURL || null,
      provider: getProvider(authUser),
      role: 'user',
      created_at: new Date(),
      last_login: new Date(),
    };

    await setDoc(userRef, {
      ...newUser,
      created_at: serverTimestamp(),
      last_login: serverTimestamp(),
    });

    return newUser;
  }

  // Existing user — update safe fields only
  const existingData = userSnap.data() as FirestoreUser;

  const safeUpdates: Record<string, unknown> = {
    last_login: serverTimestamp(),
  };

  // Update name/photo only if changed (e.g. Google profile update)
  if (authUser.displayName && authUser.displayName !== existingData.name) {
    safeUpdates.name = authUser.displayName;
  }
  if (authUser.photoURL && authUser.photoURL !== existingData.photo_url) {
    safeUpdates.photo_url = authUser.photoURL;
  }

  await updateDoc(userRef, safeUpdates);

  return {
    ...existingData,
    ...safeUpdates,
    last_login: new Date(),
    // Preserve timestamps that came from Firestore
    created_at: existingData.created_at?.toDate?.()
      ? existingData.created_at.toDate()
      : existingData.created_at,
  } as FirestoreUser;
}

/**
 * Fetch a single user document by UID
 */
export async function getUserByUid(uid: string): Promise<FirestoreUser | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  const data = userSnap.data();
  return {
    ...data,
    created_at: data.created_at?.toDate?.() ? data.created_at.toDate() : data.created_at,
    last_login: data.last_login?.toDate?.() ? data.last_login.toDate() : data.last_login,
  } as FirestoreUser;
}

/**
 * Get user role — used for route guards
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  const user = await getUserByUid(uid);
  return user?.role ?? null;
}

// ─── Admin-only queries ───

/**
 * Fetch all users (admin only — protected by Firestore rules)
 */
export async function getAllUsers(
  pageSize = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ users: FirestoreUser[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, USERS_COLLECTION),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const users = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      created_at: data.created_at?.toDate?.() ? data.created_at.toDate() : data.created_at,
      last_login: data.last_login?.toDate?.() ? data.last_login.toDate() : data.last_login,
    } as FirestoreUser;
  });

  const last = snapshot.docs[snapshot.docs.length - 1] || null;
  return { users, lastDoc: last };
}

/**
 * Search users by email (admin only)
 */
export async function searchUsersByEmail(emailPrefix: string): Promise<FirestoreUser[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('email', '>=', emailPrefix),
    where('email', '<=', emailPrefix + '\uf8ff'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      created_at: data.created_at?.toDate?.() ? data.created_at.toDate() : data.created_at,
      last_login: data.last_login?.toDate?.() ? data.last_login.toDate() : data.last_login,
    } as FirestoreUser;
  });
}
