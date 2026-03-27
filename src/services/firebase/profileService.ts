/**
 * Tax Profile Service
 * Handles save/load of extended personal details for tax filing.
 * Collection: user_profiles/{uid}
 *
 * SEPARATE from users/{uid} — that collection is auth-only.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TaxProfile } from '@/types/taxProfile';
import { defaultTaxProfile } from '@/types/taxProfile';

const COLLECTION = 'user_profiles';

/**
 * Load a user's tax profile from Firestore.
 * Returns defaultTaxProfile if no document exists yet.
 */
export async function getTaxProfile(uid: string): Promise<TaxProfile> {
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { ...defaultTaxProfile };

  const data = snap.data();
  return {
    ...defaultTaxProfile,
    ...data,
    updated_at: data.updated_at?.toDate?.() ?? undefined,
  } as TaxProfile;
}

/**
 * Save (merge) a user's tax profile to Firestore.
 * Always stamps updated_at with server timestamp.
 */
export async function saveTaxProfile(uid: string, profile: Omit<TaxProfile, 'updated_at'>): Promise<void> {
  const ref = doc(db, COLLECTION, uid);
  await setDoc(ref, { ...profile, updated_at: serverTimestamp() }, { merge: true });
}
