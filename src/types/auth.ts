// Firebase Auth & User Types
// Separated from business logic (tax) types

export type UserRole = 'user' | 'admin';

export type AuthProvider = 'email' | 'google';

/** Firestore user document shape — mirrors the `users` collection */
export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  photo_url: string | null;
  provider: AuthProvider;
  role: UserRole;
  created_at: Date;
  last_login: Date;
}

/** Subset of fields that can be safely updated (never role or created_at) */
export type SafeUpdateFields = Pick<FirestoreUser, 'name' | 'photo_url' | 'last_login'>;

/** Auth context state */
export interface AuthState {
  user: FirestoreUser | null;
  loading: boolean;
  error: string | null;
}
