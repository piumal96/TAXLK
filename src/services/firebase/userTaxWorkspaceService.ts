/**
 * Per-user tax workspace: income sources, calculation history, calculator session, YoA, app profile slice.
 * Synced to Firestore so the same account sees the same data across browsers/devices.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { TAX_ASSESSMENT_YEAR } from '@/lib/taxCalculator';
import type { CalculatorSession } from '@/types/workspace';
import type { IncomeSource, TaxHistoryRecord, UserProfile } from '@/types/income';

/** Primary store — matches Firestore `user_data` (see console). */
const COLLECTION = 'user_data';
/** Older app versions wrote here; we still read it once if `user_data` is missing, then save migrates to `user_data`. */
const LEGACY_COLLECTION = 'user_tax_workspace';

export interface UserTaxWorkspacePayload {
  incomeSources: IncomeSource[];
  history: TaxHistoryRecord[];
  assessmentYear: string;
  calculatorSession: CalculatorSession | null;
  profile: UserProfile;
}

export function workspaceHasMeaningfulData(w: Partial<UserTaxWorkspacePayload>): boolean {
  return (
    (w.incomeSources?.length ?? 0) > 0 ||
    (w.history?.length ?? 0) > 0 ||
    w.calculatorSession != null
  );
}

async function ensureFreshAuthToken(): Promise<void> {
  const u = getAuth(app).currentUser;
  if (u) await u.getIdToken(true);
}

function parseWorkspaceDoc(d: Record<string, unknown>): UserTaxWorkspacePayload {
  const incomeSources = Array.isArray(d.incomeSources) ? (d.incomeSources as IncomeSource[]) : [];
  const history = Array.isArray(d.history) ? (d.history as TaxHistoryRecord[]) : [];
  const assessmentYear =
    typeof d.assessmentYear === 'string' && d.assessmentYear.trim()
      ? d.assessmentYear
      : TAX_ASSESSMENT_YEAR;
  const calculatorSession = (d.calculatorSession as CalculatorSession | null | undefined) ?? null;
  const profile = d.profile && typeof d.profile === 'object' ? (d.profile as UserProfile) : null;

  return {
    incomeSources,
    history,
    assessmentYear,
    calculatorSession,
    profile: profile ?? {
      name: '',
      email: '',
      occupation: '',
      defaultIncome: 0,
      inputPreference: 'annual',
    },
  };
}

function readUpdatedAtMillis(raw: Record<string, unknown>): number {
  const ts = raw.updated_at;
  if (ts && typeof (ts as { toMillis?: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export type FetchUserTaxWorkspaceResult =
  | { ok: true; docExists: false }
  | { ok: true; docExists: true; data: UserTaxWorkspacePayload; updatedAtMs: number }
  | { ok: false; error: unknown };

/**
 * Loads workspace from Firestore with auth refresh and retries (handles token / network timing right after login).
 */
export async function fetchUserTaxWorkspace(uid: string): Promise<FetchUserTaxWorkspaceResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await ensureFreshAuthToken();

      const readCol = (name: string) => {
        const ref = doc(db, name, uid);
        return getDoc(ref);
      };

      let snap = await readCol(COLLECTION);
      if (!snap.exists()) {
        snap = await readCol(LEGACY_COLLECTION);
      }

      if (!snap.exists()) return { ok: true, docExists: false };
      const raw = snap.data();
      if (!raw || typeof raw !== 'object') {
        return { ok: true, docExists: true, data: parseWorkspaceDoc({}), updatedAtMs: 0 };
      }
      const rec = raw as Record<string, unknown>;
      return {
        ok: true,
        docExists: true,
        data: parseWorkspaceDoc(rec),
        updatedAtMs: readUpdatedAtMillis(rec),
      };
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  if (import.meta.env.DEV) {
    console.warn('[TaxWorkspace] Firestore read failed after retries — using local cache only.', lastError);
  }
  return { ok: false, error: lastError };
}

export async function saveUserTaxWorkspace(uid: string, data: UserTaxWorkspacePayload): Promise<void> {
  await ensureFreshAuthToken();
  const ref = doc(db, COLLECTION, uid); // always user_data — migrates off legacy collection
  await setDoc(
    ref,
    {
      incomeSources: data.incomeSources,
      history: data.history,
      assessmentYear: data.assessmentYear,
      calculatorSession: data.calculatorSession ?? null,
      profile: data.profile,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}
