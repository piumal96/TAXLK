/**
 * Tax Profile Service
 * Handles save/load of extended personal details for tax filing.
 * Collection: user_profiles/{uid}
 *
 * SEPARATE from users/{uid} — that collection is auth-only.
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import type { TaxProfile } from '@/types/taxProfile';
import { defaultTaxProfile } from '@/types/taxProfile';

const COLLECTION = 'user_profiles';
/** Fallback when `user_profiles` rules are missing or deny writes — same owner can update `users/{uid}`. */
const USERS_COLLECTION = 'users';

async function ensureFreshAuthToken(): Promise<void> {
  const u = getAuth(app).currentUser;
  if (u) await u.getIdToken(true);
}

async function saveTaxProfileOnUserDoc(uid: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    await ensureFreshAuthToken();
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      tax_profile: payload,
      tax_profile_updated_at: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

function localStorageKey(uid: string): string {
  return `taxlk-tax-profile-${uid}`;
}

/** Firestore rejects `undefined`; strip keys so setDoc does not throw client-side. */
function prepareTaxProfilePayload(profile: Omit<TaxProfile, 'updated_at'>): Record<string, unknown> {
  const copy = { ...profile };
  if (typeof copy.default_income === 'number' && !Number.isFinite(copy.default_income)) {
    copy.default_income = 0;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(copy)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function loadTaxProfileFromLocal(uid: string): Partial<TaxProfile> | null {
  try {
    const raw = localStorage.getItem(localStorageKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as Partial<TaxProfile>;
  } catch {
    return null;
  }
}

function saveTaxProfileToLocal(uid: string, payload: Record<string, unknown>): void {
  try {
    localStorage.setItem(localStorageKey(uid), JSON.stringify(payload));
  } catch {
    // private mode / quota
  }
}

/**
 * Load a user's tax profile from Firestore, merged with any local backup.
 * Local data is used when offline, permission denied, or no cloud doc yet.
 */
export async function getTaxProfile(uid: string): Promise<TaxProfile> {
  const local = loadTaxProfileFromLocal(uid);
  let remote: TaxProfile | null = null;

  try {
    const ref = doc(db, COLLECTION, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      remote = {
        ...defaultTaxProfile,
        ...data,
        updated_at: data.updated_at?.toDate?.() ?? undefined,
      } as TaxProfile;
    }
  } catch {
    // offline / rules / network — fall back to defaults + local only
  }

  let fromUserDoc: Partial<TaxProfile> | null = null;
  if (!remote) {
    try {
      const userSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
      const raw = userSnap.data()?.tax_profile;
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        fromUserDoc = raw as Partial<TaxProfile>;
      }
    } catch {
      // ignore
    }
  }

  const base = { ...defaultTaxProfile, ...(local ?? {}), ...(fromUserDoc ?? {}) };
  return (remote ? { ...base, ...remote } : base) as TaxProfile;
}

/**
 * Save (merge) a user's tax profile: always writes a local backup, then syncs to Firestore when possible.
 */
export async function saveTaxProfile(
  uid: string,
  profile: Omit<TaxProfile, 'updated_at'>,
): Promise<{ cloudSynced: boolean }> {
  const payload = prepareTaxProfilePayload(profile);
  saveTaxProfileToLocal(uid, payload);

  try {
    await ensureFreshAuthToken();
    const ref = doc(db, COLLECTION, uid);
    await setDoc(ref, { ...payload, updated_at: serverTimestamp() }, { merge: true });
    return { cloudSynced: true };
  } catch {
    const ok = await saveTaxProfileOnUserDoc(uid, payload);
    return { cloudSynced: ok };
  }
}
