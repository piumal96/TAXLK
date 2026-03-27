/**
 * Auth Context
 * Manages Firebase auth state + Firestore user document.
 * Single source of truth for authentication across the app.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User as FirebaseAuthUser } from 'firebase/auth';
import type { FirestoreUser, AuthProvider as AuthProviderType } from '@/types/auth';
import { onAuthChange, signOut as authSignOut } from '@/services/firebase/authService';
import { createOrUpdateUser } from '@/services/firebase/userService';

interface AuthContextValue {
  user: FirestoreUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshUser: () => {},
});

/**
 * Fallback: build a FirestoreUser from Firebase Auth data alone.
 * Used when Firestore is unreachable or rules block the write.
 * Role defaults to "user" — safe, as admin access is still blocked by Firestore rules.
 */
function buildFallbackUser(authUser: FirebaseAuthUser): FirestoreUser {
  const provider: AuthProviderType = authUser.providerData.some(
    (p) => p.providerId === 'google.com'
  )
    ? 'google'
    : 'email';

  return {
    uid: authUser.uid,
    name: authUser.displayName || '',
    email: authUser.email || '',
    photo_url: authUser.photoURL || null,
    provider,
    role: 'user',
    created_at: new Date(),
    last_login: new Date(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshUser = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setError(null);

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Sync auth user → Firestore document (safe: won't overwrite role/created_at)
        const firestoreUser = await createOrUpdateUser(authUser);
        setUser(firestoreUser);
      } catch (err: unknown) {
        // Firestore rules may not be deployed yet. Use fallback so the user
        // can still navigate — they won't get admin access without a real Firestore doc.
        console.warn(
          '[AuthContext] Firestore sync failed — using auth fallback user.',
          (err as Error)?.message
        );
        setError(null); // Don't show error to user on first load
        setUser(buildFallbackUser(authUser));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [refreshCount]);

  const handleSignOut = useCallback(async () => {
    try {
      await authSignOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut: handleSignOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
