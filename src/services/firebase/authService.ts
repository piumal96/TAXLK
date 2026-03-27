/**
 * Firebase Auth Service
 * Handles all authentication operations.
 * Separated from Firestore user operations.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseAuthUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseAuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name on the auth profile
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseAuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<FirebaseAuthUser> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: FirebaseAuthUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
